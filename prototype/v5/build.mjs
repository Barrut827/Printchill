import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {DatabaseSync} from 'node:sqlite';
import {build} from '../../MVP/node_modules/esbuild/lib/main.js';
import {metadata,plateImage} from '../../MVP/metadata.bundle.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=JSON.parse(fs.readFileSync(path.join(process.env.LOCALAPPDATA,'PrintChill/settings.json'),'utf8')).root;
const db=new DatabaseSync(path.join(root,'workspace.sqlite'),{readOnly:true});
const assets=new Map();
function asset(key,type='STL',plate){
  const id=key+':'+type+':'+plate;
  if(!assets.has(id)){
    const bytes=fs.readFileSync(path.join(root,'objects',key));
    assets.set(id,type==='STL'?'data:application/gzip;base64,'+gzipSync(bytes).toString('base64'):'data:image/png;base64,'+Buffer.from(plateImage(bytes,plate)).toString('base64'));
  }
  return assets.get(id);
}
const parts=db.prepare('SELECT * FROM parts ORDER BY name').all().map(p=>{
  const versions=db.prepare('SELECT * FROM versions WHERE part=? ORDER BY v DESC').all(p.id).map(r=>{
    const files=JSON.parse(r.files),project=files['3MF'];
    let details={},plates=[];
    if(project){
      details=metadata(fs.readFileSync(path.join(root,'objects',project.key)));
      const cached=path.join(root,'slice-cache',project.key+'.json');
      if(fs.existsSync(cached))Object.assign(details,JSON.parse(fs.readFileSync(cached)));
      plates=(details.plateIds||[]).flatMap(i=>{try{return [{id:i,src:asset(project.key,'PNG',i)}];}catch{return [];}});
    }
    return {v:r.v,created:r.created,files,details,plates,geometry:files.STL?{geometryAsset:asset(files.STL.key),importId:files.STL.key}:null};
  });
  return {...p,tags:db.prepare('SELECT tag FROM part_tags WHERE part=?').all(p.id).map(r=>r.tag),versions};
});
db.close();
const result=await build({absWorkingDir:here,entryPoints:['app.js'],bundle:true,write:false,format:'iife',minify:true,nodePaths:[path.resolve(here,'../../MVP/node_modules')],plugins:[{
  name:'offline-data',setup(b){
    b.onResolve({filter:/^sample-data$/},()=>({path:'data',namespace:'demo'}));
    b.onLoad({filter:/.*/,namespace:'demo'},()=>({contents:'export default '+JSON.stringify(parts)}));
    b.onResolve({filter:/^brand-assets$/},()=>({path:'brands',namespace:'brands'}));
    b.onLoad({filter:/.*/,namespace:'brands'},()=>({contents:'export default '+JSON.stringify(Object.fromEntries(['bambu','solidworks'].map(name=>[name,'data:image/png;base64,'+fs.readFileSync(path.join(here,'assets',name+'.png')).toString('base64')])))}));
    b.onResolve({filter:/^\.\/catalog\.js$/},()=>({path:'catalog',namespace:'local'}));
    b.onLoad({filter:/.*/,namespace:'local'},()=>({contents:'export const assetUrl=url=>url;'}));
  }
}]});
const template=fs.readFileSync(path.join(here,'index.html'),'utf8');
const html=template.replace('<!--STYLE-->','<style>'+fs.readFileSync(path.join(here,'style.css'),'utf8')+'</style>').replace('<!--SCRIPT-->',()=>'<script>'+result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
fs.writeFileSync(path.join(here,'../Printchill-demo-v5.html'),html);
console.log('Built standalone v5 with '+parts.length+' Parts. '+(Buffer.byteLength(html)/1e6).toFixed(1)+' MB');
