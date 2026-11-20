import {build} from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const options={absWorkingDir:root,bundle:true,format:'esm',minify:true,legalComments:'eof'};
await build({...options,entryPoints:['../prototype/viewer.js'],outfile:'viewer.bundle.js',nodePaths:[path.join(root,'node_modules')],plugins:[{
  name:'workspace-geometry',setup(b){
    b.onResolve({filter:/^\.\/catalog\.js$/},()=>({path:'workspace',namespace:'prc'}));
    b.onLoad({filter:/.*/,namespace:'prc'},()=>({contents:'export const assetUrl=url=>url;'}));
  }
}]});
await build({...options,entryPoints:['metadata.mjs'],platform:'node',outfile:'metadata.bundle.mjs'});
const notices=['three','fast-xml-parser','fflate','fast-xml-builder','strnum','anynum','path-expression-matcher','xml-naming','@nodable/entities','is-unsafe'].map(name=>{
  const dir=path.join(root,'node_modules',name),license=fs.readdirSync(dir).find(f=>/^license(\.|$)/i.test(f));
  return name+'\n'+fs.readFileSync(path.join(dir,license||'package.json'),'utf8');
});
fs.writeFileSync(path.join(root,'THIRD-PARTY.txt'),notices.join('\n\n'));
