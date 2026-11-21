import {createCollections} from './collections.js';
import samples from 'sample-data';
import brands from 'brand-assets';
import {thumbnail,mountViewer,loadGeometry} from '../viewer.js';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const pad=n=>String(n).padStart(3,'0');
function revision(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
let page='library',selected=null,v=null,tab='details',layout='cards',sort='name',plate=0,dispose,drawId=0,backScroll=0;
let reports=[],saved=[],draft=null,backup=null;
const derived=[];
try{
  for(const entry of JSON.parse(localStorage.getItem('prc-v5-derived')||'[]')){
    const parent=samples.find(p=>p.id===entry.parent),source=parent?.versions.find(r=>r.v===entry.base);
    if(source&&!samples.some(p=>p.id===entry.id)){samples.push({...entry,tags:[...parent.tags],versions:[{...source,v:1,created:entry.created}]});derived.push(entry);}
  }
}catch{}
try{reports=JSON.parse(localStorage.getItem('prc-v5-reports')||'[]');saved=JSON.parse(localStorage.getItem('prc-v5-searches')||'[]');draft=JSON.parse(localStorage.getItem('prc-v5-draft')||'null');}catch{}
const cache=new Map();
try{const repos=JSON.parse(localStorage.getItem('prc-v5-repos')||'{}');for(const p of samples)if(/^https?:\/\//i.test(repos[p.id]||''))p.gitRepo=repos[p.id];}catch{}
function persist(){
  try{localStorage.setItem('prc-v5-reports',JSON.stringify(reports));localStorage.setItem('prc-v5-searches',JSON.stringify(saved));localStorage.setItem('prc-v5-draft',JSON.stringify(draft));}
  catch{message('Browser storage is full. Your changes remain visible in this session.');}
}
function message(s){$('message').textContent=s;clearTimeout(message.timer);message.timer=setTimeout(()=>$('message').textContent='',6000);}
function metrics(d){
  return {time:d.seconds!=null?Math.round(d.seconds/60)+' min':'Unknown',weight:d.grams!=null?d.grams.toFixed(1)+' g':'Unknown',material:(d.filaments||[]).map(f=>f.type).filter(Boolean).join(' / ')||'Unknown'};
}
function latest(p){return p.versions[0];}
function current(){return samples.find(p=>p.id===selected)||samples[0];}
function version(){const p=current();return p.versions.find(x=>x.v===v)||latest(p);}
function title(kicker,name,description,action=''){
  return '<div class="page-heading"><div><span class="eyebrow">'+esc(kicker)+'</span><h1>'+esc(name)+'</h1>'+(description?'<p>'+esc(description)+'</p>':'')+'</div>'+action+'</div>';
}
function fileList(r){return Object.entries(r.files).map(([kind,f])=>'<div class="file"><span class="kind">'+kind+'</span><span class="file-name">'+esc(f.name)+'</span><span class="badge">'+revision(f.revision)+'</span></div>').join('');}
function nav(){
  collectionUI.nav();
  $('part-count').textContent=samples.length;$('report-count').textContent=reports.length||'';
  document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===(page==='report-edit'?'reports':page==='backup'?'settings':page)));
  $('breadcrumb').textContent=page==='inspect'?current().name:({'library':'Library','reports':'Print reports','report-edit':'New print report',settings:'Settings',backup:'Settings / Backup & restore'})[page];
  const tags=[...new Set(samples.flatMap(p=>p.tags))].sort();
  $('tag-list').innerHTML=tags.map(t=>'<button class="badge '+($('search').value.split('+').map(x=>x.trim()).includes('#'+t)?'active':'')+'" data-tag="'+esc(t)+'">#'+esc(t)+'</button>').join('')||'<small>No tags assigned</small>';
  $('saved-list').innerHTML=saved.map((s,i)=>'<button data-query="'+i+'">⌑ '+esc(s.name)+'</button>').join('')||'<small>Keep useful searches here.</small>';
}
function matching(){
  const terms=$('search').value.toLowerCase().split('+').map(t=>t.trim());
  if(terms.length>1&&terms.some(t=>!t))throw Error('Add a search term on both sides of +.');
  return samples.filter(p=>{
    if(!collectionUI.matches(p))return false;
    const r=latest(p),m=metrics(r.details);
    const attr=$('parameter-filter').value,needle=$('parameter-value').value.toLowerCase();
    const raw=r.details.parameters?.[attr],values=Array.isArray(raw)?raw:[raw];
    if(attr&&!values.some(x=>x!=null&&String(x).toLowerCase().includes(needle)))return false;
    const days=$('days-filter').value,material=$('print-material-filter').value.trim().toLowerCase();
    if((days||material)&&!reports.some(x=>x.part===p.id&&(!days||Date.parse(x.created)>=Date.now()-Number(days)*86400000)&&(!material||x.material.toLowerCase()===material)))return false;
    return terms.every(t=>!t||t.startsWith('#')?(!t||p.tags.some(tag=>'#'+tag.toLowerCase()===t)):(p.name+' '+p.id+' '+m.material).toLowerCase().includes(t))&&
      (!$('file-filter').value||r.files[$('file-filter').value])&&
      (!$('material-filter').value||m.material.includes($('material-filter').value))&&
      (!$('report-filter').value||reports.some(r=>r.part===p.id));
  });
}
async function draw(){
  const serial=++drawId;dispose?.();dispose=null;nav();
  const el=$('content');el.className='page';
  if(page==='library'){
    let rows,error='';try{rows=matching();}catch(e){rows=[];error=e.message;}
    rows.sort((a,b)=>(sort==='number'?a.id.localeCompare(b.id):a.name.localeCompare(b.name)));
    el.innerHTML=title('YOUR WORKSHOP','Part library','Find a design. Choose the version. Pick up where you left off.','<button class="primary" id="import">＋ Create new part</button>')+
      '<div class="toolbar"><span>'+esc(error||rows.length+' parts · latest registered versions')+'</span><div class="row"><label class="row">Sort by <select id="sort"><option value="name">Name A–Z</option><option value="number">Part number</option></select></label><div class="view-switch"><button id="cards" aria-label="Card view" class="'+(layout==='cards'?'selected':'')+'">▦</button><button id="table" aria-label="Table view" class="'+(layout==='table'?'selected':'')+'">☷</button></div></div></div>'+
      (rows.length?(layout==='cards'?'<div class="cards">'+rows.map(p=>{
        const r=latest(p),m=metrics(r.details);
        return '<button class="part-card" data-part="'+p.id+'"><span class="preview"><img id="thumb-'+p.id+'" alt=""><span class="file-label">STL '+revision(r.files.STL?.revision||1)+'</span><span class="peek" id="peek-'+p.id+'">Inspect this Part version</span></span><span class="card-body"><span class="number">'+p.id+' <span style="float:right">v'+pad(r.v)+'</span></span><strong>'+esc(p.name)+'</strong><span class="row">'+p.tags.map(t=>'<span class="badge">#'+esc(t)+'</span>').join('')+'</span><span class="card-foot"><span>◷ '+m.time+'</span><span>'+m.weight+'</span></span></span></button>';
      }).join('')+'</div>':'<div class="panel table-wrap"><table><thead><tr><th>Part number</th><th>Name</th><th>Version</th><th>Files</th><th>Material</th><th>Print time</th><th>Weight</th></tr></thead><tbody>'+rows.map(p=>{const r=latest(p),m=metrics(r.details);return '<tr><td><button data-part="'+p.id+'">'+p.id+'</button></td><td>'+esc(p.name)+'</td><td>'+pad(r.v)+'</td><td>'+Object.keys(r.files).join(' · ')+'</td><td>'+m.material+'</td><td>'+m.time+'</td><td>'+m.weight+'</td></tr>';}).join('')+'</tbody></table></div>'):'<div class="empty">No matching parts. Adjust the search or filters on the left.</div>');
    el.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{backScroll=scrollY;selected=b.dataset.part;v=latest(current()).v;tab='details';page='inspect';draw();window.scrollTo(0,0);});
    $('cards').onclick=()=>{layout='cards';draw();};$('table').onclick=()=>{layout='table';draw();};
    $('sort').value=sort;$('sort').onchange=()=>{sort=$('sort').value;draw();};
    $('import').onclick=()=>modal('Create new part','<label>Part name<input id="new-name" required placeholder="A clear, recognisable name"></label><label>Start with<select id="create-mode"><option>Empty Part</option><option>Import existing files</option></select></label><label>Import CAD, STL and 3MF files<input id="create-files" type="file" multiple accept=".stl,.3mf,.step,.sldprt"></label><small>This creates a browser demo Part. Native file registration is available in the MVP.</small>','Create part',()=>{
      const id=newNumber(),files={};for(const f of ($('create-mode').value==='Import existing files'?$('create-files').files:[])){const ext=f.name.split('.').pop().toLowerCase(),kind=ext==='stl'?'STL':ext==='3mf'?'3MF':'CAD';files[kind]={name:f.name,revision:1};}
      samples.push({id,name:$('new-name').value,tags:[],versions:[{v:1,created:new Date().toISOString(),files,details:{},plates:[],geometry:null}]});
      selected=id;v=1;page='inspect';tab='details';draw();message('Demo Part created · '+id);
    });
    if(layout==='cards')for(const p of rows){
      const g=latest(p).geometry;if(!g)continue;
      if(!cache.has(g.importId))cache.set(g.importId,thumbnail(g).catch(()=>null));
      const image=await cache.get(g.importId);if(drawId!==serial)return;
      if(image)$('thumb-'+p.id).src=image;
      try{const geometry=await loadGeometry(g);$('peek-'+p.id).textContent=geometry.userData.dimensions.map(x=>Number(x.toFixed(1))).join(' × ')+' mm · '+metrics(latest(p).details).material;}catch{}
    }
  }
  if(page==='inspect')await inspect(serial);
  if(page==='reports')reportList();
  if(page==='report-edit')editReport();
  if(page==='backup')backupPage();
  if(page==='settings'){
    $('content').innerHTML=title('LOCAL WORKSPACE','Settings','Workspace tools and application preferences.')+'<div class="panel"><h2>Backup & restore</h2><p>Review a backup, choose what will be replaced and confirm recovery.</p><button id="open-backup">Open backup & restore →</button></div>';
    $('open-backup').onclick=()=>{page='backup';draw();};
  }
}
function newNumber(){let id;do{id=String(Math.floor(1000+Math.random()*9000))+'-'+String(Math.floor(1000+Math.random()*9000));}while(samples.some(p=>p.id===id));return id;}
function viewerButtons(){
  const icons=[['reset-view','Isometric view','M12 2 21 7v10l-9 5-9-5V7z M3 7l9 5 9-5 M12 12v10'],['top','Top view','M12 20V4 M6 10l6-6 6 6'],['front','Front view','M12 4v16 M6 14l6 6 6-6'],['left','Left view','M20 12H4 M10 6l-6 6 6 6'],['right','Right view','M4 12h16 M14 6l6 6-6 6'],['bounds','Dimensions','M2 16 16 2l6 6L8 22z M6 12l3 3 M9 9l2 2 M12 6l3 3']];
  return icons.map(([a,t,d])=>'<button data-view-action="'+a+'" title="'+t+'" aria-label="'+t+'"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="'+d+'"/></svg></button>').join('');
}
async function inspect(serial){
  const p=current(),r=version(),m=metrics(r.details),isLatest=r.v===latest(p).v;
  $('content').innerHTML=title('PART NUMBER',p.id+' — '+p.name+' — Version '+pad(r.v),'','<div class="row"><button id="back">← Library</button><button id="derive">Save as / derive</button><button class="brand-button bambu-button" id="bambu"><img src="'+brands.bambu+'" alt="">Open in Bambu Studio</button><button class="brand-button solidworks-button" id="solidworks" '+(!r.files.CAD?'disabled':'')+'><img src="'+brands.solidworks+'" alt="">Open in SolidWorks</button></div>')+
    '<div class="version-bar"><b>Part version</b><select id="version">'+p.versions.map(x=>'<option value="'+x.v+'" '+(r.v===x.v?'selected':'')+'>'+pad(x.v)+(x.v===latest(p).v?' · Latest':' · Historical')+'</option>').join('')+'</select><span>'+ (isLatest?'Latest registered combination':'Historical version · fixed file revisions')+'</span><span class="row">'+p.tags.map(t=>'<span class="badge">#'+esc(t)+'</span>').join('')+'</span></div>'+
    '<div class="tabs" role="tablist">'+[['details','Part details'],['plates','Print plates'],['history','History'],['part-reports','Print reports'],['wiki','Wiki']].map(([id,label])=>'<button role="tab" id="tab-'+id+'" aria-controls="panel" aria-selected="'+(tab===id)+'" tabindex="'+(tab===id?0:-1)+'" data-tab="'+id+'" class="'+(tab===id?'active':'')+'">'+label+'</button>').join('')+'</div>'+
    '<div class="inspect-grid"><section id="panel" role="tabpanel" aria-labelledby="tab-'+tab+'"></section><aside class="panel files"><h3>Related Objects version '+pad(r.v)+'</h3>'+(r.geometry?'<div class="viewer" id="viewer"><div class="viewer-controls">'+viewerButtons()+'<span data-dimensions hidden></span></div></div>':'<div class="empty">No STL for this version</div>')+fileList(r)+'<p class="source">Exact registered revisions · '+new Date(r.created).toLocaleDateString()+'</p></aside></div>';
  $('version').onchange=()=>{v=Number($('version').value);plate=0;draw();};
  $('solidworks').onclick=()=>modal('Open in SolidWorks','<p><b>'+esc(p.id)+' · version '+pad(r.v)+'</b></p><p>'+esc(r.files.CAD?.name||'No CAD object registered in this version.')+'</p><p>SolidWorks integration is a roadmap item. This demo shows the selected CAD object and handoff.</p>','Close',()=>{});
  $('back').onclick=()=>{page='library';draw();window.scrollTo(0,backScroll);};
  $('derive').onclick=()=>modal('Create a derived Part','<p>Branch from <b>'+esc(p.id)+' · version '+pad(r.v)+'</b></p><label>New Part number<input id="derived-number" required pattern="[0-9]{4}-[0-9]{4}" value="'+newNumber()+'"></label><label>New Part name<input id="derived-name" required value="'+esc(p.name+' — variant')+'"></label><small>The source relationship is kept in this browser demo. The new Part starts at version 001.</small>','Create derived Part',()=>{
    const id=$('derived-number').value;if(samples.some(x=>x.id===id)){message('This Part number already exists.');return false;}
    const entry={id,name:$('derived-name').value,parent:p.id,base:r.v,created:new Date().toISOString()};
    derived.push(entry);samples.push({...entry,tags:[...p.tags],versions:[{...r,v:1,created:entry.created}]});
    try{localStorage.setItem('prc-v5-derived',JSON.stringify(derived));}catch{message('Browser storage unavailable. Branch remains in this session.');}
    tab='history';draw();message('History branch created → '+id);
  });
  $('bambu').onclick=()=>modal('Open a working copy','<p><b>'+esc(p.name)+' · version '+pad(r.v)+'</b></p><p>Bambu Studio opens a working copy of 3MF '+revision(r.files['3MF']?.revision||1)+'. Further saves update the same working copy. PRC detects changes and asks you to confirm before creating a new Part version.</p><div class="note"><b>3MF change detected · example</b><br>Working base '+pad(r.v)+' → next version '+pad(latest(p).v+1)+'<br>CAD and STL revisions are retained.</div><p>This HTML previews the handoff. The running MVP opens the actual application.</p>','Got it',()=>{});
  document.querySelectorAll('[data-tab]').forEach(b=>{b.onclick=()=>{tab=b.dataset.tab;draw();};b.onkeydown=e=>{
    const tabs=[...document.querySelectorAll('[data-tab]')],i=tabs.indexOf(b);
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
    tab=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length].dataset.tab;
    draw().then(()=>$('tab-'+tab).focus());
  };});
  if(tab==='details'){
    const d=r.details;
    $('panel').classList.add('part-overview');
    $('panel').innerHTML='<section class="panel part-meta"><h2>Part details</h2><dl class="part-metadata"><dt>Created on</dt><dd>'+new Date(p.versions[p.versions.length-1].created).toLocaleString()+'</dd><dt>Last modified</dt><dd>'+new Date(latest(p).created).toLocaleString()+'</dd><dt>Tags</dt><dd><span class="row">'+(p.tags.map(t=>'<span class="badge">#'+esc(t)+'</span>').join('')||'None')+'</span></dd>'+collectionUI.details(p)+'<dt>Related Git repository</dt><dd id="repo-link">'+(p.gitRepo?'<a href="'+esc(p.gitRepo)+'" target="_blank" rel="noopener">'+esc(p.gitRepo)+'</a>':'Not linked')+' <button id="edit-repo" class="text-button">'+(p.gitRepo?'Edit':'＋ Link repository')+'</button></dd></dl><small>Dates reflect Part registrations in this workspace.</small></section><section class="print-section"><h2>Print settings</h2><p>Project settings for 3MF '+revision(r.files['3MF']?.revision||1)+' · all plates</p><div class="metrics">'+[
      ['Material',m.material,'Selected project filament'],['Print time',m.time,'Whole-project indication'],['Filament',m.weight,'Whole-project total'],['Layer height',d.height?d.height+' mm':'Unknown','Project setting'],['Infill',d.density||'Unknown',d.pattern||'Pattern unknown'],['Print plates',String(r.plates.length||d.plates||'—'),'Saved previews available']
    ].map(([label,value,note])=>'<div class="metric"><span>'+label+'</span><b>'+esc(value)+'</b><small>'+esc(note)+'</small></div>').join('')+'</div></section><div class="panel filament-panel"><h3>Selected filaments</h3>'+ (d.filaments||[]).map(f=>'<p><span class="swatch" style="background:'+(/^#[0-9a-f]{6}$/i.test(f.color)?f.color:'#ddd')+'"></span><b>'+esc(f.type)+'</b> · Slot '+f.slot+' <small>'+esc(f.color)+'</small></p>').join('')+'</div>';
    collectionUI.bind(p);
    $('edit-repo').onclick=()=>modal('Related Git repository','<label>Repository URL<input id="repo-url" type="url" placeholder="https://github.com/your-workshop/design" value="'+esc(p.gitRepo||'')+'"></label><small>Stored as a link in this browser prototype.</small>','Save link',()=>{const url=$('repo-url').value.trim();if(url&&!/^https?:\/\//i.test(url)){message('Use an http or https repository URL.');return false;}p.gitRepo=url;try{localStorage.setItem('prc-v5-repos',JSON.stringify(Object.fromEntries(samples.filter(x=>x.gitRepo).map(x=>[x.id,x.gitRepo]))));}catch{}draw();});
  }
  if(tab==='wiki')$('panel').innerHTML='<section class="panel"><span class="badge">Roadmap</span><h2 style="margin-top:16px">Part wiki</h2><p>Part-specific instructions, design decisions and assembly notes will live here.</p><small>Reserved UI space. Wiki editing and revision history are planned functionality.</small></section>';
  if(tab==='plates'){
    plate=Math.min(plate,Math.max(0,r.plates.length-1));
    $('panel').innerHTML='<h2>Print plates</h2><p>Saved in '+esc(r.files['3MF']?.name||'this version')+'</p>'+(r.plates.length?'<div class="panel"><img class="plate-large" alt="Plate '+r.plates[plate].id+'" src="'+r.plates[plate].src+'"><div class="plate-strip">'+r.plates.map((img,i)=>'<button data-plate="'+i+'" class="'+(plate===i?'active':'')+'"><img alt="" src="'+img.src+'">Plate '+img.id+'</button>').join('')+'</div><small>Plate '+r.plates[plate].id+' · 3MF '+revision(r.files['3MF'].revision)+' · saved project preview</small></div>':'<div class="empty">No saved plate PNG in this revision.</div>');
    document.querySelectorAll('[data-plate]').forEach(b=>b.onclick=()=>{plate=Number(b.dataset.plate);draw();});
  }
  if(tab==='history'){
    const origin=p.parent?samples.find(x=>x.id===p.parent):null;
    $('panel').innerHTML='<h2>History</h2><p>Versions and derived Parts connected to their source.</p>'+
      (origin?'<div class="origin-link"><span class="branch-icon">⑂</span><div><small>Derived from</small><button class="text-button" data-branch="'+origin.id+'" data-base="'+p.base+'">'+origin.id+' · '+esc(origin.name)+' · '+pad(p.base)+' →</button></div></div>':'')+
      '<div class="history-graph">'+p.versions.map((x,i)=>{
        const children=samples.filter(child=>child.parent===p.id&&child.base===x.v);
        return '<div class="history-entry"><span class="history-node '+(x.v===r.v?'selected':'')+'"></span><div class="history-card"><div class="history-heading"><span class="version-chip">'+pad(x.v)+'</span><b>'+(i===p.versions.length-1?'First registration':'Registered file changes')+'</b><small>'+new Date(x.created).toLocaleDateString()+'</small></div><div class="history-files">'+fileList(x)+'</div><button data-history="'+x.v+'" class="text-button">View this version →</button></div>'+children.map(child=>'<div class="history-branch"><span class="branch-node"></span><button class="branch-link" data-branch="'+child.id+'"><small>DERIVED PART · VERSION 001</small><strong>'+child.id+'</strong><span>'+esc(child.name)+'</span><span class="branch-arrow">→</span></button></div>').join('')+'</div>';
      }).join('')+'</div>';
    document.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>{v=Number(b.dataset.history);draw();});
    document.querySelectorAll('[data-branch]').forEach(b=>b.onclick=()=>{selected=b.dataset.branch;v=Number(b.dataset.base)||latest(current()).v;tab='history';draw();});
  }
  if(tab==='part-reports'){
    $('panel').innerHTML='<div class="page-heading"><h2>Print reports</h2><button class="primary" id="new-report">＋ Record attempt</button></div>'+reportCards(reports.filter(x=>x.part===p.id));
    $('new-report').onclick=()=>newReport(p,r);
  }
  if(r.geometry){
    const el=$('viewer');try{const close=await mountViewer(el,r.geometry);if(serial===drawId)dispose=close;else close();}catch{el.textContent='Preview unavailable';}
  }
}
function reportCards(rows){
  return rows.length?'<div class="report-list">'+rows.map(x=>'<div class="panel"><div class="row"><span class="badge">'+esc(x.outcome)+'</span><b>'+esc(x.name)+'</b><small>Version '+pad(x.v)+' · '+new Date(x.created).toLocaleDateString()+'</small></div><p>'+esc(x.note)+'</p><small>'+esc(x.measurements||'No measurements recorded')+'</small>'+(x.image?'<img class="photo" alt="Report photo" src="'+x.image+'">':'')+'</div>').join('')+'</div>':'<div class="empty">No print reports yet.<br>Record a print attempt at the version you actually used.</div>';
}
function reportList(){
  $('content').innerHTML=title('PRINT FEEDBACK','Print reports','Outcomes and measurements tied to a specific Part version.','<button class="primary" id="new">＋ Record attempt</button>')+reportCards(reports);
  $('new').onclick=()=>newReport(current(),version());
}
function newReport(p,r){selected=p.id;v=r.v;if(!draft||draft.part!==p.id||draft.v!==r.v)draft={part:p.id,v:r.v,name:p.name,outcome:'Success',material:metrics(r.details).material,note:'',measurements:'',printer:'',image:null};persist();page='report-edit';draw();window.scrollTo(0,0);}
function editReport(){
  const p=current(),r=version();
  if(!draft){newReport(p,r);return;}
  $('content').innerHTML=title('PART '+p.id+' · VERSION '+pad(r.v),'Record a print attempt','Your report stays with this registered combination.','<button id="cancel-report">Back to part</button>')+
    '<div class="note">3MF '+revision(r.files['3MF']?.revision||1)+' · '+esc(r.files['3MF']?.name||'No 3MF registered')+'<small id="draft-status">Draft kept in this browser</small></div>'+
    '<div class="report-grid"><section class="panel"><h2>Outcome & measurements</h2><div class="field-pair"><label>Result<select id="result">'+['Success','Failed','Aborted'].map(x=>'<option '+(x===draft.outcome?'selected':'')+'>'+x+'</option>').join('')+'</select></label><label>Printed material<input id="report-material" value="'+esc(draft.material)+'"></label></div><label>Printer<input id="printer" placeholder="e.g. Bambu Lab X1 Carbon" value="'+esc(draft.printer)+'"></label><label>Measurements<textarea id="measurements" placeholder="Feature · expected · measured · unit · deviation">'+esc(draft.measurements)+'</textarea></label><label>Observations<textarea id="notes" placeholder="What worked? What needs to change?">'+esc(draft.note)+'</textarea></label></section>'+
    '<section><div class="panel"><h3>Print context</h3><table>'+[['Layer height',r.details.height?r.details.height+' mm':'Unknown'],['Infill',r.details.density||'Unknown'],['Material',metrics(r.details).material],['Print time',metrics(r.details).time],['Filament',metrics(r.details).weight]].map(([k,value])=>'<tr><td>'+k+'</td><td><b>'+esc(value)+'</b></td></tr>').join('')+'</table><details><summary>More process parameters</summary><small>Available in MVP 0.2.6: search and add any saved project parameter.</small></details></div><div class="panel" style="margin-top:18px"><h3>Photos & screenshots</h3><label>Add an image<input type="file" id="photo" accept="image/png,image/jpeg,image/webp"></label><small>Demo accepts one image, up to 2 MB.</small><div id="photo-preview">'+(draft.image?'<img class="photo" alt="Report image" src="'+draft.image+'">':'')+'</div></div></section></div>'+
    '<div class="actions report-actions"><button id="discard">Discard draft</button><button class="primary" id="save-report">Save print report</button></div>';
  const process=$('content').querySelector('.report-grid details');
  process.innerHTML='<summary>More process parameters</summary><label>Find a project parameter<input id="process-search" type="search" placeholder="e.g. wall speed"></label><div id="process-values"></div>';
  const renderParameters=()=>{const query=$('process-search').value.toLowerCase().replaceAll(' ','_');$('process-values').innerHTML='<table>'+Object.entries(r.details.parameters||{}).filter(([key])=>key.toLowerCase().includes(query)).slice(0,12).map(([key,value])=>'<tr><td>'+esc(key.replaceAll('_',' '))+'</td><td>'+esc(Array.isArray(value)?value.join(' / '):value)+'</td></tr>').join('')+'</table>';};
  $('process-search').oninput=renderParameters;renderParameters();
  for(const [id,key] of [['result','outcome'],['report-material','material'],['printer','printer'],['measurements','measurements'],['notes','note']])$(id).oninput=()=>{draft[key]=$(id).value;persist();$('draft-status').textContent='Draft saved in this browser';};
  $('photo').onchange=()=>{const f=$('photo').files[0];if(!f)return;if(f.size>2000000||!/^image\/(png|jpeg|webp)$/.test(f.type)){message('Choose a PNG, JPEG or WebP image up to 2 MB.');return;}const reader=new FileReader();reader.onload=()=>{draft.image=reader.result;persist();$('photo-preview').innerHTML='<img class="photo" alt="Report image" src="'+draft.image+'">';};reader.readAsDataURL(f);};
  $('cancel-report').onclick=()=>{page='inspect';tab='part-reports';draw();};
  $('discard').onclick=()=>modal('Discard this draft?','<p>The saved print reports will remain available.</p>','Discard draft',()=>{draft=null;persist();page='reports';draw();});
  $('save-report').onclick=()=>{reports.unshift({...draft,id:crypto.randomUUID(),created:new Date().toISOString()});draft=null;persist();page='inspect';tab='part-reports';draw();window.scrollTo(0,0);message('Demo report saved · Part version unchanged.');};
}
function backupPage(){
  const known=backup?backup.parts:[],conflicts=known.filter(p=>samples.some(x=>x.id===p.id)),added=known.filter(p=>!samples.some(x=>x.id===p.id));
  $('content').innerHTML=title('LOCAL WORKSPACE','Backup & restore','Review the contents before you replace anything.')+
    '<div class="backup-grid"><div class="panel"><h2>Create a backup</h2><p>Keep a copy of your workspace.</p><div class="metrics"><div class="metric"><span>Parts</span><b>'+samples.length+'</b></div><div class="metric"><span>Versions</span><b>'+samples.reduce((n,p)=>n+p.versions.length,0)+'</b></div><div class="metric"><span>Reports</span><b>'+reports.length+'</b></div></div><button id="export">↧ Export demo backup</button><p class="source">This export contains demo records and report drafts. Native files stay embedded in this HTML.</p></div>'+
    '<div class="panel"><h2>Restore a backup</h2><p>Choose a demo backup to inspect its contents.</p><label>Backup file<input type="file" id="backup-file" accept=".json"></label><button id="sample-backup" class="text-button">Use a sample backup →</button><small>Actual folder selection and file recovery run in the MVP.</small></div></div>'+
    (backup?'<section class="panel" style="margin-top:22px"><div class="page-heading"><div><span class="eyebrow">BACKUP PREVIEW</span><h2>'+esc(backup.name)+'</h2><small>'+esc(backup.created?new Date(backup.created).toLocaleString():'Creation date unknown')+' · '+known.length+' Parts · '+(JSON.stringify(backup).length/1000000).toFixed(2)+' MB of demo records</small></div><span class="badge">Ready for review</span></div><div class="backup-grid"><div><h3>Add '+added.length+' Parts</h3><ul class="list">'+added.map(p=>'<li>＋ '+esc(p.id)+' · '+esc(p.name)+'</li>').join('')+'</ul></div><div><h3>Replace '+conflicts.length+' Parts</h3><ul class="list">'+conflicts.map(p=>'<li>↻ '+esc(p.id)+' · '+esc(p.name)+'</li>').join('')+'</ul></div></div><div class="warn">Confirming replaces versions and reports for the listed Part numbers. Review pending work before continuing.</div><div class="actions"><button id="cancel-restore">Cancel</button><button class="primary" id="confirm-restore">Confirm restore</button></div></section>':'');
  $('export').onclick=()=>{const data={format:'prc-ui-v5',name:'Workshop backup',created:new Date().toISOString(),parts:samples.map(p=>({id:p.id,name:p.name})),reports};const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));a.href=url;a.download='PrintChill-v5-demo-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
  $('sample-backup').onclick=()=>{backup={name:'Workshop · sample recovery',created:new Date().toISOString(),parts:samples.slice(0,2).map(p=>({id:p.id,name:p.name})),reports:[]};draw();};
  $('backup-file').onchange=async()=>{try{const data=JSON.parse(await $('backup-file').files[0].text());if(data.format!=='prc-ui-v5'||!Array.isArray(data.parts)||!Array.isArray(data.reports))throw Error();backup=data;draw();}catch{message('Select a PrintChill v5 demo backup JSON.');}};
  if(backup){$('cancel-restore').onclick=()=>{backup=null;draw();};$('confirm-restore').onclick=()=>{backup=null;draw();message('Restore confirmation preview complete. Use MVP 0.2.6 to restore actual files.');};}
}
function modal(name,body,save,fn){
  $('modal-title').textContent=name;$('modal-body').innerHTML=body;$('modal-submit').textContent=save;
  $('modal-form').onsubmit=e=>{e.preventDefault();if(fn()!==false)$('modal').close();};$('modal').showModal();
}
$('modal-close').onclick=()=>$('modal').close();
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=b.dataset.page;draw();window.scrollTo(0,0);});
$('search').oninput=()=>{page='library';draw();};
for(const id of ['file-filter','material-filter','report-filter','parameter-filter','parameter-value','days-filter','print-material-filter'])$(id).oninput=()=>{page='library';draw();};
$('filters-toggle').onclick=()=>{$('filters').hidden=!$('filters').hidden;$('parameter-filters').hidden=$('filters').hidden;$('filters-toggle').setAttribute('aria-expanded',String(!$('filters').hidden));};
$('clear-filters').onclick=()=>{for(const id of ['file-filter','material-filter','report-filter','parameter-filter','parameter-value','days-filter','print-material-filter'])$(id).value='';$('search').value='';draw();};
$('tag-list').onclick=e=>{const b=e.target.closest('[data-tag]');if(!b)return;const token='#'+b.dataset.tag,terms=$('search').value.split('+').map(t=>t.trim()).filter(Boolean);$('search').value=(terms.includes(token)?terms.filter(t=>t!==token):[...terms,token]).join(' + ');page='library';draw();};
$('save-search').onclick=()=>modal('Save this search','<label>Search name<input id="query-name" required></label>','Save search',()=>{saved.push({name:$('query-name').value,query:$('search').value,file:$('file-filter').value,material:$('material-filter').value,report:$('report-filter').value,extra:Object.fromEntries(['parameter-filter','parameter-value','days-filter','print-material-filter'].map(id=>[id,$(id).value]))});persist();nav();});
$('saved-list').onclick=e=>{const b=e.target.closest('[data-query]');if(!b)return;const s=saved[Number(b.dataset.query)];$('search').value=s.query;$('file-filter').value=s.file;$('material-filter').value=s.material;$('report-filter').value=s.report;for(const [id,value] of Object.entries(s.extra||{}))$(id).value=value;page='library';draw();};
$('help').onclick=()=>modal('UI prototype v5','<p>A self-contained preview of the proposed PrintChill interface, using a snapshot of five registered sample Parts.</p><p>Browse real STL geometry, select historical versions, inspect saved plate images, try reports and review a demo backup.</p><p>Report and search edits stay in this browser. Launching Bambu Studio, native import and restoring production files are available in the running MVP.</p>','Got it',()=>{});
$('material-filter').innerHTML='<option value="">Any material</option>'+[...new Set(samples.flatMap(p=>latest(p).details.filaments||[]).map(f=>f.type).filter(Boolean))].map(t=>'<option>'+esc(t)+'</option>').join('');
$('parameter-filter').innerHTML='<option value="">Any parameter</option>'+[...new Set(samples.flatMap(p=>Object.keys(latest(p).details.parameters||{})))].sort().map(k=>'<option>'+esc(k)+'</option>').join('');
const collectionUI=createCollections({samples,esc,modal,redraw:()=>draw(),library:()=>{page='library';}});
draw().catch(e=>message(e.message));
