const $=id=>document.getElementById(id);
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
  const parts=w?.parts||[],query=$('search').value.toLowerCase();
  $('library').innerHTML=parts.filter(p=>(p.name+p.id).toLowerCase().includes(query)).map(p=>'<button data-part="'+esc(p.id)+'" aria-current="'+(p.id===part)+'"><b>'+esc(p.id)+'</b><br>'+esc(p.name)+'</button>').join('');
  const p=parts.find(p=>p.id===part);
  if(!p){$('detail').innerHTML='<h2>'+(w?'Select a Part':'Connect your workspace')+'</h2><p>'+esc(state?.startup||(w?'Import a Part or select one from the library.':'Open Settings to create or connect a local workspace.'))+'</p>';return;}
  const versions=w.versions.filter(x=>x.part===part),latest=versions[0].v;
  const selected=versions.find(x=>x.v===v)||versions[0];v=selected.v;
  const jobs=w.jobs.filter(j=>j.part===part&&(j.changed||j.missing));
  const reports=w.reports.filter(r=>r.part===part);
  $('detail').innerHTML='<small>PART '+esc(part)+'</small><h2>'+esc(p.name)+'</h2><div class="row"><label>Part version<select id="version">'+versions.map(x=>'<option value="'+x.v+'" '+(x.v===v?'selected':'')+'>'+version(x.v)+(x.v===latest?' · Latest':' · Historical')+'</option>').join('')+'</select></label>'+(selected.files['3MF']?'<button data-action="open">Open in Bambu Studio</button>':'')+'<button data-action="report">Add print report</button></div><div id="jobs">'+jobs.map(j=>'<section><b>'+ (j.missing?'Working copy unavailable':'3MF change detected')+'</b><p>Working base '+version(j.base)+' · Latest '+version(latest)+'</p><button data-confirm="'+esc(j.id)+'">Review change</button></section>').join('')+'</div><h3>Registered files</h3><ul>'+Object.entries(selected.files).map(([role,f])=>'<li><b>'+role+'</b> · Revision '+letter(f.revision)+' · <a href="/download?part='+encodeURIComponent(part)+'&v='+v+'&role='+encodeURIComponent(role)+'">'+esc(f.name)+'</a></li>').join('')+'</ul><h3>Logbook</h3><ul>'+versions.map(x=>'<li><button data-version="'+x.v+'">'+version(x.v)+'</button> '+esc(new Date(x.created).toLocaleString())+' · '+Object.entries(x.files).map(([r,f])=>r+' '+letter(f.revision)).join(' / ')+'</li>').join('')+'</ul><h3>Print reports</h3>'+reports.map(r=>'<p><button data-version="'+r.v+'">Version '+version(r.v)+'</button> '+esc(r.outcome)+' · '+esc(new Date(r.created).toLocaleDateString())+'<br>'+esc(r.note)+'</p>').join('')+(reports.length?'':'<p>No print attempts recorded.</p>')+(w.jobs.some(j=>j.part===part)?'<button data-action="alternate">Choose another 3MF…</button>':'');
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
$('search').oninput=draw;
$('library').onclick=e=>{const btn=e.target.closest('[data-part]');if(btn){part=btn.dataset.part;v=null;draw();}};
$('detail').onchange=e=>{if(e.target.id==='version'){v=Number(e.target.value);draw();}};
function review(job,alternate){
  const latest=state.workspace.versions.find(x=>x.part===part).v;
  dialog('Confirm 3MF revision','<p>Part '+esc(part)+' · Working base '+version(job.base)+' · Latest '+version(latest)+'</p><p>'+ (latest!==job.base?'The Part has changed since this copy was opened. Confirm to keep the latest CAD and STL and register the selected 3MF on that combination.':'Register the saved 3MF with the current CAD and STL revisions.')+'</p>'+(alternate?'<p>'+esc(alternate)+'</p>':''),'Confirm revision',async()=>{v=await api('confirm',{id:job.id,latest,alternate});});
}
$('detail').onclick=async e=>{try{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.version){v=Number(b.dataset.version);draw();}
  if(b.dataset.confirm)review(state.workspace.jobs.find(j=>j.id===b.dataset.confirm));
  if(b.dataset.action==='open'){await api('open',{part,v});note('Working copy opened in Bambu Studio.');await refresh();}
  if(b.dataset.action==='alternate'){
    const job=state.workspace.jobs.find(j=>j.part===part&&j.base===v);
    if(!job)throw Error('Select the base version of the working copy first.');
    const [p]=await api('pick',{kind:'model'});if(p)review(job,p);
  }
  if(b.dataset.action==='report'){
    const base=v,key='printchill:'+state.root+':'+part+':'+v;
    dialog('Print report · '+part+' / '+version(base),'<label>Outcome<select id="outcome"><option>Success</option><option>Failed</option><option>Aborted</option></select></label><label>Notes<textarea id="notes">'+esc(localStorage.getItem(key)||'')+'</textarea></label>','Save report',async()=>{await api('report',{part,v:base,outcome:$('outcome').value,note:$('notes').value});localStorage.removeItem(key);});
    $('notes').oninput=()=>localStorage.setItem(key,$('notes').value);
  }
}catch(err){note(err.message);}};
$('fields').onclick=async e=>{try{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.pick){const values=await api('pick',{kind:b.dataset.kind});if(values.length)$(b.dataset.pick).value=values.join('\n');}
  if(b.dataset.task==='backup')dialog('Create backup','<p>Registered versions and reports are included. Confirm pending working copies first if you want to include them.</p>'+input('dest','Empty backup folder')+picker('dest','folder'),'Back up',()=>api('backup',{destination:$('dest').value}));
  if(b.dataset.task==='restore')dialog('Restore backup',input('src','Backup folder containing backup.json')+picker('src','folder')+input('dest','Destination folder')+picker('dest','folder')+'<p>If the destination contains files, PRC opens the restored workspace in a new PRC-restored subfolder.</p>','Restore and open',async()=>{await api('restore',{source:$('src').value,destination:$('dest').value});part=null;});
}catch(err){$('error').textContent=err.message;}};
$('cancel').onclick=()=>$('dialog').close();
$('form').onsubmit=async e=>{e.preventDefault();$('submit').disabled=true;try{await submitAction();$('dialog').close();await refresh(true);note('Saved.');}catch(err){$('error').textContent=err.message;}finally{$('submit').disabled=false;}};
await refresh(true);if(!state.workspace)settings();
setInterval(()=>{if(!document.hidden&&!$('dialog').open)refresh().catch(e=>note(e.message));},2000);
window.addEventListener('focus',()=>refresh().catch(e=>note(e.message)));
