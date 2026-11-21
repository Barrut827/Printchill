import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {hasValue,filledParameters,parameterText,parameterTable,reportContext,measurementTable,matchingParameters,parameterValue} from './report-data.js';
import {Workspace,restore,reportToken} from './store.mjs';
const esc=s=>String(s).replaceAll('<','&lt;').replaceAll('>','&gt;');
test('report parameters hide missing values, preserve zero/false and source slot numbers',()=>{
  for(const value of [null,undefined,'','  ','null','NULL',[],[null,''],{}])assert.equal(hasValue(value),false);
  const source={absent:null,empty:'',unset:'null',speed:0,support:false,temperature:[null,'220']};
  assert.deepEqual(Object.keys(filledParameters(source)),['speed','support','temperature']);
  const table=parameterTable(source,esc);assert.doesNotMatch(table,/absent|empty|unset|\bnull\b/);assert.match(table,/Slot 2: 220/);assert.match(table,/>0</);assert.match(table,/>false</);
  assert.equal(parameterText({unused:null,enabled:false}),'enabled: false');
  assert.equal(parameterText(['220','220','220']),'Slots 1–3: 220');
  assert.equal(parameterText(['PLA',null,'PLA']),'Slots 1, 3: PLA');
});
test('report context uses selected filaments and exact 3MF printer model',()=>{
  const parameters={printer_model:'Bambu Lab X1 Carbon',printer_settings_id:'Bambu Lab X1 Carbon 0.4 nozzle',filament_type:['PLA','ABS','PETG-CF']};
  assert.deepEqual(reportContext(parameters,[{slot:3,type:'PETG-CF'}]),{printer:'Bambu Lab X1 Carbon',material:'PETG-CF'});
  assert.equal(reportContext(parameters).material,''); // Several configured materials are not proof of actual use.
  assert.equal(reportContext({filament_type:['PLA','PLA']}).material,'PLA');
  assert.equal(reportContext({printer_settings_id:'Custom printer preset'}).printer,'Custom printer preset');
});
test('support parameters can be found by friendly name; suggestions stay separate from source values',()=>{
 const source={support_top_z_distance:'0.2',support_bottom_z_distance:'0.1',support_unknown:null};
 assert.ok(matchingParameters(source,'support z offset').includes('support_top_z_distance'));
 assert.equal(parameterValue('support_top_z_distance','0.2'),'0.2 mm');
 const html=parameterTable({support_top_z_distance:'0.2'},esc,{support_top_z_distance:'0.15'});
 assert.match(html,/Support Z offset[\s\S]*0.2 mm[\s\S]*0.15/);assert.equal(source.support_top_z_distance,'0.2');
});
test('structured measurements and legacy notes survive storage and backup; invalid rows are rejected',t=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'prc-measurements-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
  const w=new Workspace(path.join(tmp,'workspace'));let restored;
  try{
    const part=w.createPart('Measurement fixture');w.addVersion(part,1,{});
    const rows=[{id:'M1',position:'Hole diameter',nominal:'20 mm',value:'19,8 mm'},{id:'M2',position:'Width',value:'42.3 mm'}];
    w.report(part,1,'Success','Measured','PLA',{measurements:rows,printer:'Bambu Lab X1 Carbon'});
    assert.throws(()=>w.report(part,1,'Success','','',{measurements:[{id:'M1',position:'',value:'10'}]}),/measurement/i);
    assert.throws(()=>w.report(part,1,'Success','','',{measurements:[rows[0],rows[0]]}),/measurement/i);
    assert.throws(()=>w.report(part,1,'Success','','',{measurements:[{...rows[0],nominal:{value:20}}]}),/nominal/i);
    w.report(part,1,'Failed','Legacy','',{measurements:'Original measurement notes <kept>'});
    const backup=path.join(tmp,'backup');w.backup(backup);restored=new Workspace(restore(backup,path.join(tmp,'restored')));
    const reports=restored.state().reports;assert.equal(reports.length,2);
    const structured=JSON.parse(reports.find(r=>r.outcome==='Success').details);assert.deepEqual(structured.measurements,rows);
    assert.match(measurementTable(structured,esc),/M1[\s\S]*Hole diameter[\s\S]*M2/);
    assert.match(measurementTable(structured,esc),/Nominal value \(3D model\)[\s\S]*20 mm[\s\S]*19,8 mm/);
    assert.match(measurementTable(JSON.parse(reports.find(r=>r.outcome==='Failed').details),esc),/Original measurement notes &lt;kept&gt;/);
    assert.equal(restored.state().versions.length,1);
  }finally{w.db.close();restored?.db.close();}
});
test('editing updates one report, preserves its source and creation date, and rejects conflicting edits',t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'prc-edit-report-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));const w=new Workspace(path.join(tmp,'workspace'));let restored;
 try{
  const part=w.createPart('Report fixture');w.addVersion(part,1,{});w.addVersion(part,2,{});
  const details={id:'attempt-uuid',parameters:{support_top_z_distance:'0.2'},suggestions:{support_top_z_distance:'0.15'},measurements:[{id:'M1',position:'Diameter',nominal:'20 mm',value:'19.8 mm'}],images:[{name:'screenshot.png',data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6LsAAAAASUVORK5CYII='}]};
  w.report(part,1,'Failed','First observation','PLA',details);const before=w.one('SELECT * FROM reports'),expected=reportToken(before);
  const changed={...details,suggestions:{support_top_z_distance:'0.12'}};
  w.editReport(before.id,expected,'Success','Updated observation','PETG',changed);
  const after=w.one('SELECT * FROM reports');assert.equal(after.id,before.id);assert.equal(after.created,before.created);assert.equal(after.part,part);assert.equal(after.v,1);assert.equal(after.note,'Updated observation');
  const saved=JSON.parse(after.details);assert.deepEqual(saved.images,details.images);assert.deepEqual(saved.measurements,details.measurements);assert.deepEqual(saved.sourceFiles,JSON.parse(before.details).sourceFiles);assert.equal(saved.id,details.id);assert.equal(saved.suggestions.support_top_z_distance,'0.12');
  assert.throws(()=>w.editReport(before.id,expected,'Failed','Stale edit','PLA',details),/changed in another window/);
  w.editReport(before.id,expected,'Success','Updated observation','PETG',changed);assert.equal(w.state().reports.length,1);
  const backup=path.join(tmp,'backup');w.backup(backup);restored=new Workspace(restore(backup,path.join(tmp,'restored')));assert.deepEqual(restored.state().reports,w.state().reports);assert.equal(restored.state().versions.length,2);
 }finally{w.db.close();restored?.db.close();}
});
