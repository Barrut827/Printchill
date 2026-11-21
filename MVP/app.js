import {relatedFilesForm} from './import-form.js';
import {queryTerms,results} from './library.js';
import {reportForm} from './reports.js';
import {thumbnail,mountViewer,loadGeometry} from './viewer.bundle.js';
import {cards,inspect,reportCards,title} from './screens.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const version=n=>String(n).padStart(3,'0');
const thumbs=new Map();
let table=false,disposeViewer,scrollBefore=0,collection='',tab='details',page='library',drawId=0;
let state,part,v,signature='',submitAction;
function criteria(){return {collection,query:$('search').value,role:$('role').value,material:$('material').value,days:$('days').value,printed:$('printed').checked,sort:$('sort').value,attribute:$('attribute').value,attributeValue:$('attribute-value').value};}
function geometry(p,r){return {importId:r.files.STL.key,geometryAsset:'/download?part='+encodeURIComponent(p)+'&v='+r.v+'&role=STL'};}
const thumbnails=new IntersectionObserver(entries=>{for(const entry of entries){
  if(!entry.isIntersecting)continue;const img=entry.target;thumbnails.unobserve(img);
  const f={geometryAsset:img.dataset.url,importId:img.dataset.key};
  if(!thumbs.has(f.importId))thumbs.set(f.importId,thumbnail(f).catch(()=>null));
  thumbs.get(f.importId).then(src=>{if(src&&img.isConnected)img.src=src;});
  loadGeometry(f).then(g=>{if(img.isConnected)img.closest('.card').querySelector('.dim').textContent=g.userData.dimensions.map((n,i)=>'XYZ'[i]+' '+Number(n.toFixed(1))).join(' × ')+' mm';}).catch(()=>{});
}});
async function api(action,body={}){
  const r=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json','X-PRC-Token':document.querySelector('[name=prc-token]').content},body:JSON.stringify({action,...body})});
  const value=await r.json();if(!r.ok)throw Error(value.error);return value;
}
function note(msg){$('notice').textContent=msg;}
async function refresh(force=false){const next=await api('state'),sig=JSON.stringify(next);if(force||signature!==sig){state=next;signature=sig;draw();}}
function draw(){
  const serial=++drawId,w=state?.workspace;
  $('create').disabled=!w;$('new-collection').disabled=!w;
  if(collection&&!w?.collections.some(c=>c.id===collection))collection='';
  const c=criteria(),attrs=[...new Set(Object.values(w?.details||{}).flatMap(d=>Object.keys(d.parameters||{})))].sort();
  $('attribute').innerHTML='<option value="">Any project parameter</option>'+attrs.map(k=>'<option '+(k===c.attribute?'selected':'')+'>'+esc(k)+'</option>').join('');
  let rows=[],message='';try{rows=w?results(w,c):[];message=rows.length+' parts'+(c.query.trim()?' · '+queryTerms(c.query).join(' AND '):'');}catch(e){message=e.message;}
  $('count').textContent=message;$('layout').textContent=table?'Card view':'Table view';
  $('saved').innerHTML='<option value="">Saved searches…</option>'+(w?.searches||[]).map(r=>'<option>'+esc(r.name)+'</option>').join('');
  const tags=[...new Set((w?.tags||[]).map(t=>t.tag))].sort();
  $('side-tags').innerHTML=tags.map(t=>'<button class="badge" data-tag="'+esc(t)+'" aria-pressed="'+c.query.split('+').some(q=>q.trim()==='#'+t)+'">#'+esc(t)+'</button>').join('')||'<small>No tags assigned</small>';
  $('collections').innerHTML='<button class="collection-link '+(!collection?'active':'')+'" data-collection="">All parts</button>'+(w?.collections||[]).map(c=>'<button class="collection-link '+(collection===c.id?'active':'')+'" data-collection="'+c.id+'"><span>'+esc(c.name)+'</span><small>'+w.memberships.filter(m=>m.collection===c.id).length+'</small></button>').join('');
  const chosen=w?.collections.find(x=>x.id===collection);
  $('collection-heading').innerHTML=chosen?'<div class="row"><h2>'+esc(chosen.name)+'</h2><button class="text-button" id="edit-collection">Manage collection</button></div>':'';
  if(chosen)$('edit-collection').onclick=()=>editCollection(chosen);
  thumbnails.disconnect();$('library').className=table?'table-view':'cards';$('library').innerHTML=cards(rows,{table,geometry,metric:printMetric});
  if(page==='library'&&!part)$('library').querySelectorAll('img').forEach(el=>thumbnails.observe(el));
  disposeViewer?.();disposeViewer=null;
  const p=w?.parts.find(p=>p.id===part);if(!p)part=null;
  $('library-page').hidden=!!part||page!=='library';$('detail').hidden=!p;$('reports-page').hidden=page!=='reports'||!!p;
  $('breadcrumb').textContent=p?p.name:page==='reports'?'Print reports':'Library';
  $('nav-library').classList.toggle('active',page==='library');$('nav-reports').classList.toggle('active',page==='reports');
  if(page==='reports'&&!p)$('reports-page').innerHTML=title('PRINT FEEDBACK','Print reports')+reportCards(w?.reports||[],w);
  if(!p){$('detail').innerHTML='';return;}
  const versions=w.versions.filter(x=>x.part===part),r=versions.find(x=>x.v===v)||versions[0]||{v:0,files:{}};v=r.v;
  $('detail').innerHTML=inspect({w,p,r,tab,letter,metric:printMetric,estimateInfo,viewerTools});
  if(r.files.STL){const scene=$('scene');mountViewer(scene,geometry(part,r)).then(close=>{if(serial===drawId)disposeViewer=close;else close();}).catch(()=>{if(scene.isConnected)scene.textContent='STL preview unavailable.';});}
}
function editCollection(c){dialog(c?'Manage collection':'Create collection',input('collection-name','Collection name',c?.name||'')+(c?'<button type="button" data-task="delete-collection" data-id="'+c.id+'">Delete collection</button>':''),'Save collection',()=>api('collection',{id:c?.id,name:$('collection-name').value}));}
function editMembership(){const w=state.workspace;dialog('Collected by','<p>Select all collections this Part belongs to.</p>'+w.collections.map(c=>'<label class="check"><input type="checkbox" name="membership" value="'+c.id+'" '+(w.memberships.some(m=>m.part===part&&m.collection===c.id)?'checked':'')+'>'+esc(c.name)+'</label>').join('')+(!w.collections.length?'<p>Create a collection in the sidebar first.</p>':''),'Save memberships',()=>api('membership',{part,ids:[...document.querySelectorAll('[name=membership]:checked')].map(el=>el.value)}));}
function importPart(existing){relatedFilesForm({existing,name:existing?state.workspace.parts.find(p=>p.id===existing).name:'',api,dialog,esc,commit:async({name,files,empty})=>{part=await api(empty?'create':'import',{part:existing,name,files});v=null;tab='details';page='library';}});}
function editFiles(){const w=state.workspace,p=w.parts.find(p=>p.id===part),latest=w.versions.find(r=>r.part===part);relatedFilesForm({existing:part,name:p.name,editing:true,base:latest?.v||0,current:latest?.files||{},api,dialog,esc,commit:async({files,base})=>{v=await api('editFiles',{part,expected:base,files});}});}
function openReport(report=null){
 const reportPart=report?.part||part,version=report?.v||v,w=state.workspace,files=w.versions.find(r=>r.part===reportPart&&r.v===version)?.files;
 if(!files)throw Error('The source Part version is unavailable.');
 const f=files['3MF'],details=w.details[f?.key]||{};
 reportForm({part:reportPart,version,parameters:details.parameters||{},filaments:details.filaments||[],source:{root:state.root,name:f?.name},report,api,dialog,esc,refresh,reload:async()=>{await refresh(true);openReport(state.workspace.reports.find(r=>r.id===report.id));}});
}
function setupNavigation(){
  $('create').onclick=()=>importPart();
  $('new-collection').onclick=()=>editCollection();
  $('collections').onclick=e=>{const b=e.target.closest('[data-collection]');if(b){collection=b.dataset.collection;part=null;page='library';draw();}};
  $('nav-library').onclick=()=>{part=null;page='library';draw();};
  $('nav-reports').onclick=()=>{part=null;page='reports';draw();};
  document.querySelector('.brand').onclick=e=>{e.preventDefault();part=null;page='library';draw();};
  $('clear-filters').onclick=()=>{for(const id of ['search','role','material','days','attribute','attribute-value'])$(id).value='';$('printed').checked=false;collection='';part=null;page='library';draw();};
  $('detail').onkeydown=e=>{const tabs=[...$('detail').querySelectorAll('[data-tab]')],i=tabs.indexOf(e.target);if(i<0||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();tab=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length].dataset.tab;draw();$('tab-'+tab).focus();};
  $('reports-page').onclick=$('detail').onclick;
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
for(const id of ['search','material','role','days','printed','sort','attribute','attribute-value'])$(id).oninput=()=>{part=null;page='library';draw();};
$('side-tags').onclick=e=>{const b=e.target.closest('[data-tag]');if(!b)return;const token='#'+b.dataset.tag,terms=$('search').value.split('+').map(s=>s.trim()).filter(Boolean);$('search').value=(terms.includes(token)?terms.filter(s=>s!==token):[...terms,token]).join(' + ');draw();[...$('side-tags').children].find(x=>x.dataset.tag===b.dataset.tag)?.focus();};
$('layout').onclick=()=>{table=!table;draw();};
$('save-search').onclick=()=>{try{queryTerms(criteria().query);dialog('Save search',input('search-name','Search name'),'Save',()=>api('saveSearch',{name:$('search-name').value,criteria:criteria()}));}catch(e){note(e.message);}};
$('saved').onchange=()=>{const row=state.workspace.searches.find(r=>r.name===$('saved').value);if(!row)return;const c=JSON.parse(row.criteria);collection=c.collection||'';$('search').value=c.query;for(const k of ['role','material','days','sort','attribute'])$(k).value=c[k]||'';$('attribute-value').value=c.attributeValue||'';$('printed').checked=c.printed;draw();};
$('library').onclick=e=>{const btn=e.target.closest('[data-part]');if(btn){const inspectModel=!!e.target.closest('.visual');scrollBefore=window.scrollY;part=btn.dataset.part;v=null;tab='details';draw();window.scrollTo(0,0);$('detail').querySelector('button')?.focus();}};
$('detail').onchange=e=>{if(e.target.id==='version'){v=Number(e.target.value);draw();}};
function review(job,alternate){
  const latest=state.workspace.versions.find(x=>x.part===part).v;
  dialog('Confirm 3MF revision','<p>Part '+esc(part)+' · Working base '+version(job.base)+' · Latest '+version(latest)+'</p><p>'+ (latest!==job.base?'The Part has changed since this copy was opened. Confirm to keep the latest CAD and STL and register the selected 3MF on that combination.':'Register the saved 3MF with the current CAD and STL revisions.')+'</p>'+(alternate?'<p>'+esc(alternate)+'</p>':''),'Confirm revision',async()=>{v=await api('confirm',{id:job.id,latest,alternate});});
}
$('detail').onclick=async e=>{try{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.action==='back'){const previous=part;part=null;draw();$('library').querySelector('[data-part="'+CSS.escape(previous)+'"]')?.focus({preventScroll:true});window.scrollTo(0,scrollBefore);}
  if(b.dataset.tab){tab=b.dataset.tab;draw();}
  if(b.dataset.branch){part=b.dataset.branch;v=Number(b.dataset.base)||null;tab='history';draw();}
  if(b.dataset.collection!==undefined){collection=b.dataset.collection;part=null;page='library';draw();}
  if(b.dataset.action==='collections')editMembership();
  if(b.dataset.action==='attach')importPart(part);
  if(b.dataset.action==='edit-files')editFiles();
  if(b.dataset.action==='solidworks')dialog('SolidWorks integration','<p>The native SolidWorks connector is planned. Download the exact CAD revision from Related Objects.</p>','Close',()=>{});
  if(b.dataset.action==='derive')dialog('Create derived Part',input('derived-name','New Part name',state.workspace.parts.find(p=>p.id===part).name+' - variant'),'Create derived Part',async()=>{await api('derive',{part,v,name:$('derived-name').value});tab='history';});
  if(b.dataset.action==='repository')dialog('Related Git repository','<label>Repository URL<input id="repo-url" type="url" value="'+esc(state.workspace.repositories.find(i=>i.part===part&&i.v===v)?.repo||'')+'"></label>','Save link',()=>api('repository',{part,v,repo:$('repo-url').value.trim()}));
  if(b.dataset.action==='tags')dialog('Part tags','<label>Tags, separated by spaces<input id="edit-tags" value="'+esc(state.workspace.tags.filter(t=>t.part===part).map(t=>t.tag).join(' '))+'"></label>','Save tags',()=>api('tags',{part,tags:$('edit-tags').value}));
  if(b.dataset.version){v=Number(b.dataset.version);draw();}
  if(b.dataset.confirm)review(state.workspace.jobs.find(j=>j.id===b.dataset.confirm));
  if(b.dataset.action==='open'){await api('open',{part,v});note('Working copy opened in Bambu Studio.');await refresh();}
  if(b.dataset.action==='alternate'){
    const job=state.workspace.jobs.find(j=>j.part===part&&j.base===v);
    if(!job)throw Error('Select the base version of the working copy first.');
    const [p]=await api('pick',{kind:'model'});if(p)review(job,p);
  }
  if(b.dataset.action==='report')openReport();
  if(b.dataset.editReport)openReport(state.workspace.reports.find(r=>r.id===Number(b.dataset.editReport)));
}catch(err){note(err.message);}};
$('fields').onclick=async e=>{try{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.pick){const values=await api('pick',{kind:b.dataset.kind});if(values.length)$(b.dataset.pick).value=values.join('\n');}
  if(b.dataset.task==='delete-collection'){const c=state.workspace.collections.find(c=>c.id===b.dataset.id);dialog('Delete collection','<p>Remove '+esc(c.name)+'? Parts and registered files remain available.</p>','Delete collection',()=>api('collection',{id:c.id,remove:true}));}
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
setupNavigation();
await refresh(true);if(!state.workspace)settings();
setInterval(()=>{if(!document.hidden&&!$('dialog').open)refresh().catch(e=>note(e.message));},2000);
window.addEventListener('focus',()=>refresh().catch(e=>note(e.message)));
