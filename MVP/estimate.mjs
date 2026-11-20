import {unzipSync,strFromU8} from 'fflate';
import {XMLParser} from 'fast-xml-parser';
import path from 'node:path';

const list=x=>x==null?[]:Array.isArray(x)?x:[x];
const meta=x=>Object.fromEntries(list(x?.metadata).map(m=>[m.key,m.value]));
const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'',processEntities:false});
const identity=p=>p;
function placement(t,parent){
  if(!t)return parent;
  const m=t.trim().split(/\s+/).map(Number);
  if(m.length!==12||!m.every(Number.isFinite))throw Error('Unsupported placement');
  return p=>parent([0,1,2].map(i=>p[0]*m[i]+p[1]*m[i+3]+p[2]*m[i+6]+m[i+9]));
}
// Half-open triangle/plane intersections. Oriented segments subtract internal holes.
function sections(mesh,transform,height,first,budget){
  const points=list(mesh.vertices?.vertex).map(p=>transform([+p.x,+p.y,+p.z]));
  let lo=Infinity,hi=-Infinity;
  for(const p of points){if(!p.every(Number.isFinite))throw Error('Invalid mesh');lo=Math.min(lo,p[2]);hi=Math.max(hi,p[2]);}
  const count=1+Math.max(0,Math.ceil((hi-lo-first)/height-1e-7));
  if(!points.length||count>5000||hi<=lo)throw Error('Unsupported mesh dimensions');
  const layers=Array.from({length:count},(_,i)=>{
    const bottom=i?lo+first+(i-1)*height:lo,h=Math.min(i?height:first,hi-bottom);
    return {z:bottom+h/2,h,area:0,perimeter:0};
  });
  for(const tri of list(mesh.triangles?.triangle)){
    const pts=[tri.v1,tri.v2,tri.v3].map(i=>points[i]);
    if(pts.some(p=>!p))throw Error('Invalid triangle');
    const zs=pts.map(p=>p[2]),min=Math.min(...zs),max=Math.max(...zs);
    const start=Math.max(0,Math.floor((min-lo-first)/height)),end=Math.min(count-1,2+Math.ceil((max-lo-first)/height));
    for(let i=start;i<=end;i++){
      if(--budget.left<0)throw Error('Model exceeds estimate budget');
      const l=layers[i];if(l.z<min||l.z>=max)continue;
      let up,down;
      for(let k=0;k<3;k++){
        const a=pts[k],b=pts[(k+1)%3];
        if((a[2]<=l.z)===(b[2]<=l.z))continue;
        const t=(l.z-a[2])/(b[2]-a[2]),p=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];
        if(b[2]>a[2])up=p;else down=p;
      }
      if(up&&down){l.area+=(up[0]*down[1]-down[0]*up[1])/2;l.perimeter+=Math.hypot(up[0]-down[0],up[1]-down[1]);}
    }
  }
  return layers;
}
export function estimate(bytes,settings,model,plateId){
  const notes=new Set(['Travel and acceleration are approximations. Warm-up, purge and filament changes excluded.']);
  const inputs=new Map(),profiles=[],budget={left:4000000};
  let expanded=0;
  const zip=unzipSync(bytes,{filter:e=>{
    if(!/^3D\/.+\.model$/i.test(e.name)&&e.name!=='Metadata/plate_'+plateId+'.json')return false;
    expanded+=e.originalSize;if(expanded>24*1024*1024)throw Error('Model exceeds estimate budget');return true;
  }});
  const docCache=new Map();
  function doc(file){
    if(!docCache.has(file)){if(!zip[file])throw Error('Missing geometry');const m=parser.parse(strFromU8(zip[file])).model;
      if(!m||m.unit&&m.unit!=='millimeter')throw Error('Unsupported model units');docCache.set(file,m);}
    return docCache.get(file);
  }
  let grams=0,seconds=0,firstTime=0;
  const firstPlate=zip['Metadata/plate_'+plateId+'.json'];
  const knownFirst=firstPlate?Number(JSON.parse(strFromU8(firstPlate)).first_layer_time):NaN;
  function visit(file,id,transform,object,depth){
    if(depth>12)throw Error('Unsupported component nesting');
    const geometry=list(doc(file).resources?.object).find(o=>String(o.id)===String(id));
    if(!geometry)throw Error('Missing geometry');
    for(const c of list(geometry.components?.component)){
      const ref=c['p:path'];visit(ref?(ref.startsWith('/')?ref.slice(1):path.posix.join(path.posix.dirname(file),ref)):file,c.objectid,placement(c.transform,transform),object,depth+1);
    }
    if(!geometry.mesh)return;
    const part=list(object?.part).find(p=>String(p.id)===String(id));
    if(part?.subtype&&part.subtype!=='normal_part')throw Error('Modifier geometry requires slicing');
    const options={...settings,...meta(object),...meta(part)},slot=Math.max(0,(Number(options.extruder)||1)-1);
    function num(key,fallback,index=0,reference=1){
      const raw=Array.isArray(options[key])?options[key][index]:options[key];
      if(raw===undefined||raw===''||raw===null)return fallback;
      const n=parseFloat(raw);if(!Number.isFinite(n)||n<0)return fallback;
      if(!inputs.has(key))inputs.set(key,new Set());inputs.get(key).add(String(raw));
      return String(raw).endsWith('%')?n*reference/100:n;
    }
    const h=num('layer_height',0),first=num('initial_layer_print_height',h);
    if(h<0.02||first<0.02)throw Error('Missing layer height');
    const nozzle=num('nozzle_diameter',0.4),width=num('line_width',nozzle,0,nozzle)||nozzle;
    const density=num('filament_density',0,slot),flow=num('filament_flow_ratio',1,slot)||1;
    if(!density)throw Error('Missing filament density');
    const cap=num('filament_max_volumetric_speed',0,slot),acc=num('default_acceleration',1000)||1000;
    const walls=num('wall_loops',2),fill=num('sparse_infill_density',0.15);
    const top=Math.max(num('top_shell_layers',0),Math.ceil(num('top_shell_thickness',0)/h));
    const bottom=Math.max(num('bottom_shell_layers',0),Math.ceil(num('bottom_shell_thickness',0)/h));
    const layers=sections(geometry.mesh,transform,h,first,budget);
    profiles.push({slot:slot+1,height:h,walls,infill:Math.round(fill*100),density,volumetricLimit:cap});
    if(Number(options.enable_support))notes.add('Supports enabled: support paths and material excluded.');
    if(options.brim_type&&options.brim_type!=='no_brim')notes.add('Brim and adhesion paths excluded.');
    for(const [i,l] of layers.entries()){
      let area=Math.abs(l.area),time=0;
      const row=(role,amount,baseSpeed)=>{
        const w=num(i?role+'_line_width':'initial_layer_line_width',width,0,nozzle)||width;
        const assigned=Math.max(0,Math.min(area,amount(w)));area-=assigned;
        const volume=assigned*l.h*flow*(i?1:num('initial_layer_flow_ratio',1));
        grams+=volume*density/1000;
        if(!volume)return;
        const bead=l.h*(Math.max(w,l.h)-(1-Math.PI/4)*l.h);
        const speed=num(i?role+'_speed':role.includes('wall')?'initial_layer_speed':'initial_layer_infill_speed',baseSpeed)||baseSpeed;
        const velocity=Math.min(speed,cap>0?cap/(bead*flow):Infinity,num('machine_max_speed_x',Infinity)||Infinity,num('machine_max_speed_y',Infinity)||Infinity);
        const acceleration=Math.min(num(i?role+'_acceleration':'initial_layer_acceleration',acc,0,acc)||acc,num('machine_max_acceleration_extruding',Infinity)||Infinity);
        const length=assigned*l.h/bead;
        // Mean chord through a section (pi * area / perimeter). Infill lines
        // reverse at the boundary; wall loops normally carry speed around it.
        const chord=Math.PI*Math.abs(l.area)/Math.max(w,l.perimeter);
        const runs=role.includes('wall')?1:Math.max(1,length/Math.max(w,chord));
        const run=length/runs;
        time+=runs*(run>=velocity*velocity/acceleration
          ?run/velocity+velocity/acceleration
          :2*Math.sqrt(run/acceleration));
      };
      if(walls>0)row('outer_wall',w=>l.perimeter*w,60);
      if(walls>1)row('inner_wall',w=>l.perimeter*w*(walls-1),100);
      const solid=i<bottom||i>=layers.length-top||fill>=1;
      row(i===layers.length-1&&top?'top_surface':solid?'internal_solid_infill':'sparse_infill',()=>area*(solid?1:Math.min(1,fill)),100);
      if(time){time+=Math.sqrt(Math.abs(l.area))/(num('travel_speed',150)||150);
        if(Number(list(options.slow_down_for_layer_cooling)[slot]))time=Math.max(time,num('slow_down_layer_time',0,slot));
        seconds+=time;if(i===0)firstTime+=time;}
    }
  }
  const root='3D/3dmodel.model';
  const allPlates=list(model.plate),plate=allPlates.find(p=>String(meta(p).plater_id)===plateId);
  const members=new Set(list(plate?.model_instance).map(m=>{const a=meta(m);return a.object_id+':'+a.instance_id;}));
  if(allPlates.length>1&&!members.size)throw Error('Missing plate instance assignment');
  const instances=new Map();
  for(const item of list(doc(root).build?.item)){
    const index=instances.get(item.objectid)||0;instances.set(item.objectid,index+1);
    if(String(item.printable)==='0'||members.size&&!members.has(item.objectid+':'+index))continue;
    const object=list(model.object).find(o=>String(o.id)===String(item.objectid));
    visit(root,item.objectid,placement(item.transform,identity),object,0);
  }
  if(!grams||!seconds)throw Error('Insufficient mesh data');
  if(knownFirst>0&&firstTime){seconds+=knownFirst-firstTime;inputs.set('first_layer_time',new Set([knownFirst.toFixed(2)]));}
  return {plateId,grams,seconds,profiles,parameters:Object.fromEntries([...inputs].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,[...v].join(' / ')])),notes:[...notes],firstLayerSeconds:knownFirst>0?knownFirst:null};
}
