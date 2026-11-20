export function queryTerms(text){
  if(!text.trim())return [];
  const terms=text.split('+').map(t=>t.trim().toLowerCase());
  if(terms.some(t=>!t||t==='#'||t.includes('#')&&!/^#[\w-]+$/u.test(t)))throw Error('Use a name, number or #tag. Put a term on both sides of +.');
  return terms;
}
export function results(w,c,now=Date.now()){
  const terms=queryTerms(c.query),cutoff=c.days?now-Number(c.days)*86400000:null;
  return w.parts.map(p=>{
    const latest=w.versions.find(v=>v.part===p.id),tags=w.tags.filter(t=>t.part===p.id).map(t=>t.tag.toLowerCase());
    const details=w.details[latest.files['3MF']?.key]||{},materials=(details.filaments||[]).map(f=>f.type?.toLowerCase());
    const reports=w.reports.filter(r=>r.part===p.id),name=p.name.toLowerCase();
    const raw=details.parameters?.[c.attribute],values=Array.isArray(raw)?raw:[raw];
    if(c.attribute&&!values.some(x=>x!=null&&String(x).toLowerCase().includes((c.attributeValue||'').trim().toLowerCase())))return null;
    const exact=t=>t.startsWith('#')?tags.includes(t.slice(1)):name.includes(t)||p.id.includes(t)||materials.includes(t);
    const similar=terms.length===1&&!exact(terms[0])&&/^[\p{L}]{4,}$/u.test(terms[0])&&name.split(/\W+/).some(word=>oneEdit(word,terms[0]));
    const match=terms.every(exact)||similar;
    const print=c.days||c.material||c.printed;
    if(!match||c.role&&!latest.files[c.role]||print&&!reports.some(r=>(!cutoff||Date.parse(r.created)>=cutoff)&&(!c.material||r.material?.toLowerCase()===c.material.trim().toLowerCase())))return null;
    return {p,latest,tags,details,reports,similar};
  }).filter(Boolean).sort((a,b)=>c.sort==='number'?a.p.id.localeCompare(b.p.id):a.p.name.localeCompare(b.p.name));
}
function oneEdit(a,b){
  if(Math.abs(a.length-b.length)>1)return false;
  let i=0,j=0,count=0;
  while(i<a.length&&j<b.length){
    if(a[i]===b[j]){i++;j++;continue;}
    if(++count>1)return false;
    if(a.length>=b.length)i++;
    if(b.length>=a.length)j++;
  }
  return count+a.length-i+b.length-j<=1;
}
