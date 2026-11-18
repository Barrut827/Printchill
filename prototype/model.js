// Part versions are immutable combinations; supplementary records live separately.
export const pad=n=>String(n).padStart(3,'0');
export function makePart({id,name,stem,file,color,tags=[],collection='Imports',withCad=true}) {
 const cad=withCad?[{id:'cad',kind:'CAD',name:stem+'.SLDPRT',rev:'B',source:null}]:[];
 return {id,name,stem,file,color,tags,collection,versions:[{number:'001',date:'2026-11-10',author:'Morgan',files:[...cad,{id:'stl',kind:'STL',name:stem+'.STL',rev:withCad?'B':'A',source:withCad?{id:'cad',rev:'B'}:null},{id:'project',kind:'3MF',name:stem+'.3mf',rev:withCad?'E':'A',sources:[{id:'stl',rev:withCad?'B':'A'}]}],profile:{material:withCad?'PETG':'PLA',weight:withCad?'46 g':'8 g',time:withCad?'1 h 52 min':'24 min'},changes:[...cad,{id:'stl'},{id:'project'}].map(f=>({id:f.id,comment:'Initial design imported.'}))}]};
}
export const latest=p=>p.versions.at(-1);
export function registerChange(part,changes,{date,author='Morgan',profile}={}) {
 if(!changes.length)throw Error('Select at least one changed file.');
 const base=latest(part),number=Number(base.number)+1;
 if(number>999)throw Error('Version limit 999 reached. Numbering policy needs to be defined.');
 const files=structuredClone(base.files),ids=new Set();
 for(const change of changes){
  if(ids.has(change.id))throw Error('A file can only change once per registration.');ids.add(change.id);
  const file=files.find(f=>f.id===change.id);if(!file)throw Error('Unknown file.');
  if(!/^[A-Y]$/.test(file.rev))throw Error('Revision after Z is not yet defined in this prototype.');
  file.rev=String.fromCharCode(file.rev.charCodeAt(0)+1);
 }
 // Source references advance only when the dependent file is explicitly changed too.
 for(const file of files){if(!ids.has(file.id))continue;
  if(file.source&&ids.has(file.source.id))file.source.rev=files.find(f=>f.id===file.source.id).rev;
  if(file.sources)for(const source of file.sources)if(ids.has(source.id))source.rev=files.find(f=>f.id===source.id).rev;
 }
 const version={number:pad(number),date:date||new Date().toISOString().slice(0,10),author,files,profile:structuredClone(profile||base.profile),changes:changes.map(c=>({id:c.id,comment:c.comment.trim()}))};
 if(base.details&&!changes.some(c=>base.files.find(f=>f.id===c.id)?.kind==='3MF'))version.details=structuredClone(base.details);
 part.versions.push(version);return version;
}
export function firstSentence(version){const text=version.changes.map(c=>c.comment).find(Boolean);return text?(text.match(/^[^.!?\n]+[.!?]?/)?.[0]||text):'File revisions updated.';}
