import {unzipSync,strFromU8} from 'fflate';
import {XMLParser} from 'fast-xml-parser';
import {estimate} from './estimate.mjs';
const xml=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'',processEntities:false});
const list=x=>x==null?[]:Array.isArray(x)?x:[x];
const attrs=x=>Object.fromEntries(list(x?.metadata).map(m=>[m.key,m.value]));
function numeric(x){return x!=null&&x!==''&&Number.isFinite(+x)&&+x>=0?+x:null;}
function duration(x){
  if(numeric(x)!==null)return +x;
  if(!/^(?:\s*[\d.]+\s*[dhms]\s*)+$/.test(x||''))return null;
  return [...x.matchAll(/([\d.]+)\s*([dhms])/g)].reduce((s,m)=>s+(+m[1])*({d:86400,h:3600,m:60,s:1})[m[2]],0);
}
export function metadata(bytes){
  let size=0;
  const zip=unzipSync(bytes,{filter:e=>{
    if(!/^Metadata\/(?:project_settings\.config|model_settings\.config|slice_info\.config|plate_\d+\.gcode)$/.test(e.name))return false;
    size+=e.originalSize;if(size>128*1024*1024)throw Error('Metadata size limit');
    return true;
  }});
  const read=n=>zip['Metadata/'+n]?strFromU8(zip['Metadata/'+n]):'';
  const settings=JSON.parse(read('project_settings.config')||'{}');
  const model=xml.parse(read('model_settings.config')).config||{};
  const assigned=new Set();
  for(const obj of list(model.object))for(const part of list(obj.part||obj)){
    const slot=Number(attrs(part).extruder)||Number(attrs(obj).extruder);if(slot>0)assigned.add(slot);
  }
  const plates=list(model.plate).map(p=>String(attrs(p).plater_id)),stats=new Map(),used=new Map();
  for(const p of list(xml.parse(read('slice_info.config')).config?.plate)){
    const info=attrs(p),filaments=list(p.filament),weights=filaments.map(f=>numeric(f.used_g));
    stats.set(String(info.index),{time:duration(info.prediction),weight:numeric(info.weight)??(weights.length&&weights.every(n=>n!==null)?weights.reduce((a,b)=>a+b):null),known:weights.length>0&&weights.every(n=>n!==null)});
    for(const f of filaments)if(+f.used_g>0||+f.used_m>0)used.set(+f.id,f);
  }
  if(!plates.length)plates.push(...new Set([...stats.keys(),...Object.keys(zip).flatMap(n=>/^Metadata\/plate_(\d+)\.gcode$/.exec(n)?.slice(1)||[])]));
  for(const id of plates){
    const stat=stats.get(id)||{};
    if(stat.time==null||stat.weight==null){
      const g=read('plate_'+id+'.gcode');
      stat.time??=duration(g.match(/;[^\n]*?total estimated time:\s*([^;\r\n]+)/i)?.[1]||g.match(/;\s*estimated printing time \(normal mode\)\s*=\s*([^;\r\n]+)/)?.[1]);
      const grams=g.match(/^;\s*total filament used\s*\[g\]\s*[:=]\s*([\d.]+)\s*$/im);
      const slots=g.match(/^;\s*filament used\s*\[g\]\s*[:=]\s*([\d., \t]+)\s*$/im);
      if(stat.weight==null&&grams)stat.weight=numeric(grams[1]);
      if(stat.weight==null&&slots){const values=slots[1].split(',').map(v=>numeric(v.trim()));if(values.every(n=>n!==null))stat.weight=values.reduce((a,b)=>a+b,0);}
    }
    stats.set(id,stat);
  }
  const sum=k=>plates.length&&plates.every(id=>stats.get(id)?.[k]!=null)?plates.reduce((s,id)=>s+stats.get(id)[k],0):null;
  const slots=plates.length&&plates.every(id=>stats.get(id)?.known)&&used.size?[...used.keys()]:[...new Set([...assigned,...used.keys()])];
  let estimated=null,estimateNote='';
  if(sum('time')==null||sum('weight')==null){
    try{
      if(!plates.length||plates.length>12)throw Error('Unsupported plate count for geometry estimate.');
      const plateEstimates=plates.map(id=>{
        const saved=stats.get(id)||{};
        if(saved.time!=null&&saved.weight!=null)return {plateId:id,seconds:saved.time,grams:saved.weight,parameters:{},notes:[]};
        const calc=estimate(bytes,settings,model,id);
        return {...calc,seconds:saved.time??calc.seconds,grams:saved.weight??calc.grams};
      });
      estimated={seconds:plateEstimates.reduce((n,p)=>n+p.seconds,0),grams:plateEstimates.reduce((n,p)=>n+p.grams,0),plates:plateEstimates};
    }catch(e){estimateNote=e.message;}
  }
  return {estimated,estimateNote,height:settings.layer_height,density:settings.sparse_infill_density,pattern:settings.sparse_infill_pattern,plates:plates.length||null,
    seconds:sum('time'),grams:sum('weight'),filaments:slots.map(slot=>({slot,type:used.get(slot)?.type||settings.filament_type?.[slot-1],color:used.get(slot)?.color||settings.filament_colour?.[slot-1]}))};
}
