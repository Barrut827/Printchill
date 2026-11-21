import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {Workspace} from './store.mjs';

test('UC-003: native image paste, clipboard button, text paste, draft and saved images',{timeout:90000},async t=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'prc-report-paste-'));
  const root=path.join(tmp,'workspace'),w=new Workspace(root);
  w.importPart('Clipboard fixture',[fileURLToPath(new URL('../POC material/27980400_wall_mount_rev_A.STL',import.meta.url))]);w.db.close();
  fs.mkdirSync(path.join(tmp,'PrintChill'));fs.writeFileSync(path.join(tmp,'PrintChill/settings.json'),JSON.stringify({root}));
  const server=spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{env:{...process.env,PRC_PORT:'47843',LOCALAPPDATA:tmp},windowsHide:true});
  let browser,stderr='';server.stderr.on('data',b=>stderr+=b);
  t.after(async()=>{await browser?.close();if(server.exitCode===null&&server.signalCode===null){const end=once(server,'exit');server.kill();await end;}fs.rmSync(tmp,{recursive:true,force:true});});
  await Promise.race([once(server.stdout,'data'),once(server,'exit').then(()=>{throw Error(stderr);})]);
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:47843');await page.locator('.card').click();
  await page.getByRole('tab',{name:'Print reports',exact:true}).click();await page.getByRole('button',{name:'Add print report',exact:true}).click();
  // Use the browser's real clipboard and keyboard paste, not a synthetic paste event.
  await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;canvas.getContext('2d').fillRect(0,0,64,32);const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));await navigator.clipboard.write([new ClipboardItem({'image/png':png})]);});
  await page.locator('#outcome').focus();await page.keyboard.press('Control+V');
  await page.waitForFunction(()=>document.querySelectorAll('#report-gallery img').length===1);
  await page.locator('#notes').focus();await page.keyboard.press('Control+V');
  await page.waitForFunction(()=>document.querySelectorAll('#report-gallery img').length===2);
  assert.equal(await page.locator('#notes').inputValue(),'');
  await page.getByRole('button',{name:'Paste from clipboard',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('#report-gallery img').length===3);
  // Reproduce a clipboard provider with image items but an empty .files list.
  await page.evaluate(()=>{
    const bytes=Uint8Array.from(atob(document.querySelector('#report-gallery img').src.split(',')[1]),c=>c.charCodeAt(0));
    const image=new File([bytes],'items-only.png',{type:'image/png'});
    const event=new Event('paste',{bubbles:true,cancelable:true});
    Object.defineProperty(event,'clipboardData',{value:{items:[{kind:'file',getAsFile:()=>image}],files:[]}});
    document.querySelector('#notes').dispatchEvent(event);
  });
  await page.waitForFunction(()=>document.querySelectorAll('#report-gallery img').length===4);
  await page.evaluate(()=>navigator.clipboard.writeText('Clipboard text stays in notes'));
  await page.locator('#notes').focus();await page.keyboard.press('Control+V');
  assert.equal(await page.locator('#notes').inputValue(),'Clipboard text stays in notes');
  await page.getByRole('button',{name:'Paste from clipboard',exact:true}).click();
  await page.locator('#report-image-error').getByText(/No image found/).waitFor();
  assert.equal(await page.locator('#report-gallery img').count(),4);
  await page.evaluate(()=>{window.testClipboardRead=navigator.clipboard.read;navigator.clipboard.read=()=>Promise.reject(new DOMException('Denied','NotAllowedError'));});
  await page.getByRole('button',{name:'Paste from clipboard',exact:true}).click();
  await page.locator('#report-image-error').getByText(/access was blocked/).waitFor();
  await page.evaluate(()=>{navigator.clipboard.read=window.testClipboardRead;});
  assert.equal(await page.locator('#submit').isEnabled(),true);
  await page.evaluate(()=>{
    const event=new Event('paste',{bubbles:true,cancelable:true});
    Object.defineProperty(event,'clipboardData',{value:{items:[],files:[new File([new Uint8Array(2000001)],'large.png',{type:'image/png'})]}});
    document.querySelector('#report-paste').dispatchEvent(event);
  });
  await page.locator('#report-image-error').getByText(/larger than 2 MB/).waitFor();
  assert.equal(await page.locator('#report-gallery img').count(),4);
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Add print report',exact:true}).click();
  assert.equal(await page.locator('#report-gallery img').count(),4);
  assert.equal(await page.locator('#report-image-error').innerText(),'');
  // One paste after reopening adds exactly one image: no leaked event handlers.
  await page.evaluate(async()=>{
    const bytes=Uint8Array.from(atob(document.querySelector('#report-gallery img').src.split(',')[1]),c=>c.charCodeAt(0));
    await navigator.clipboard.write([new ClipboardItem({'image/png':new Blob([bytes],{type:'image/png'})})]);
  });
  await page.locator('#report-paste').focus();await page.keyboard.press('Control+V');
  await page.waitForFunction(()=>document.querySelectorAll('#report-gallery img').length===5);
  await page.locator('#submit').click();await page.locator('#dialog').waitFor({state:'hidden'});
  await page.getByText(/Print report #/).click();assert.equal(await page.locator('#detail .plates img').count(),5);
  const db=new Workspace(root);
  try{const rows=db.state().reports;assert.equal(rows.length,1);const saved=JSON.parse(rows[0].details);assert.equal(saved.images.length,5);assert.equal(rows[0].note,'Clipboard text stays in notes');}finally{db.db.close();}
  // Opening another dialog must not keep an old report paste handler alive.
  await page.locator('#settings').click();
  await page.evaluate(()=>navigator.clipboard.writeText('Clipboard text stays in notes'));
  await page.locator('#root').fill('');await page.locator('#root').focus();await page.keyboard.press('Control+V');
  assert.equal(await page.locator('#root').inputValue(),'Clipboard text stays in notes');
  assert.deepEqual(errors,[]);
});
