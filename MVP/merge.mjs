import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';

const digest=data=>createHash('sha256').update(data).digest('hex');
function inspect(ws,source){
  const manifest=JSON.parse(fs.readFileSync(path.join(source,'backup.json'),'utf8'));
  if(manifest.format!==1)throw Error('Unsupported backup format.');
  const file=path.join(source,'workspace.sqlite');
  if(fs.realpathSync(file)===fs.realpathSync(path.join(ws.root,'workspace.sqlite')))throw Error('Choose a backup, not the active workspace.');
  const db=new DatabaseSync(file,{readOnly:true});
  try{
    if(db.prepare('PRAGMA application_id').get().application_id!==1347568433 ||
       ![1,2].includes(db.prepare('PRAGMA user_version').get().user_version) ||
       db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Invalid backup database.');
    const read=table=>db.prepare('SELECT * FROM '+table).all();
    const parts=read('parts'),versions=read('versions'),reports=read('reports');
    const tags=db.prepare("SELECT name FROM sqlite_master WHERE name='part_tags'").get()?read('part_tags'):[];
    const ids=new Set(parts.map(p=>p.id)),keys=new Set();
    for(const row of versions){
      if(!ids.has(row.part))throw Error('Invalid Part reference.');
      for(const f of Object.values(JSON.parse(row.files))){
        if(!/^[0-9a-f]{64}$/.test(f.key))throw Error('Invalid backup file reference.');
        keys.add(f.key);
      }
    }
    const conflicts=parts.filter(p=>ws.one('SELECT id FROM parts WHERE id=?',p.id)).map(p=>p.id);
    const affected=ws.state(), jobs=affected.jobs.filter(j=>ids.has(j.part));
    let bytes=fs.statSync(file).size+fs.statSync(path.join(source,'backup.json')).size;
    for(const key of keys)bytes+=fs.statSync(path.join(source,'objects',key)).size;
    const localVersions=affected.versions.filter(r=>ids.has(r.part)),localReports=affected.reports.filter(r=>ids.has(r.part));
    const preview={name:manifest.name||path.basename(source),created:manifest.created||null,bytes,parts:parts.length,
      additions:parts.filter(p=>!conflicts.includes(p.id)).map(p=>p.id),conflicts,versions:localVersions.length,reports:localReports.length,
      pending:jobs.filter(j=>j.changed||j.missing).map(j=>j.part)};
    preview.token=digest(JSON.stringify([ws.root,source,parts,versions,reports,tags,preview,localVersions,localReports,jobs]));
    return {preview,parts,versions,reports,tags,keys};
  }finally{db.close();}
}
export function backupPreview(ws,source){return inspect(ws,source).preview;}
export function mergeBackup(ws,source,token){
  const {preview,parts,versions,reports,tags,keys}=inspect(ws,source);
  if(preview.token!==token)throw Error('Workspace or backup changed. Preview again.');
  if(preview.pending.length)throw Error('Resolve pending working copies before replacing these Parts.');
  for(const key of keys){
    const temp=path.join(ws.root,'staging',randomUUID());
    try{
      fs.copyFileSync(path.join(source,'objects',key),temp);
      if(digest(fs.readFileSync(temp))!==key)throw Error('Backup file failed its integrity check.');
      const dest=ws.object(key);
      if(fs.existsSync(dest)){if(digest(fs.readFileSync(dest))!==key)throw Error('Damaged workspace object.');}
      else fs.renameSync(temp,dest);
    }finally{fs.rmSync(temp,{force:true});}
  }
  ws.transaction(()=>{
    for(const id of preview.conflicts){
      for(const table of ['jobs','reports','versions','part_tags'])ws.run('DELETE FROM '+table+' WHERE part=?',id);
      ws.run('DELETE FROM parts WHERE id=?',id);
    }
    for(const p of parts)ws.run('INSERT INTO parts(id,name) VALUES(?,?)',p.id,p.name);
    for(const r of versions)ws.run('INSERT INTO versions(part,v,files,created) VALUES(?,?,?,?)',r.part,r.v,r.files,r.created);
    for(const r of reports)ws.run('INSERT INTO reports(part,v,outcome,note,created,material) VALUES(?,?,?,?,?,?)',r.part,r.v,r.outcome,r.note,r.created,r.material||'');
    for(const r of tags)ws.run('INSERT INTO part_tags VALUES(?,?)',r.part,r.tag);
  });
  return preview.parts;
}
