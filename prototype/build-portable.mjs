// Bundle the demo into one HTML file that can be opened directly via file://.
import {build} from 'vite';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const output=await mkdtemp(path.join(tmpdir(),'printchill-portable-'));
try {
 await build({base:'./',build:{outDir:output,emptyOutDir:true,assetsInlineLimit:10000000}});
 let html=await readFile(path.join(output,'index.html'),'utf8');
 for(const match of [...html.matchAll(/<script type="module" crossorigin src="([^"]+)"><\/script>/g)]){
  const js=await readFile(path.join(output,match[1]),'utf8');
  html=html.replace(match[0],()=>'<script type="module">'+js.replace(/<\/script/gi,'<\\/script')+'</script>');
 }
 for(const match of [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)">/g)]){
  const cssFile=path.join(output,match[1]);let css=await readFile(cssFile,'utf8');
  // Vite can leave a legacy SVG font fallback outside assetsInlineLimit.
  for(const ref of [...css.matchAll(/url\(([^)]+)\)/g)]){
   const url=ref[1].replace(/^["']|["']$/g,'');if(url.startsWith('data:'))continue;
   const [file,fragment]=url.split('#');const bytes=await readFile(path.resolve(path.dirname(cssFile),file));
   const mime=file.endsWith('.svg')?'image/svg+xml':'application/octet-stream';
   css=css.replace(ref[0],()=>`url("data:${mime};base64,${bytes.toString('base64')}${fragment?'#'+fragment:''}")`);
  }
  html=html.replace(match[0],()=>'<style>'+css+'</style>');
 }
 await writeFile('Printchill-demo.html',html);
 console.log('Created Printchill-demo.html — standalone prototype v4');
} finally {await rm(output,{recursive:true,force:true});}
