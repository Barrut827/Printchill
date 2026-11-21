import {fixtures} from './test-fixtures.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {Workspace,restore} from './store.mjs';
import {Uploads} from './uploads.mjs';
import {Readable} from 'node:stream';

test('UC-021 adds and replaces roles without changing historical versions or reports',t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'prc-edit-files-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));const f=fixtures(tmp),w=new Workspace(path.join(tmp,'workspace'));let restored;
 try{
  const part=w.importPart('Fixture',[f.stl]);w.report(part,1,'Success','Original');const original=w.files(part,1);
  assert.equal(w.updateFiles(part,1,[f.cad,f.project]),2);assert.deepEqual(w.files(part,1),original);
  assert.equal(w.files(part,2).STL.key,original.STL.key);assert.equal(w.files(part,2).CAD.revision,1);
  assert.equal(w.updateFiles(part,2,[f.stl]),2);
  const replacement=path.join(tmp,'replacement.STL');fs.writeFileSync(replacement,Buffer.concat([fs.readFileSync(f.stl),Buffer.from('\n')]));
  assert.equal(w.updateFiles(part,2,[replacement]),3);assert.equal(w.files(part,3).STL.revision,2);assert.equal(w.files(part,3)['3MF'].key,w.files(part,2)['3MF'].key);
  assert.throws(()=>w.updateFiles(part,2,[f.cad]),/version changed/i);
  const broken=path.join(tmp,'broken.3mf');fs.writeFileSync(broken,'invalid');assert.throws(()=>w.updateFiles(part,3,[f.cad,broken]));assert.equal(w.state().versions.length,3);
  const empty=w.createPart('Empty');assert.equal(w.updateFiles(empty,0,[f.stl]),1);
  const backup=path.join(tmp,'backup');w.backup(backup);restored=new Workspace(restore(backup,path.join(tmp,'restored')));
  assert.deepEqual(restored.files(part,1),original);assert.equal(restored.state().reports[0].v,1);assert.equal(restored.files(part,3).STL.revision,2);
 }finally{w.db.close();restored?.db.close();}
});
test('drop uploads validate role and workspace, preserve filename, and clean up temporary data',async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'prc-uploads-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));const w=new Workspace(path.join(tmp,'workspace')),uploads=new Uploads();
 try{
  await assert.rejects(()=>uploads.receive(Readable.from([Buffer.from('x')]),w,'STL','part.step'),/matching/);
  await assert.rejects(()=>uploads.receive(Readable.from([]),w,'STL','part.stl'),/non-empty/);
  const file=await uploads.receive(Readable.from([Buffer.from('solid test\nendsolid test')]),w,'STL','part.stl');
  assert.equal(file.name,'part.stl');const [stored]=uploads.resolve({STL:file},w);assert.ok(fs.existsSync(stored));
  assert.throws(()=>uploads.resolve({CAD:file},w),/expired/);assert.throws(()=>uploads.resolve({STL:file},{root:'other'}),/expired/);
  uploads.discard({STL:file});assert.ok(!fs.existsSync(stored));assert.throws(()=>uploads.resolve({STL:file},w),/expired/);
  assert.equal(fs.readdirSync(path.join(w.root,'staging')).length,0);
  const stale=path.join(w.root,'staging','upload-00000000-0000-0000-0000-000000000000');fs.mkdirSync(stale);fs.writeFileSync(path.join(stale,'unfinished'),'temporary');
  fs.utimesSync(stale,new Date(0),new Date(0));const keep=path.join(w.root,'staging','keep');fs.mkdirSync(keep);
  uploads.prune(w);assert.equal(fs.existsSync(stale),false);assert.equal(fs.existsSync(keep),true);
 }finally{for(const id of uploads.entries.keys())uploads.remove(id);w.db.close();}
});
