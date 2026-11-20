import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';

const port = Number(process.env.PRC_PORT || 47831);
async function ready() {
  try {
    const response = await fetch('http://127.0.0.1:' + port, {signal: AbortSignal.timeout(800)});
    const prc=response.ok && (await response.text()).includes('name="prc-token"');
    if(prc && response.headers.get('X-PrintChill-Build')!=='0.2.6')return 'outdated';
    return prc;
  } catch { return false; }
}
const running=await ready();
if(running==='outdated')throw Error('An older PrintChill backend is still running. Close its terminal with Ctrl+C, or sign out and back in, then run this start.cmd again.');
if (!running) {
  const child = spawn(process.execPath, [fileURLToPath(new URL('./server.mjs', import.meta.url))], {
    detached: true, windowsHide: true, stdio: 'ignore'
  });
  child.unref();
  let started = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    await delay(150);
    if (await ready()===true) { started = true; break; }
    if (child.exitCode !== null) break;
  }
  if (!started) throw Error('PrintChill could not start. Run node.exe server.mjs in this folder to see the backend error.');
}
