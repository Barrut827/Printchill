import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {Workspace,restore} from './store.mjs';
import {backupPreview,mergeBackup} from './merge.mjs';
import {results} from './library.js';

test('0.3 collections: migration, multiple membership, empty Part, derive and backup merge',t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'prc-collections-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const root=path.join(tmp,'workspace');let w=new Workspace(root);
 const file=path.join(tmp,'part.STL');fs.writeFileSync(file,'solid fixture\nendsolid fixture');
 const part=w.importPart('Original',[file]);w.db.close();
 // Emulate a genuine schema-3 workspace before the automatic upgrade.
 const old=new DatabaseSync(path.join(root,'workspace.sqlite'));old.exec('DROP TABLE part_collections; DROP TABLE collections; DROP TABLE part_info; PRAGMA user_version=3');old.close();
 w=new Workspace(root);
 let restored,local;
 try{
  const pre=fs.readdirSync(tmp).filter(n=>n.startsWith('workspace-pre-0.3-'));assert.equal(pre.length,1);
  const a=w.collection(null,'Robot arm'),b=w.collection(null,'Workshop');
  assert.throws(()=>w.collection(null,'ROBOT ARM'),/already exists/);
  assert.throws(()=>w.membership(part,['missing']),/Unknown collection/);
  w.membership(part,[a,b,a]);assert.equal(w.all('SELECT * FROM part_collections').length,2);
  assert.equal(w.state().versions.length,1);
  w.collection(a,'Robot arm parts');assert.equal(w.all('SELECT * FROM part_collections').length,2);
  const empty=w.createPart('Without files');assert.equal(w.state().versions.filter(r=>r.part===empty).length,0);
  const criteria={query:'',collection:a};
  assert.deepEqual(results({...w.state(),tags:[],details:{},memberships:w.all('SELECT * FROM part_collections')},criteria).map(r=>r.p.id),[part]);
  w.importPart('Without files',[file],empty);assert.equal(w.files(empty,1).STL.key,w.files(part,1).STL.key);
  assert.throws(()=>w.importPart('Duplicate',[file],empty),/empty Part/);
  const child=w.derive(part,1,'Variant');assert.equal(w.one('SELECT parent FROM part_info WHERE part=?',child).parent,part);
  w.repository(part,1,'https://github.com/example/project');assert.throws(()=>w.repository(part,'javascript:alert(1)'));
  const backup=path.join(tmp,'backup');w.backup(backup);w.db.close();w=new Workspace(root);
  assert.equal(w.all('SELECT * FROM part_collections').length,2);assert.equal(fs.readdirSync(tmp).filter(n=>n.startsWith('workspace-pre-0.3-')).length,1);
  restored=new Workspace(restore(backup,path.join(tmp,'restore')));assert.equal(restored.all('SELECT * FROM part_collections').length,2);
  local=new Workspace(path.join(tmp,'local'));const keep=local.importPart('Local',[file]);
  const sameName=local.collection(null,'robot arm parts');local.membership(keep,[sameName]);
  mergeBackup(local,backup,backupPreview(local,backup).token);
  assert.equal(local.all('SELECT * FROM collections').length,2);assert.equal(local.all('SELECT * FROM part_collections WHERE collection=?',sameName).length,2);
  assert.equal(local.one('SELECT repo FROM version_links WHERE part=?',part).repo,'https://github.com/example/project');
  local.membership(part,[]);mergeBackup(local,backup,backupPreview(local,backup).token);
  assert.equal(local.all('SELECT * FROM part_collections WHERE part=?',part).length,2);
  local.collection(sameName,undefined,true);assert.equal(local.state().parts.length,4);assert.equal(local.files(part,1).STL.key,w.files(part,1).STL.key);
 }finally{w.db.close();restored?.db.close();local?.db.close();}
});
