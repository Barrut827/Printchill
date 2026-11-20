import {queryTerms,results} from './library.js';
import {reportForm} from './reports.js';
import {thumbnail,mountViewer,loadGeometry} from './viewer.bundle.js';
const $=id=>document.getElementById(id);
const thumbs=new Map();
let table=false,disposeViewer,scrollBefore=0;
function criteria(){return {query:$('search').value,role:$('role').value,material:$('material').value,days:$('days').value,printed:$('printed').checked,sort:$('sort').value,attribute:$('attribute').value,attributeValue:$('attribute-value').value};}
function geometry(p,v){const f=v.files.STL;return {importId:f.key,geometryAsset:'/download?part='+encodeURIComponent(p)+'&v='+v.v+'&role=STL'};}
const thumbnails=new IntersectionObserver(entries=>{for(const entry of entries){
  if(!entry.isIntersecting)continue;
  const img=entry.target;thumbnails.unobserve(img);
  const f={geometryAsset:img.dataset.url,importId:img.dataset.key};
  if(!thumbs.has(f.importId))thumbs.set(f.importId,thumbnail(f).catch(()=>null));
  thumbs.get(f.importId).then(src=>{if(src&&img.isConnected){img.src=src;img.hidden=false;}});
  loadGeometry(f).then(g=>{if(img.isConnected)img.closest('.card').querySelector('.dim').textContent=g.userData.dimensions.map((n,i)=>'XYZ'[i]+' '+Number(n.toFixed(1))).join(' × ')+' mm';}).catch(()=>{});
}});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const version=n=>String(n).padStart(3,'0');
let state,part,v,signature='',submitAction;
async function api(action,body={}){
  const r=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json','X-PRC-Token':document.querySelector('[name=prc-token]').content},body:JSON.stringify({action,...body})});
  const value=await r.json();if(!r.ok)throw Error(value.error);return value;
}
function note(msg){$('notice').textContent=msg;}
async function refresh(force=false){
  const next=await api('state'),sig=JSON.stringify(next);
  if(force||signature!==sig){state=next;signature=sig;draw();}
}
function draw(){
  const w=state?.workspace;
  $('create').disabled=!w;
  const parts=w?.parts||[],c=criteria();let rows=[],message='';
  const attrs=[...new Set(Object.values(w?.details||{}).flatMap(d=>Object.keys(d.parameters||{})))].sort();
  $('attribute').innerHTML='<option value="">Any project parameter</option>'+attrs.map(k=>'<option '+(k===c.attribute?'selected':'')+'>'+esc(k)+'</option>').join('');
  try{rows=w?results(w,c):[];message=rows.length+' parts'+(c.query.trim()?' · '+queryTerms(c.query).join(' AND '):'');}catch(e){message=e.message;}
  $('count').textContent=message;$('saved').innerHTML='<option value="">Saved searches…</option>'+(w?.searches||[]).map(r=>'<option>'+esc(r.name)+'</option>').join('');
  if(rows.some(r=>r.similar))$('count').textContent+=' · includes similar names';
  $('layout').textContent=table?'Card view':'Table view';
  const tagBar=$('side-tags'),allTags=[...new Set((w?.tags||[]).map(t=>t.tag))].sort();
  tagBar.innerHTML=allTags.map(t=>'<button type="button" class="badge" data-tag="'+esc(t)+'" aria-pressed="'+(c.query.split('+').some(q=>q.trim()==='#'+t))+'">#'+esc(t)+'</button>').join('');
  tagBar.parentElement.hidden=!allTags.length;
  const card=({p,latest,tags,details})=>{
    const stl=latest.files.STL,geo=stl&&geometry(p.id,latest);
    const metrics=latest.files['3MF']?printMetric(details,'seconds',false)+' · '+printMetric(details,'grams',false):'Time and weight unknown';
    const badges=tags.map(t=>'<span class="badge">#'+esc(t)+'</span>').join('');
    return '<button class="card" data-part="'+esc(p.id)+'"><span class="visual">'+(geo?'<img alt="" data-key="'+esc(stl.key)+'" data-url="'+esc(geo.geometryAsset)+'">':'<span>No STL</span>')+'<span class="peek"><b>Dimensions</b><span class="dim">'+(geo?'Dimensions pending':'Unavailable')+'</span><b>Print time · weight</b>'+metrics+'</span></span><small>'+esc(p.id)+' · v'+version(latest.v)+'</small><strong>'+esc(p.name)+'</strong><small>'+metrics+'</small><span class="badges">'+badges+'</span></button>';
  };
  thumbnails.disconnect();$('library').className=table?'table-view':'cards';
  $('library').innerHTML=table?'<table><thead><tr><th>Part</th><th>Number</th><th>Version</th><th>Files</th></tr></thead><tbody>'+rows.map(({p,latest})=>'<tr><td><button data-part="'+esc(p.id)+'">'+esc(p.name)+'</button></td><td>'+esc(p.id)+'</td><td>'+version(latest.v)+'</td><td>'+esc(Object.keys(latest.files).join(', '))+'</td></tr>').join('')+'</tbody></table>':rows.map(card).join('');
  $('library').querySelectorAll('img').forEach(el=>thumbnails.observe(el));
  disposeViewer?.();disposeViewer=null;
  document.body.classList.toggle('inspecting',parts.some(p=>p.id===part));
  const p=parts.find(p=>p.id===part);
  if(!p){$('detail').innerHTML='<h2>'+(w?'Select a Part':'Connect your workspace')+'</h2><p>'+esc(state?.startup||(w?'Import a Part or select one from the library.':'Open Settings to create or connect a local workspace.'))+'</p>';return;}
  const versions=w.versions.filter(x=>x.part===part),latest=versions[0].v;
  const selected=versions.find(x=>x.v===v)||versions[0];v=selected.v;
  const jobs=w.jobs.filter(j=>j.part===part&&(j.changed||j.missing));
  const reports=w.reports.filter(r=>r.part===part);
  $('detail').innerHTML='<small>PART '+esc(part)+'</small><h2>'+esc(p.name)+'</h2><div class="row"><label>Part version<select id="version">'+versions.map(x=>'<option value="'+x.v+'" '+(x.v===v?'selected':'')+'>'+version(x.v)+(x.v===latest?' · Latest':' · Historical')+'</option>').join('')+'</select></label>'+(selected.files['3MF']?'<button data-action="open">Open in Bambu Studio</button>':'')+'<button data-action="report">Add print report</button></div><div id="jobs">'+jobs.map(j=>'<section><b>'+ (j.missing?'Working copy unavailable':'3MF change detected')+'</b><p>Working base '+version(j.base)+' · Latest '+version(latest)+'</p><button data-confirm="'+esc(j.id)+'">Review change</button></section>').join('')+'</div><h3>Registered files</h3><ul>'+Object.entries(selected.files).map(([role,f])=>'<li><b>'+role+'</b> · Revision '+letter(f.revision)+' · <a href="/download?part='+encodeURIComponent(part)+'&v='+v+'&role='+encodeURIComponent(role)+'">'+esc(f.name)+'</a></li>').join('')+'</ul><h3>Logbook</h3><ul>'+versions.map(x=>'<li><button data-version="'+x.v+'">'+version(x.v)+'</button> '+esc(new Date(x.created).toLocaleString())+' · '+Object.entries(x.files).map(([r,f])=>r+' '+letter(f.revision)).join(' / ')+'</li>').join('')+'</ul><h3>Print reports</h3>'+reports.map(r=>'<p><button data-version="'+r.v+'">Version '+version(r.v)+'</button> '+esc(r.outcome)+' · '+esc(new Date(r.created).toLocaleDateString())+'<br>'+esc(r.note)+'</p>').join('')+(reports.length?'':'<p>No print attempts recorded.</p>')+(w.jobs.some(j=>j.part===part)?'<button data-action="alternate">Choose another 3MF…</button>':'');
  enrich();
}
function printMetric(details,key,source=true){
  const saved=details[key],amount=saved??details.estimated?.[key];
  if(saved==null&&details.sliceStatus?.startsWith('Calculating'))return 'Calculating…';
  if(amount==null)return 'Unknown';
  const quantity=key==='seconds'?Math.max(1,Math.round(amount/60))+' min':Math.round(amount*10)/10+' g';
  return !source?quantity:quantity+(saved==null?' · PRC model only':details.resliced?' · Bambu calculation':' · Bambu slice');
}
function estimateInfo(d){
  const calculate=d.sliceStatus?'<p role="status">'+esc(d.sliceStatus)+'</p>':'';
  if(d.resliced)return '<p>Calculated locally from this registered revision. Includes printer preparation and generated support.</p>';
  if(!d.estimated)return d.estimateNote?calculate+'<p>PRC estimate unavailable: '+esc(d.estimateNote)+'</p>':calculate;
  return calculate+'<details><summary>How PRC estimated this print</summary>'+d.estimated.plates.map(p=>'<p><b>Plate '+esc(p.plateId)+'</b> · '+Math.round(p.seconds/60)+' min · '+p.grams.toFixed(1)+' g</p><p>'+esc(p.notes.join(' '))+'</p><dl>'+Object.entries(p.parameters).map(([key,val])=>'<dt>'+esc(key.replaceAll('_',' '))+'</dt><dd>'+esc(val)+'</dd>').join('')+'</dl>').join('')+'</details>';
}
function viewerTools(){
  const icons=[
    ['reset-view','Isometric view','M12 2 21 7v10l-9 5-9-5V7z M3 7l9 5 9-5 M12 12v10'],
    ['front','Front view','M4 4h16v16H4z M12 7v10 M8 13l4 4 4-4'],
    ['top','Top view','M4 4h16v16H4z M12 17V7 M8 11l4-4 4 4'],
    ['left','Left view','M4 4h16v16H4z M17 12H7 M11 8l-4 4 4 4'],
    ['right','Right view','M4 4h16v16H4z M7 12h10 M13 8l4 4-4 4'],
    ['bounds','Dimensions','M2 16L16 2l6 6L8 22z M6 12l3 3 M9 9l2 2 M12 6l3 3 M15 3l2 2']
  ];
  return icons.map(([action,label,d])=>'<button type="button" title="'+label+'" aria-label="'+label+'" data-view-action="'+action+'"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="'+d+'"/></svg></button>').join('');
}
function enrich(){
  const w=state?.workspace,s=w?.versions.find(x=>x.part===part&&x.v===v);if(!s)return;
  const d=w.details[s.files['3MF']?.key]||{},tags=w.tags.filter(t=>t.part===part).map(t=>'#'+t.tag);
  if(s.files['3MF']&&(d.plateIds||[]).length){
    $('detail').insertAdjacentHTML('beforeend','<h3>Saved plate previews · 3MF '+letter(s.files['3MF'].revision)+'</h3><div class="plates">'+d.plateIds.map(id=>'<figure><img loading="lazy" alt="Plate '+esc(id)+' saved in this 3MF revision" src="/plate?part='+encodeURIComponent(part)+'&v='+v+'&index='+encodeURIComponent(id)+'"><figcaption>Plate '+esc(id)+'</figcaption></figure>').join('')+'</div>');
  }
  const reports=w.reports.filter(r=>r.part===part);
  for(const r of reports){
    const payload=JSON.parse(r.details||'{}');
    if(!Object.keys(payload).length)continue;
    $('detail').insertAdjacentHTML('beforeend','<details><summary>Print report #'+r.id+' · version '+version(r.v)+' · '+esc(r.outcome)+'</summary><p>'+esc([payload.printer,payload.plate,payload.sourceName].filter(Boolean).join(' · '))+'</p><p>'+esc(payload.measurements||'No measurements')+'</p><dl>'+Object.entries(payload.parameters||{}).map(([k,value])=>'<dt>'+esc(k)+'</dt><dd>'+esc(JSON.stringify(value))+'</dd>').join('')+'</dl><div class="plates">'+(payload.images||[]).map(img=>'<figure><img alt="'+esc(img.name)+'" src="'+esc(img.data)+'"><figcaption>'+esc(img.name)+'</figcaption></figure>').join('')+'</div></details>');
  }
  if(s.files['3MF'])$('detail').querySelector('h2').insertAdjacentHTML('afterend','<p><strong>Print time</strong> '+printMetric(d,'seconds')+' &nbsp; <strong>Filament</strong> '+printMetric(d,'grams')+'</p>');
  const value=(x,unit='')=>x==null?'Unknown':esc(x)+unit;
  $('detail').insertAdjacentHTML('afterbegin','<button class="back" data-action="back">← Library</button>');
  $('jobs').insertAdjacentHTML('afterend','<div class="row"><button data-action="tags">Edit tags</button><small>'+esc(tags.join(' '))+'</small></div>'+
    (s.files.STL?'<details id="inspect"><summary>Inspect STL · Revision '+letter(s.files.STL.revision)+'</summary><div id="scene"><div class="viewer-tools">'+viewerTools()+'<span data-dimensions hidden></span></div></div></details>':'')+
    (s.files['3MF']?'<details><summary>Print details · 3MF '+letter(s.files['3MF'].revision)+'</summary><p>'+esc(s.files['3MF'].name)+' · Project settings</p><dl>'+Object.entries({'Layer height':value(d.height,' mm'),'Infill':value(d.density)+' · '+value(d.pattern),'Plates':value(d.plates),'Selected filament':(d.filaments||[]).map(f=>esc([f.type,f.color].filter(Boolean).join(' '))).join(', ')||'Unknown','Weight':printMetric(d,'grams'),'Print time':printMetric(d,'seconds')}).map(([k,x])=>'<dt>'+k+'</dt><dd>'+x+'</dd>').join('')+'</dl>'+estimateInfo(d)+'</details>':''));
  const panel=$('inspect');if(panel)panel.ontoggle=async()=>{if(!panel.open)return;const scene=$('scene');if(!scene||scene.dataset.loaded)return;scene.dataset.loaded='1';try{const dispose=await mountViewer(scene,geometry(part,s));if(scene.isConnected)disposeViewer=dispose;else dispose();}catch{scene.textContent='STL preview unavailable.';}};
}
function letter(n){let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
function dialog(title,fields,label,fn){
  $('title').textContent=title;$('fields').innerHTML=fields;$('submit').textContent=label;$('error').textContent='';submitAction=fn;
  if(!$('dialog').open)$('dialog').showModal();
}
function input(id,label,value=''){return '<label>'+label+'<input required id="'+id+'" value="'+esc(value)+'"></label>';}
function picker(id,kind){return '<button type="button" data-pick="'+id+'" data-kind="'+kind+'">Browse…</button>';}
function settings(){
  dialog('Workspace settings',input('root','Workspace folder',state.root)+picker('root','folder')+'<label>Bambu Studio executable<input id="exe" placeholder="'+esc(state.bambu)+'"></label>'+picker('exe','bambu')+'<hr><div class="row"><button type="button" data-task="backup">Create backup</button><button type="button" data-task="restore">Restore backup</button></div>','Connect workspace',async()=>{await api('settings',{root:$('root').value,bambu:$('exe').value||undefined});part=null;});
}
$('settings').onclick=settings;
$('create').onclick=()=>dialog('Import Part',input('name','Part name')+'<label>CAD, STL or 3MF · one file per role<textarea id="paths" required readonly></textarea></label>'+picker('paths','files'),'Register version 001',async()=>{part=await api('import',{name:$('name').value,paths:$('paths').value.split('\n').filter(Boolean)});v=1;});
for(const id of ['search','material','role','days','printed','sort','attribute','attribute-value'])$(id).oninput=draw;
$('side-tags').onclick=e=>{const b=e.target.closest('[data-tag]');if(!b)return;const token='#'+b.dataset.tag,terms=$('search').value.split('+').map(s=>s.trim()).filter(Boolean);$('search').value=(terms.includes(token)?terms.filter(s=>s!==token):[...terms,token]).join(' + ');draw();[...$('side-tags').children].find(x=>x.dataset.tag===b.dataset.tag)?.focus();};
$('layout').onclick=()=>{table=!table;draw();};
$('save-search').onclick=()=>{try{queryTerms(criteria().query);dialog('Save search',input('search-name','Search name'),'Save',()=>api('saveSearch',{name:$('search-name').value,criteria:criteria()}));}catch(e){note(e.message);}};
$('saved').onchange=()=>{const row=state.workspace.searches.find(r=>r.name===$('saved').value);if(!row)return;const c=JSON.parse(row.criteria);$('search').value=c.query;for(const k of ['role','material','days','sort','attribute'])$(k).value=c[k]||'';$('attribute-value').value=c.attributeValue||'';$('printed').checked=c.printed;draw();};
$('library').onclick=e=>{const btn=e.target.closest('[data-part]');if(btn){const inspectModel=!!e.target.closest('.visual');scrollBefore=window.scrollY;part=btn.dataset.part;v=null;draw();if(inspectModel&&$('inspect'))$('inspect').open=true;window.scrollTo(0,0);$('detail').querySelector('button')?.focus();}};
$('detail').onchange=e=>{if(e.target.id==='version'){v=Number(e.target.value);draw();}};
function review(job,alternate){
  const latest=state.workspace.versions.find(x=>x.part===part).v;
  dialog('Confirm 3MF revision','<p>Part '+esc(part)+' · Working base '+version(job.base)+' · Latest '+version(latest)+'</p><p>'+ (latest!==job.base?'The Part has changed since this copy was opened. Confirm to keep the latest CAD and STL and register the selected 3MF on that combination.':'Register the saved 3MF with the current CAD and STL revisions.')+'</p>'+(alternate?'<p>'+esc(alternate)+'</p>':''),'Confirm revision',async()=>{v=await api('confirm',{id:job.id,latest,alternate});});
}
$('detail').onclick=async e=>{try{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.action==='back'){const previous=part;part=null;draw();$('library').querySelector('[data-part="'+CSS.escape(previous)+'"]')?.focus({preventScroll:true});window.scrollTo(0,scrollBefore);}
  if(b.dataset.action==='tags')dialog('Part tags','<label>Tags, separated by spaces<input id="edit-tags" value="'+esc(state.workspace.tags.filter(t=>t.part===part).map(t=>t.tag).join(' '))+'"></label>','Save tags',()=>api('tags',{part,tags:$('edit-tags').value}));
  if(b.dataset.version){v=Number(b.dataset.version);draw();}
  if(b.dataset.confirm)review(state.workspace.jobs.find(j=>j.id===b.dataset.confirm));
  if(b.dataset.action==='open'){await api('open',{part,v});note('Working copy opened in Bambu Studio.');await refresh();}
  if(b.dataset.action==='alternate'){
    const job=state.workspace.jobs.find(j=>j.part===part&&j.base===v);
    if(!job)throw Error('Select the base version of the working copy first.');
    const [p]=await api('pick',{kind:'model'});if(p)review(job,p);
  }
  if(b.dataset.action==='report'){
    const f=state.workspace.versions.find(r=>r.part===part&&r.v===v).files['3MF'];
    reportForm({part,version:v,parameters:state.workspace.details[f?.key]?.parameters||{},source:{root:state.root,name:f?.name},api,dialog,esc,refresh});
  }
}catch(err){note(err.message);}};
$('fields').onclick=async e=>{try{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.pick){const values=await api('pick',{kind:b.dataset.kind});if(values.length)$(b.dataset.pick).value=values.join('\n');}
  if(b.dataset.task==='backup')dialog('Create backup','<p>Registered versions and reports are included. Confirm pending working copies first if you want to include them.</p>'+input('dest','Empty backup folder')+picker('dest','folder'),'Back up',()=>api('backup',{destination:$('dest').value}));
  if(b.dataset.task==='restore'){
    dialog('Restore backup',input('src','Completed backup folder')+picker('src','folder')+'<label>Restore mode<select id="mode"><option value="merge">Merge into current workspace</option><option value="copy">Open as separate workspace</option></select></label>','Continue',async()=>{
      const source=$('src').value;
      if($('mode').value==='copy'){
        dialog('Restore separate workspace',input('dest','Destination folder')+picker('dest','folder'),'Restore and open',async()=>{await api('restore',{source,destination:$('dest').value});part=null;});
      }else{
        const p=await api('previewBackup',{source});
        dialog('Review backup', '<p><b>'+esc(p.name)+'</b><br>'+esc(p.created?new Date(p.created).toLocaleString():'Creation date unknown')+' · '+p.parts+' Parts · '+(p.bytes/1000000).toFixed(2)+' MB</p><p>Add: '+esc(p.additions.join(', ')||'None')+'</p><p>Replace: '+esc(p.conflicts.join(', ')||'None')+'</p><p>'+p.versions+' existing versions and '+p.reports+' reports will be replaced.</p>'+(p.pending.length?'<p>Resolve working copies for '+esc(p.pending.join(', '))+' first.</p>':''),'Confirm merge',()=>api('mergeBackup',{source,token:p.token}));
        if(p.pending.length)submitAction=()=>{throw Error('Resolve pending work before merging.');};
      }
      return false;
    });
  }
}catch(err){$('error').textContent=err.message;}};
$('cancel').onclick=()=>$('dialog').close();
$('form').onsubmit=async e=>{e.preventDefault();$('submit').disabled=true;try{if(await submitAction()===false)return;$('dialog').close();await refresh(true);note('Saved.');}catch(err){$('error').textContent=err.message;}finally{$('submit').disabled=false;}};
await refresh(true);if(!state.workspace)settings();
setInterval(()=>{if(!document.hidden&&!$('dialog').open)refresh().catch(e=>note(e.message));},2000);
window.addEventListener('focus',()=>refresh().catch(e=>note(e.message)));
