import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {Workspace} from './store.mjs';
import {DatabaseSync} from 'node:sqlite';
import {backupPreview,mergeBackup} from './merge.mjs';
import {metadata} from './metadata.bundle.mjs';
import {zipSync,strToU8} from 'fflate';
test('sliced G-code totals versus project-only first layer',()=>{
  const project={'Metadata/model_settings.config':strToU8('<config><plate><metadata key="plater_id" value="1"/></plate></config>'),'Metadata/plate_1.json':strToU8('{"first_layer_time":71.26123}')};
  assert.equal(metadata(zipSync(project)).seconds,null);
  const result=metadata(zipSync({...project,'Metadata/plate_1.gcode':strToU8('; total estimated time: 1h 3m\n; filament used [g] = 3.25, 4.75\n')}));
  assert.equal(result.seconds,3780);assert.equal(result.grams,8);
});
import {results} from './library.js';
const samples=fileURLToPath(new URL('../POC material/',import.meta.url));
const stl=path.join(samples,'27980400_wall_mount_rev_A.STL');
test('solid 10 mm cube: mass, speed, sparse fill and build scaling affect PRC estimate',()=>{
  const vertices=[[0,0,0],[10,0,0],[10,10,0],[0,10,0],[0,0,10],[10,0,10],[10,10,10],[0,10,10]];
  const faces=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  function calc(fill,speed,scale=1){
    const geom='<model><resources><object id="1"><mesh><vertices>'+vertices.map(([x,y,z])=>`<vertex x="${x}" y="${y}" z="${z}"/>`).join('')+'</vertices><triangles>'+faces.map(([a,b,c])=>`<triangle v1="${a}" v2="${b}" v3="${c}"/>`).join('')+'</triangles></mesh></object></resources><build><item objectid="1" transform="'+scale+' 0 0 0 1 0 0 0 1 0 0 0"/></build></model>';
    return metadata(zipSync({'3D/3dmodel.model':strToU8(geom),'Metadata/model_settings.config':strToU8('<config><plate><metadata key="plater_id" value="1"/></plate></config>'),
      'Metadata/project_settings.config':strToU8(JSON.stringify({layer_height:0.2,wall_loops:0,sparse_infill_density:fill,filament_density:[1.25],internal_solid_infill_speed:speed}))})).estimated;
  }
  const solid=calc('100%',100);
  assert.ok(Math.abs(solid.grams-1.25)<1e-6);
  assert.ok(calc('100%',20).seconds>solid.seconds);
  assert.ok(Math.abs(calc('20%',100).grams-.25)<1e-6);
  assert.ok(Math.abs(calc('100%',100,2).grams-2.5)<1e-6);
});
test('0.1.1 workspace migrates once with recoverable legacy backup',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'prc-upgrade-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const root=path.join(dir,'vault');let w=new Workspace(root);
  const part=w.importPart('Legacy',[stl]);w.report(part,1,'Success','Before upgrade');w.db.close();
  const old=new DatabaseSync(path.join(root,'workspace.sqlite'));
  old.exec('DROP TABLE searches; DROP TABLE part_tags; ALTER TABLE reports DROP COLUMN material; PRAGMA user_version=1');old.close();
  w=new Workspace(root);
  try{
    const backup=fs.readdirSync(dir).find(s=>s.startsWith('vault-pre-0.2-'));
    assert.ok(backup);assert.deepEqual(backupPreview(w,path.join(dir,backup)).conflicts,[part]);
    assert.equal(w.state().reports[0].note,'Before upgrade');assert.equal(w.one('PRAGMA user_version').user_version,2);
  }finally{w.db.close();}
});
test('preview and merge replace shared Part, preserve local Part, reject damaged bytes',t=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'prc-merge-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
  const local=new Workspace(path.join(tmp,'local')),incoming=new Workspace(path.join(tmp,'incoming'));
  try{
    const a=local.importPart('Local',[stl]),b=local.importPart('Shared',[stl]);
    local.report(b,1,'Success','local');
    incoming.run('INSERT INTO parts VALUES(?,?)',b,'From backup');
    incoming.addVersion(b,1,{STL:incoming.capture(stl,'STL')});
    incoming.report(b,1,'Failed','backup','PETG');
    const c=incoming.importPart('New',[stl]),backup=path.join(tmp,'backup');
    incoming.backup(backup);
    const p=backupPreview(local,backup);
    assert.deepEqual(p.conflicts,[b]);assert.deepEqual(p.additions,[c]);
    assert.throws(()=>mergeBackup(local,backup,'outdated'));
    mergeBackup(local,backup,p.token);
    assert.equal(local.state().parts.length,3);assert.equal(local.files(a,1).STL.key,local.files(b,1).STL.key);
    assert.equal(local.state().reports[0].note,'backup');
    fs.writeFileSync(path.join(backup,'objects',local.files(b,1).STL.key),'broken');
    assert.throws(()=>mergeBackup(local,backup,backupPreview(local,backup).token));
    assert.equal(local.state().parts.length,3);
  }finally{local.db.close();incoming.db.close();}
});
test('selected project filament and same-attempt relative material query',()=>{
  const d=metadata(fs.readFileSync(path.join(samples,'7382-4916 - makita blower wall mount.3mf')));
  assert.equal(d.plates,2);assert.equal(d.filaments[0].slot,4);assert.equal(d.seconds,null);
  const now=Date.now(),w={parts:[{id:'1',name:'Makita'}],versions:[{part:'1',files:{'3MF':{key:'k'}}}],tags:[{part:'1',tag:'roboticarm'}],details:{k:d},reports:[
    {part:'1',created:new Date(now).toISOString(),material:'PLA'},
    {part:'1',created:new Date(now-7*86400000).toISOString(),material:'PETG'}]};
  const c={query:'#roboticarm + PLA',role:'3MF',days:'3',material:'PETG'};
  assert.equal(results(w,c,now).length,0);c.material='PLA';assert.equal(results(w,c,now).length,1);
  assert.equal(results(w,c,now+4*86400000).length,0);assert.throws(()=>results(w,{query:'test +'}));
});
