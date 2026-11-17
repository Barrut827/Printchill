import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {detailValues,timeIndication} from './part-details.js';
import {makePart,registerChange} from './model.js';
const sample=JSON.parse(readFileSync(new URL('./assets/makita-details.json',import.meta.url)));
test('sample retains filament slots, project settings and missing slicing statistics',()=>{
 const d=detailValues(sample);
 assert.equal(d.height,'0.2 mm');assert.equal(d.density,'15%');assert.equal(d.pattern,'grid');assert.equal(d.plates,'2');
 assert.equal(d.weight,'Unknown');assert.equal(d.time,'Slice required');assert.equal(d.material,'PLA');assert.equal(d.filaments.length,1);
 assert.equal(d.filaments[0].slot,4);assert.equal(d.filaments[0].profile,'Generic PLA');
});
test('multiple materials, missing metadata and zero values remain distinct',()=>{
 assert.equal(detailValues({filaments:[{type:'PLA',selected:true},{type:'PETG',selected:true},{type:'ABS',selected:false},{type:'PLA',selected:true}]}).material,'PLA / PETG');
 assert.equal(detailValues(null).plates,'Unknown');assert.equal(detailValues(null).height,'Unknown');
 assert.equal(detailValues({totalWeight:0}).weight,'0 g');assert.equal(detailValues({plateCount:0}).plates,'0');
});
test('metadata follows unchanged 3MF but not a simulated new 3MF revision',()=>{
 const p=makePart({id:'test',name:'test',stem:'test'});p.versions[0].details=structuredClone(sample);
 const v=registerChange(p,[{id:'cad',comment:'Change CAD only.'}]);assert.deepEqual(v.details,sample);
 const next=registerChange(p,[{id:'project',comment:'Re-slice.'}]);assert.equal(next.details,undefined);
 assert.deepEqual(p.versions[0].details,sample);
});

test('time indication uses coarse slicer estimates, never fabricated precision',()=>{
 assert.equal(timeIndication(900),'Approx. 15 min');assert.equal(timeIndication(3598),'Approx. 1 h');
 assert.equal(timeIndication(4499),'Approx. 1 h 15 min');assert.equal(timeIndication(60),'Less than 5 min');
 assert.equal(timeIndication(null),null);assert.equal(timeIndication(-1),null);
 assert.equal(detailValues({printTimeSeconds:900}).time,'Approx. 15 min');
});
