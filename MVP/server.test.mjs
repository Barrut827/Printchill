import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

test('local app: settings, native file registration, download and print report',async t=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'prc-http-'));
  const child=spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{env:{...process.env,LOCALAPPDATA:tmp,PRC_PORT:'47839'},windowsHide:true});
  t.after(async()=>{const finished=once(child,'exit');child.kill();await finished;fs.rmSync(tmp,{recursive:true,force:true});});
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server failed to start');})]);
  const origin='http://127.0.0.1:47839',html=await (await fetch(origin)).text();
  const token=html.match(/name="prc-token" content="([^"]+)"/)[1];
  const post=(action,body={})=>fetch(origin+'/api',{method:'POST',headers:{origin,'x-prc-token':token},body:JSON.stringify({action,...body})});
  assert.equal((await fetch(origin+'/api',{method:'POST'})).status,400);
  assert.equal((await post('settings',{root:path.join(tmp,'vault')})).status,200);
  const stl=fileURLToPath(new URL('../POC material/27980400_wall_mount_rev_A.STL',import.meta.url));
  const part=await (await post('import',{name:'Bracket',paths:[stl]})).json();
  assert.match(part,/^\d{4}-\d{4}$/);
  assert.equal((await post('report',{part,v:1,outcome:'Success',note:'Pilot'})).status,200);
  const {workspace}=await (await post('state')).json();assert.equal(workspace.reports[0].part,part);
  const file=await fetch(origin+'/download?part='+part+'&v=1&role=STL');assert.deepEqual(Buffer.from(await file.arrayBuffer()),fs.readFileSync(stl));
});
