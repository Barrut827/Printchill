import test from 'node:test';
import assert from 'node:assert/strict';
import {makePart,registerChange,latest,firstSentence} from './model.js';
const setup=()=>makePart({id:'TEST',name:'Test',stem:'test',withCad:true});
test('one multi-file registration creates one fixed Part version and advances only explicit dependencies',()=>{
 const p=setup(),old=JSON.stringify(latest(p));
 const v=registerChange(p,[{id:'cad',comment:'Adjust holes. Extra detail.'},{id:'stl',comment:'Export from updated CAD.'}],{date:'2026-11-15'});
 assert.equal(v.number,'002');assert.equal(p.versions.length,2);assert.equal(JSON.stringify(p.versions[0]),old);
 assert.equal(v.files.find(f=>f.id==='cad').rev,'C');assert.equal(v.files.find(f=>f.id==='stl').source.rev,'C');
 assert.equal(v.files.find(f=>f.id==='project').rev,'E');assert.equal(v.files.find(f=>f.id==='project').sources[0].rev,'B');
 assert.equal(firstSentence(v),'Adjust holes.');
});
test('3MF-only change preserves CAD/STL revisions and previous version profile',()=>{
 const p=setup();const v=registerChange(p,[{id:'project',comment:'Tune supports.'}],{profile:{material:'PLA',time:'20 min',weight:'8 g'}});
 assert.equal(v.files[0].rev,'B');assert.equal(v.files[1].rev,'B');assert.equal(v.files[2].rev,'F');assert.equal(p.versions[0].profile.material,'PETG');
 v.profile.material='ABS';assert.equal(p.versions[0].profile.material,'PETG');
});
test('empty changes, duplicate changes, unknown files and overflows are atomic failures',()=>{
 for(const changes of [[],[{id:'bad',comment:''}],[{id:'stl',comment:''},{id:'stl',comment:''}]]){const p=setup();const old=JSON.stringify(p);assert.throws(()=>registerChange(p,changes));assert.equal(JSON.stringify(p),old)}
 const p=setup();p.versions[0].number='999';assert.throws(()=>registerChange(p,[{id:'stl',comment:''}]));assert.equal(p.versions.length,1);
 const q=setup();q.versions[0].files[1].rev='Z';assert.throws(()=>registerChange(q,[{id:'stl',comment:''}]));assert.equal(q.versions.length,1);
});
