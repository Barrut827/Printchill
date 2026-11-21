const roles=['CAD','STL','3MF'];
const fileRole=name=>({stl:'STL','3mf':'3MF',sldprt:'CAD',step:'CAD',stp:'CAD'})[name.split('.').pop().toLowerCase()];
export function relatedFilesForm({existing,base=0,current={},name='',editing=false,api,dialog,esc,commit}){
  const selection={},uploaded=new Set(),generation={};let pending=0;
  const lifecycle=new AbortController();
  const fields='<label>Part name<input id="name" required maxlength="200" value="'+esc(name)+'" '+(existing?'readonly':'')+'></label>'+
    (!existing?'<label>Start with<select id="create-mode"><option value="import">Import existing files</option><option value="empty">Empty Part</option></select></label>':'')+
    '<div id="file-slots">'+roles.map(role=>'<section class="file-slot" data-file-role="'+role+'" aria-label="'+role+' file"><div class="section-heading"><h3>'+role+'</h3><button type="button" data-add-role="'+role+'">Add file</button></div><input id="file-'+role+'" aria-label="'+role+' file selection" readonly value="'+esc(current[role]?.name||'')+'" placeholder="Drop '+role+' file here"><button type="button" class="text-button" data-clear-role="'+role+'" hidden>Undo selection</button><small id="file-status-'+role+'" role="status"></small></section>').join('')+'</div>';
  dialog(editing?'Edit related objects':existing?'Register first files':'Create new part',fields,editing?'Save new version':existing?'Register version 001':'Create part',async()=>{
    if(pending)throw Error('Wait for the files to finish uploading.');
    if(!Object.keys(selection).length&&document.getElementById('create-mode')?.value!=='empty')throw Error('Add at least one file.');
    await commit({name:document.getElementById('name').value,files:selection,empty:document.getElementById('create-mode')?.value==='empty',base});
  });
  const root=document.getElementById('file-slots'),modal=document.getElementById('dialog'),$=id=>document.getElementById(id);
  const active=()=>!lifecycle.signal.aborted&&root.isConnected&&modal.open;
  function busy(){if(active())$('submit').disabled=pending>0;}
  function display(role,text){if(active())$('file-status-'+role).textContent=text;}
  function chosen(role,file){
    if(selection[role]?.upload)api('discardUploads',{ids:[selection[role].upload]}).catch(()=>{});
    selection[role]=file;$('file-'+role).value=file.name;root.querySelector('[data-clear-role="'+role+'"]').hidden=false;
    display(role,'');
  }
  async function dropped(role,file){
    if(!active())return;
    if(!file||fileRole(file.name)!==role){display(role,'Choose a matching '+role+' file.');return;}
    if(file.size>256*1024*1024){display(role,'Maximum file size is 256 MB.');return;}
    const serial=generation[role]=(generation[role]||0)+1;pending++;busy();display(role,'Adding '+file.name+'…');
    try{
      const response=await fetch('/upload?role='+role+'&name='+encodeURIComponent(file.name),{method:'POST',headers:{'X-PRC-Token':document.querySelector('[name=prc-token]').content},body:file,signal:lifecycle.signal});
      const result=await response.json();if(!response.ok)throw Error(result.error);
      uploaded.add(result.upload);
      if(active()&&generation[role]===serial)chosen(role,result);else await api('discardUploads',{ids:[result.upload]});
    }catch(e){if(e.name!=='AbortError')display(role,e.message);}finally{pending--;busy();}
  }
  root.onclick=async e=>{
    const add=e.target.closest('[data-add-role]'),clear=e.target.closest('[data-clear-role]');
    if(clear){const role=clear.dataset.clearRole;generation[role]=(generation[role]||0)+1;if(selection[role]?.upload)api('discardUploads',{ids:[selection[role].upload]}).catch(()=>{});delete selection[role];$('file-'+role).value=current[role]?.name||'';clear.hidden=true;display(role,'');}
    if(add){const role=add.dataset.addRole,serial=generation[role]=(generation[role]||0)+1;
      try{const [path]=await api('pick',{kind:role==='CAD'?'cad':role==='STL'?'stl':'model'});if(active()&&path&&generation[role]===serial){if(fileRole(path)!==role)throw Error('Choose a matching '+role+' file.');chosen(role,{path,name:path.split(/[\\/]/).pop()});}}catch(e){display(role,e.message);}
    }
  };
  for(const zone of root.querySelectorAll('[data-file-role]')){
    zone.ondragover=e=>{e.preventDefault();zone.classList.add('dragging');};
    zone.ondragleave=()=>zone.classList.remove('dragging');
    zone.ondrop=e=>{e.preventDefault();zone.classList.remove('dragging');if(e.dataTransfer.files.length!==1){display(zone.dataset.fileRole,'Drop one file in each field.');return;}dropped(zone.dataset.fileRole,e.dataTransfer.files[0]);};
  }
  // A drop elsewhere in the modal must not navigate the browser away from PRC.
  modal.addEventListener('dragover',e=>e.preventDefault(),{signal:lifecycle.signal});
  modal.addEventListener('drop',e=>e.preventDefault(),{signal:lifecycle.signal});
  if($('create-mode'))$('create-mode').onchange=()=>{root.hidden=$('create-mode').value==='empty';};
  modal.addEventListener('close',()=>{lifecycle.abort();if(uploaded.size)api('discardUploads',{ids:[...uploaded]}).catch(()=>{});},{once:true});
}
