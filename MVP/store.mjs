import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const hash = data => createHash('sha256').update(data).digest('hex');
const check = (ok, message) => { if (!ok) throw Error(message); };
function absolute(p) {
  check(typeof p === 'string' && path.isAbsolute(p) && !p.startsWith('\\\\'), 'Choose an absolute local path.');
  return path.resolve(p);
}
function empty(p) {
  fs.mkdirSync(p, {recursive:true});
  check(!fs.readdirSync(p).length, 'Select an empty folder.');
}
function verify3mf(file) {
  const entries = execFileSync('tar.exe',['-tf', file],{encoding:'utf8',windowsHide:true});
  check(entries.split(/\r?\n/).some(n => /^3D\/.+\.model$/i.test(n)), 'Missing 3MF model.');
}
export class Workspace {
  constructor(folder) {
    this.root = absolute(folder);
    const dbfile = path.join(this.root,'workspace.sqlite');
    if (!fs.existsSync(dbfile)) empty(this.root);
    this.db = new DatabaseSync(dbfile);
    try {
      const version = this.one('PRAGMA user_version').user_version;
      if (version === 0) {
        check(!this.one('SELECT name FROM sqlite_master LIMIT 1'), 'Unrecognized workspace.');
        this.db.exec(`BEGIN;
          CREATE TABLE parts(id TEXT PRIMARY KEY,name TEXT NOT NULL);
          CREATE TABLE versions(part TEXT REFERENCES parts(id),v INTEGER,files TEXT,created TEXT,PRIMARY KEY(part,v));
          CREATE TABLE jobs(id TEXT PRIMARY KEY,part TEXT,base INTEGER,file TEXT);
          CREATE TABLE reports(id INTEGER PRIMARY KEY,part TEXT,v INTEGER,outcome TEXT,note TEXT,created TEXT,FOREIGN KEY(part,v) REFERENCES versions(part,v));
          PRAGMA application_id=1347568433; PRAGMA user_version=1; COMMIT;`);
      }
      check(this.one('PRAGMA application_id').application_id===1347568433 && this.one('PRAGMA user_version').user_version===1,'Unsupported workspace.');
      for (const dir of ['objects','work','staging']) fs.mkdirSync(path.join(this.root,dir),{recursive:true});
    } catch(e) {this.db.close();throw e;}
  }
  one(q,...a){return this.db.prepare(q).get(...a);}
  all(q,...a){return this.db.prepare(q).all(...a);}
  run(q,...a){return this.db.prepare(q).run(...a);}
  transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
  object(key){check(/^[0-9a-f]{64}$/.test(key),'Invalid object key.');return path.join(this.root,'objects',key);}
  capture(source,role,revision=1){
    source=absolute(source);
    const temp=path.join(this.root,'staging',randomUUID());
    try {
      const before=fs.statSync(source,{bigint:true});
      fs.copyFileSync(source,temp);
      const data=fs.readFileSync(temp), key=hash(data);
      if(role==='3MF') verify3mf(temp);
      const after=fs.statSync(source,{bigint:true});
      check(before.mtimeNs===after.mtimeNs && before.ino===after.ino && after.size===BigInt(data.length),'File changed during capture. Try again.');
      const target=this.object(key);
      if(!fs.existsSync(target)) fs.renameSync(temp,target);
      return {name:path.basename(source),key,revision};
    } finally {fs.rmSync(temp,{force:true});}
  }
  files(part,v){const row=this.one('SELECT files FROM versions WHERE part=? AND v=?',part,v);check(row,'Unknown Part version.');return JSON.parse(row.files);}
  addVersion(part,v,files){check(v<=999,'Version limit reached.');this.run('INSERT INTO versions VALUES(?,?,?,?)',part,v,JSON.stringify(files),new Date().toISOString());}
  importPart(name,paths){
    check(name?.trim() && paths.length,'Enter a Part name and select files.');
    const files={};
    for(const source of paths){
      const role=({'.3mf':'3MF','.stl':'STL','.sldprt':'CAD','.step':'CAD','.stp':'CAD'})[path.extname(source).toLowerCase()];
      check(role && !files[role],'Choose one supported file per role (CAD, STL, 3MF).');
      files[role]=this.capture(source,role);
    }
    return this.transaction(()=>{
      let part;
      do {part=randomInt(1000,10000)+'-'+randomInt(100,1000)+randomInt(1,10);}while(this.one('SELECT id FROM parts WHERE id=?',part));
      this.run('INSERT INTO parts VALUES(?,?)',part,name.trim());this.addVersion(part,1,files);return part;
    });
  }
  work(part,v){
    const f=this.files(part,v)['3MF'];check(f,'No 3MF in this version.');
    let job=this.one('SELECT * FROM jobs WHERE part=? AND base=?',part,v);
    if(!job){const id=randomUUID(), file=path.join('work',id,path.basename(f.name));
      fs.mkdirSync(path.join(this.root,'work',id));fs.copyFileSync(this.object(f.key),path.join(this.root,file));
      this.run('INSERT INTO jobs VALUES(?,?,?,?)',id,part,v,file);job={id,part,base:v,file};}
    return job;
  }
  workPath(job){const dir=path.join(this.root,'work',job.id);check(/^[a-f0-9-]{36}$/.test(job.id) && path.dirname(path.resolve(this.root,job.file))===dir,'Invalid work path.');return path.join(this.root,job.file);}
  confirm(id,expected,alternate){
    return this.transaction(()=>{
      const j=this.one('SELECT * FROM jobs WHERE id=?',id);check(j,'Unknown working copy.');
      const latest=this.one('SELECT max(v) AS v FROM versions WHERE part=?',j.part).v;
      check(expected===latest,'Version changed. Review the latest version.');
      const files=this.files(j.part,latest),base=this.files(j.part,j.base)['3MF'];
      const f=this.capture(alternate || this.workPath(j),'3MF',files['3MF'].revision+1);
      if(f.key===base.key)return j.base;
      let v=latest;
      if(f.key!==files['3MF'].key){files['3MF']=f;this.addVersion(j.part,++v,files);}
      if(alternate)fs.copyFileSync(this.object(f.key),this.workPath(j));
      this.run('UPDATE jobs SET base=? WHERE id=?',v,id);return v;
    });
  }
  report(part,v,outcome,note){this.files(part,v);check(['Success','Failed','Aborted'].includes(outcome),'Choose an outcome.');this.run('INSERT INTO reports(part,v,outcome,note,created) VALUES(?,?,?,?,?)',part,v,outcome,note,new Date().toISOString());}
  state(){
    return {root:this.root,parts:this.all('SELECT * FROM parts ORDER BY name'),versions:this.all('SELECT * FROM versions ORDER BY v DESC').map(r=>({...r,files:JSON.parse(r.files)})),reports:this.all('SELECT * FROM reports ORDER BY id DESC'),jobs:this.all('SELECT * FROM jobs').map(j=>{
      try{const p=this.workPath(j),stat=fs.statSync(p,{bigint:true}),sig=String(stat.ino)+'/'+stat.mtimeNs+'/'+stat.size;
        this.cache??=new Map();let entry=this.cache.get(j.id);
        if(entry?.sig!==sig){entry={sig,key:hash(fs.readFileSync(p))};this.cache.set(j.id,entry);}
        return {...j,changed:entry.key!==this.files(j.part,j.base)['3MF'].key};
      }catch{return {...j,missing:true};}
    })};
  }
  backup(destination){
    const dest=absolute(destination);check(!inside(this.root,dest),'Choose a destination outside the workspace.');empty(dest);
    const target=path.join(dest,'workspace.sqlite');
    this.db.prepare('VACUUM INTO ?').run(target);
    const db=new DatabaseSync(target);
    try{db.exec('DELETE FROM jobs');}finally{db.close();}
    fs.mkdirSync(path.join(dest,'objects'));
    for(const row of this.all('SELECT files FROM versions'))for(const f of Object.values(JSON.parse(row.files))){
      const out=path.join(dest,'objects',f.key);if(!fs.existsSync(out))fs.copyFileSync(this.object(f.key),out);
      check(hash(fs.readFileSync(out))===f.key,'Backup integrity check failed.');
    }
    fs.writeFileSync(path.join(dest,'backup.json'),JSON.stringify({format:1}));
  }
}
function inside(parent,child){const rel=path.relative(parent,child);return !rel || (!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));}
export function restore(source,destination){
  const src=absolute(source),parent=absolute(destination);
  check(!inside(src,parent),'Choose a destination outside the source backup.');
  check(fs.existsSync(path.join(src,'backup.json')) && JSON.parse(fs.readFileSync(path.join(src,'backup.json'))).format===1,'Select the completed backup folder containing backup.json.');
  fs.mkdirSync(parent,{recursive:true});
  const dest=fs.readdirSync(parent).length ? fs.mkdtempSync(path.join(parent,'PRC-restored-')) : parent;
  const db=new DatabaseSync(path.join(src,'workspace.sqlite'),{readOnly:true});
  try{
    check(db.prepare('PRAGMA application_id').get().application_id===1347568433 && db.prepare('PRAGMA integrity_check').get().integrity_check==='ok','Invalid backup database.');
    fs.mkdirSync(path.join(dest,'objects'));
    for(const row of db.prepare('SELECT files FROM versions').all())for(const f of Object.values(JSON.parse(row.files))){
      check(/^[0-9a-f]{64}$/.test(f.key),'Invalid backup key.');
      const data=fs.readFileSync(path.join(src,'objects',f.key));check(hash(data)===f.key,'Damaged backup object.');
      fs.writeFileSync(path.join(dest,'objects',f.key),data);
    }
    fs.copyFileSync(path.join(src,'workspace.sqlite'),path.join(dest,'workspace.sqlite'));
  }finally{db.close();}
  return dest;
}
