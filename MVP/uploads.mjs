import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export const fileRole=name=>({'.stl':'STL','.3mf':'3MF','.sldprt':'CAD','.step':'CAD','.stp':'CAD'})[path.extname(name).toLowerCase()];
export class Uploads {
  entries=new Map();
  remove(id){const entry=this.entries.get(id);if(entry){
    if(path.dirname(entry.dir)!==path.join(entry.root,'staging')||path.basename(entry.dir)!=='upload-'+id)throw Error('Invalid temporary upload path.');
    clearTimeout(entry.timer);this.entries.delete(id);
    // Temporary cleanup must not turn a committed import into a failed response.
    try{fs.rmSync(entry.dir,{recursive:true,force:true});}catch{}
  }}
  prune(workspace){
    if(!workspace)return;
    const parent=path.join(workspace.root,'staging');
    try{for(const name of fs.readdirSync(parent))if(/^upload-[a-f0-9-]{36}$/.test(name)){
      const dir=path.join(parent,name),stat=fs.lstatSync(dir);
      if(path.dirname(dir)===parent&&stat.isDirectory()&&!stat.isSymbolicLink()&&Date.now()-stat.mtimeMs>24*60*60*1000)try{fs.rmSync(dir,{recursive:true,force:true});}catch{}
    }}catch{}
  }
  async receive(req,workspace,role,name){
    if(!workspace)throw Error('Select a workspace first.');
    name=path.basename(name||'');
    if(!role||fileRole(name)!==role)throw Error('Choose a matching CAD, STL or 3MF file.');
    const root=workspace.root,id=randomUUID(),dir=path.join(root,'staging','upload-'+id),file=path.join(dir,name);
    fs.mkdirSync(dir);let handle,size=0,complete=false;
    try{
      handle=await fs.promises.open(file,'wx');
      for await(const chunk of req){size+=chunk.length;if(size>256*1024*1024)throw Error('Maximum file size is 256 MB.');await handle.writeFile(chunk);}
      await handle.close();handle=null;if(!size)throw Error('Choose a non-empty file.');
      if(req.aborted)throw Error('Upload interrupted.');
      const timer=setTimeout(()=>this.remove(id),24*60*60*1000);timer.unref();
      this.entries.set(id,{root,role,file,dir,timer});complete=true;return {upload:id,name};
    }finally{if(handle)await handle.close();if(!complete)fs.rmSync(dir,{recursive:true,force:true});}
  }
  resolve(files,workspace){
    if(!files||typeof files!=='object'||Array.isArray(files))throw Error('Select files by role.');
    return Object.entries(files).map(([role,selection])=>{
      const entry=selection?.upload?this.entries.get(selection.upload):null;
      if(selection?.upload&&(!entry||entry.root!==workspace.root||entry.role!==role))throw Error('File upload expired. Add the file again.');
      const file=entry?.file||selection?.path;
      if(typeof file!=='string'||!['CAD','STL','3MF'].includes(role)||fileRole(file)!==role)throw Error('Choose one matching file per role.');
      return file;
    });
  }
  discard(files){for(const selection of Object.values(files||{}))if(selection?.upload)this.remove(selection.upload);}
}
