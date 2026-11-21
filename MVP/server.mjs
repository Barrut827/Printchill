import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {Workspace,restore,reportToken} from './store.mjs';
import {backupPreview,mergeBackup} from './merge.mjs';
import {metadata,plateImage} from './metadata.bundle.mjs';
import {Uploads} from './uploads.mjs';
const uploads=new Uploads();
const detailCache=new Map();
const here=path.dirname(fileURLToPath(import.meta.url));
const prefs=path.join(process.env.LOCALAPPDATA,'PrintChill','settings.json');
let config=fs.existsSync(prefs)?JSON.parse(fs.readFileSync(prefs)):{};
let ws, startup='';
if(config.root)try{if(!fs.existsSync(path.join(config.root,'workspace.sqlite')))throw Error('Locate your existing workspace in Settings.');ws=new Workspace(config.root);}catch(e){startup=e.message;}
if(ws)uploads.prune(ws);
function save(updates){const next={...config,...updates};fs.mkdirSync(path.dirname(prefs),{recursive:true});fs.writeFileSync(prefs+'.tmp',JSON.stringify(next));fs.renameSync(prefs+'.tmp',prefs);config=next;}
const defaultBambu=path.join(process.env.ProgramFiles,'Bambu Studio','bambu-studio.exe');
const work=new Map();
let queue=Promise.resolve();
function automaticTotals(workspace,key,original){
  if(original.seconds!=null&&original.grams!=null)return original;
  const exe=config.bambu||defaultBambu;
  const id=JSON.stringify([workspace.root,key,exe]);
  const previous=work.get(id);
  if(previous&&(!previous.retry||Date.now()<previous.retry))return previous.details;
  const entry={details:{...original,sliceStatus:'Calculating with Bambu Studio…'}};
  work.set(id,entry);
  const cache=path.join(workspace.root,'slice-cache',key+'.json');
  try{
    const saved=JSON.parse(fs.readFileSync(cache,'utf8'));
    if(Number.isFinite(saved.seconds)&&Number.isFinite(saved.grams)){
      entry.details={...original,seconds:original.seconds??saved.seconds,grams:original.grams??saved.grams,resliced:true};
      return entry.details;
    }
  }catch{}
  queue=queue.then(async()=>{
    let dir;
    try{
      if(!fs.existsSync(exe))throw Error('Locate Bambu Studio in Settings.');
      dir=fs.mkdtempSync(path.join(workspace.root,'staging','slice-'));
      fs.copyFileSync(workspace.object(key),path.join(dir,'project.3mf'));
      await promisify(execFile)(exe,['--slice','0','--export-3mf','sliced.3mf','project.3mf'],{cwd:dir,windowsHide:true,timeout:300000,maxBuffer:4*1024*1024});
      const {seconds,grams}=metadata(fs.readFileSync(path.join(dir,'sliced.3mf')));
      if(seconds==null||grams==null)throw Error('Incomplete slice totals.');
      fs.mkdirSync(path.dirname(cache),{recursive:true});
      fs.writeFileSync(cache+'.tmp',JSON.stringify({seconds,grams}));fs.renameSync(cache+'.tmp',cache);
      entry.details={...original,seconds:original.seconds??seconds,grams:original.grams??grams,resliced:true};
    }catch(e){
      entry.details={...original,sliceStatus:'Bambu calculation unavailable. '+(fs.existsSync(exe)?'Automatic retry in 10 minutes.':'Locate Bambu Studio in Settings.')};
      entry.retry=Date.now()+600000;
    }finally{if(dir)try{fs.rmSync(dir,{recursive:true,force:true});}catch{}}
  });
  return entry.details;
}
const dialogs={
  cad:"$d=New-Object System.Windows.Forms.OpenFileDialog; $d.Filter='CAD file|*.sldprt;*.step;*.stp'; if($d.ShowDialog() -eq 'OK'){$d.FileName}",
  stl:"$d=New-Object System.Windows.Forms.OpenFileDialog; $d.Filter='STL file|*.stl'; if($d.ShowDialog() -eq 'OK'){$d.FileName}",
  folder:"$shell=New-Object -ComObject Shell.Application; $folder=$shell.BrowseForFolder($owner.Handle.ToInt32(),'Select a PrintChill folder',81,0); if($folder){$folder.Self.Path}",
  files:"$d=New-Object System.Windows.Forms.OpenFileDialog; $d.Multiselect=$true; $d.Filter='Part files|*.3mf;*.stl;*.sldprt;*.step;*.stp'; if($d.ShowDialog() -eq 'OK'){$d.FileNames}",
  model:"$d=New-Object System.Windows.Forms.OpenFileDialog; $d.Filter='Bambu project|*.3mf'; if($d.ShowDialog() -eq 'OK'){$d.FileName}",
  bambu:"$d=New-Object System.Windows.Forms.OpenFileDialog; $d.Filter='Bambu Studio|bambu-studio.exe'; if($d.ShowDialog() -eq 'OK'){$d.FileName}"
};
const token=randomUUID(),port=Number(process.env.PRC_PORT||47831),host='127.0.0.1:'+port,origin='http://'+host;
async function api(action,b){
  if(action==='pick'){
    if(!Object.hasOwn(dialogs,b.kind))throw Error('Unknown dialog.');
    const ownerScript=`$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new()
Add-Type -ReferencedAssemblies System.Windows.Forms -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;
public class PickerOwner : IWin32Window {
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  public IntPtr Handle {get; private set;}
  public PickerOwner(){Handle=GetForegroundWindow();}
}
'@
$owner=New-Object PickerOwner
`;
    const script=ownerScript+dialogs[b.kind].replace('ShowDialog()','ShowDialog($owner)');
    const {stdout}=await promisify(execFile)('powershell.exe',['-NoProfile','-STA','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true});
    return stdout.trim().split(/\r?\n/).filter(Boolean);
  }
  if(action==='settings'){
    if(b.bambu && (path.basename(b.bambu).toLowerCase()!=='bambu-studio.exe'||!fs.existsSync(b.bambu)))throw Error('Select bambu-studio.exe.');
    if(fs.existsSync(path.join(b.root,'backup.json')))throw Error('Use Restore for backup folders.');
    const next=new Workspace(b.root);
    try{save({root:next.root,bambu:b.bambu});}catch(e){next.db.close();throw e;}
    ws?.db.close();ws=next;startup='';return true;
  }
  if(action==='state'){
    const workspace=ws?.state();
    if(workspace){
      workspace.reports=workspace.reports.map(row=>({...row,editToken:reportToken(row)}));
      workspace.tags=ws.all('SELECT * FROM part_tags ORDER BY tag');
      workspace.searches=ws.all('SELECT * FROM searches ORDER BY name');
      workspace.collections=ws.all('SELECT * FROM collections ORDER BY name');
      workspace.memberships=ws.all('SELECT * FROM part_collections ORDER BY part,collection');
      workspace.info=ws.all('SELECT * FROM part_info ORDER BY part');
      workspace.repositories=ws.all('SELECT * FROM version_links ORDER BY part,v');
      workspace.details={};
      for(const row of workspace.versions){
        const f=row.files['3MF'];if(!f)continue;
        if(!detailCache.has(f.key)){try{detailCache.set(f.key,metadata(fs.readFileSync(ws.object(f.key))));}catch{detailCache.set(f.key,{});}}
        workspace.details[f.key]=automaticTotals(ws,f.key,detailCache.get(f.key));
      }
    }
    return {workspace,bambu:config.bambu||defaultBambu,root:config.root||'',startup};
  }
  if(action==='restore'){const root=restore(b.source,b.destination);return api('settings',{root,bambu:config.bambu});}
  if(!ws)throw Error('Select a workspace in Settings.');
  switch(action){
    case 'previewBackup':return backupPreview(ws,b.source);
    case 'mergeBackup':return mergeBackup(ws,b.source,b.token);
    case 'tags':ws.transaction(()=>{ws.run('DELETE FROM part_tags WHERE part=?',b.part);for(const tag of b.tags.split(/[\s,]+/).map(s=>s.replace(/^#/,'').toLowerCase()).filter(Boolean))ws.run('INSERT OR IGNORE INTO part_tags VALUES(?,?)',b.part,tag);});return true;
    case 'saveSearch':if(!b.name.trim())throw Error('Name required');ws.run('INSERT OR REPLACE INTO searches VALUES(?,?)',b.name.trim(),JSON.stringify(b.criteria));return true;
    case 'collection':return ws.collection(b.id,b.name,b.remove);
    case 'membership':ws.membership(b.part,b.ids);return true;
    case 'repository':ws.repository(b.part,b.v,b.repo);return true;
    case 'create':return ws.createPart(b.name);
    case 'derive':return ws.derive(b.part,b.v,b.name);
    case 'discardUploads':for(const id of b.ids||[])uploads.remove(id);return true;
    case 'import':{
      const id=ws.importPart(b.name,b.files?uploads.resolve(b.files,ws):b.paths,b.part);uploads.discard(b.files);return id;
    }
    case 'editFiles':{
      const v=ws.updateFiles(b.part,b.expected,uploads.resolve(b.files,ws));uploads.discard(b.files);return v;
    }
    case 'report':ws.report(b.part,b.v,b.outcome,b.note,b.material,b.details);return true;
    case 'editReport':return ws.editReport(b.id,b.expected,b.outcome,b.note,b.material,b.details);
    case 'backup':ws.backup(b.destination);return true;
    case 'confirm':return ws.confirm(b.id,b.latest,b.alternate);
    case 'open':{
      const exe=config.bambu||defaultBambu;
      if(!fs.existsSync(exe))throw Error('Locate Bambu Studio in Settings.');
      const file=ws.workPath(ws.work(b.part,b.v));
      await new Promise((resolve,reject)=>{const child=spawn(exe,[file],{detached:true,stdio:'ignore'});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});return true;
    }
    default:throw Error('Unknown action.');
  }
}
const server=http.createServer(async(req,res)=>{
  try{
    if(req.headers.host!==host)throw Error('Invalid host.');
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-PrintChill-Build','0.3.5');
    res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    const url=new URL(req.url,origin);
    if(req.method==='GET'&&url.pathname==='/plate'){
      const f=ws.files(url.searchParams.get('part'),Number(url.searchParams.get('v')))['3MF'];
      if(!f)throw Error('No 3MF in this version.');
      res.setHeader('Content-Type','image/png');
      return res.end(plateImage(fs.readFileSync(ws.object(f.key)),url.searchParams.get('index')));
    }
    if(req.method==='GET' && ['/bambu.png','/solidworks.png'].includes(url.pathname)){
      res.setHeader('Content-Type','image/png');return res.end(fs.readFileSync(path.join(here,url.pathname.slice(1))));
    }
    if(req.method==='GET' && ['/','/app.js','/import-form.js','/screens.js','/reports.js','/report-data.js','/viewer.bundle.js','/library.js','/style.css'].includes(url.pathname)){
      const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
      res.setHeader('Content-Type',(file.endsWith('.js')?'text/javascript':file==='index.html'?'text/html':'text/css')+'; charset=utf-8');
      return res.end(fs.readFileSync(path.join(here,file),'utf8').replace('__TOKEN__',token));
    }
    if(req.method==='GET' && url.pathname==='/download'){
      const f=ws.files(url.searchParams.get('part'),Number(url.searchParams.get('v')))[url.searchParams.get('role')];
      res.setHeader('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(f.name));
      return res.end(fs.readFileSync(ws.object(f.key)));
    }
    if(req.method!=='POST'||!['/api','/upload'].includes(url.pathname)||req.headers.origin!==origin||req.headers['x-prc-token']!==token)throw Error('Request denied.');
    if(url.pathname==='/upload'){
      const workspace=ws,result=await uploads.receive(req,workspace,url.searchParams.get('role'),url.searchParams.get('name'));
      if(workspace!==ws){uploads.remove(result.upload);throw Error('Workspace changed. Add the file again.');}
      res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(result));
    }
    let chunks=[],size=0;for await(const chunk of req){if((size+=chunk.length)>6000000)throw Error('Input too long (6 MB maximum).');chunks.push(chunk);}
    const {action,...body}=JSON.parse(Buffer.concat(chunks));const result=await api(action,body);
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));
  }catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}));}
});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('PrintChill ready at '+origin));
