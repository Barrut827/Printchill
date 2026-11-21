import {hasValue,filledParameters,reportContext,parameterName,parameterValue,matchingParameters} from './report-data.js';
const oldDefaults=['layer_height','nozzle_temperature','filament_type','wall_loops','inner_wall_speed','outer_wall_speed','retraction_length','retraction_speed','initial_layer_speed'];
export function reportForm({part,version,parameters,filaments=[],source,report=null,reload,api,dialog,esc,refresh}){
  const key='prc-report:'+source.root+':'+part+':'+version+(report?':edit:'+report.id:'');
  const saved=report?JSON.parse(report.details||'{}'):{};
  if(report)parameters={...parameters,...saved.parameters};
  let draft;
  try{draft=JSON.parse(localStorage.getItem(key));}catch{}
  const context=reportContext(parameters,filaments);
  draft||=report?{...saved,id:saved.id||crypto.randomUUID(),outcome:report.outcome,note:report.note,material:report.material||'',printer:saved.printer||'',plate:saved.plate||'All project plates',images:saved.images||[],measurements:saved.measurements||[],selected:Object.keys(saved.parameters||{}),suggestions:saved.suggestions||{},parameterSelectionVersion:1,editToken:report.editToken}:{id:crypto.randomUUID(),outcome:'Success',material:context.material,printer:context.printer,plate:'All project plates',note:'',measurements:[],images:[],selected:[],suggestions:{},parameterSelectionVersion:1};
  if(!report&&!hasValue(draft.printer))draft.printer=context.printer;
  if(!report&&!hasValue(draft.material))draft.material=context.material;
  if(typeof draft.measurements==='string'){draft.legacyMeasurements=draft.measurements;draft.measurements=[];}
  draft.measurements||=[];
  draft.measurements=draft.measurements.map(m=>({...m,nominal:typeof m.nominal==='string'?m.nominal:''}));
  if(!draft.measurements.length)draft.measurements.push({id:'M1',position:'',nominal:'',value:''});
  if(!draft.parameterSelectionVersion){draft.selected=(draft.selected||[]).filter(k=>!oldDefaults.includes(k));draft.parameterSelectionVersion=1;}
  draft.selected=[...new Set(draft.selected||[])].filter(k=>hasValue(parameters[k]));draft.suggestions||={};
  let storageError='';
  let imports=Promise.resolve(),pending=0,saving=false;
  const lifecycle=new AbortController();
  function persist(){
    try{localStorage.setItem(key,JSON.stringify(draft));storageError='';}
    catch{storageError='Draft storage is full. Keep this dialog open and save the report, or remove images.';}
    document.getElementById('draft-status').textContent=storageError||'Draft saved on this PC.';
  }
  const html='<p>Part '+esc(part)+' / '+String(version).padStart(3,'0')+' · '+esc(source.name||'No registered 3MF')+'</p>'+
    '<section id="report-media" aria-labelledby="report-media-title"><h3 id="report-media-title">Photos and screenshots</h3><div id="report-paste" class="report-paste" tabindex="0" role="group" aria-label="Paste screenshots"><b>Paste screenshots · Ctrl+V</b><div class="row"><button type="button" id="report-clipboard">Paste from clipboard</button><details><summary>Add image files</summary><label>PNG, JPEG or WebP<input type="file" id="report-images" accept="image/png,image/jpeg,image/webp" multiple></label></details></div></div><p id="report-image-status" role="status" aria-live="polite"></p><p id="report-image-error" role="alert"></p><div id="report-gallery"></div></section>'+
    '<label>Outcome<select id="outcome">'+['Success','Failed','Aborted'].map(s=>'<option '+(s===draft.outcome?'selected':'')+'>'+s+'</option>').join('')+'</select></label>'+
    '<label>Printer<input id="report-printer" value="'+esc(draft.printer||'')+'"></label><label>Printed plate or scope<input id="report-plate" value="'+esc(draft.plate||'')+'"></label>'+
    '<label>Printed material<input id="report-material" value="'+esc(draft.material)+'"></label>'+
    '<section id="measurements" aria-labelledby="measurements-title"><div class="section-heading"><h3 id="measurements-title">Measurements</h3><button type="button" id="measurement-add" aria-label="Add measurement">+ Add measurement</button></div><div class="table-wrap"><table class="measurement-table"><thead><tr><th>Measurement</th><th>Measured position</th><th>Nominal value (3D model)</th><th>Measured value</th></tr></thead><tbody id="measurement-rows"></tbody></table></div>'+(draft.legacyMeasurements?'<p>Previous measurement notes: '+esc(draft.legacyMeasurements)+'</p>':'')+'</section>'+
    '<label>Notes<textarea id="notes">'+esc(draft.note)+'</textarea></label>'+
    '<details open><summary>Process parameters · project settings</summary><div id="report-params" class="table-wrap"></div><button type="button" id="param-open">+ Add parameter</button><div id="param-picker" hidden><label>Find parameter<input type="search" id="param-search" placeholder="Support Z offset"></label><select id="param-choice" aria-label="Additional parameter" size="5"></select><button type="button" id="param-add">Add</button></div></details>'+
    '<p id="draft-status" role="status"></p>'+(report?'<div id="report-edit-conflict" hidden><button type="button" id="report-reload">Reload saved report</button></div>':'');
  dialog(report?'Edit print report #'+report.id:'Print report',html,report?'Save changes':'Save report',async()=>{
    saving=true;busy();
    try{
    await imports;
    const measurements=draft.measurements.filter(m=>m.position.trim()||m.nominal.trim()||m.value.trim()).map(m=>({...m,position:m.position.trim(),nominal:m.nominal.trim(),value:m.value.trim()}));
    if(measurements.some(m=>!m.position||!m.value))throw Error('Enter a measured position and value for each measurement, or leave the entire row empty.');
    persist();
    await api(report?'editReport':'report',{part,v:version,id:report?.id,expected:draft.editToken,outcome:draft.outcome,material:draft.material,note:draft.note,details:{
      id:draft.id,printer:draft.printer,plate:draft.plate,measurements,legacyMeasurements:draft.legacyMeasurements||'',images:draft.images,
      parameters:filledParameters(Object.fromEntries(draft.selected.map(k=>[k,parameters[k]]))),suggestions:Object.fromEntries(draft.selected.map(k=>[k,draft.suggestions[k]||''])),sourceName:source.name||null
    }});
    localStorage.removeItem(key);
    await refresh(true);
    }catch(e){if(report&&e.message.includes('changed in another window'))document.getElementById('report-edit-conflict').hidden=false;throw e;}finally{saving=false;busy();}
  });
  const $=id=>document.getElementById(id);
  const media=$('report-media'),reportDialog=$('dialog');
  const active=()=>!lifecycle.signal.aborted&&reportDialog.open&&$('report-media')===media;
  reportDialog.addEventListener('keydown',e=>{
    if(!active()||e.key!=='Enter'||e.isComposing||e.target.closest('textarea,[contenteditable=true],button')||e.target.type==='file')return;
    e.preventDefault();
    if(e.target.id==='param-search'||e.target.id==='param-choice'){
      const choice=$('param-choice');
      if(!choice.value&&choice.options.length===1)choice.selectedIndex=0;
      if(choice.value){$('param-add').disabled=false;$('param-add').click();}else choice.focus();
    }
  },{capture:true,signal:lifecycle.signal});
  reportDialog.addEventListener('submit',e=>{if(active()&&e.submitter?.id!=='submit'){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,signal:lifecycle.signal});
  if(report)$('report-reload').onclick=async()=>{localStorage.removeItem(key);reportDialog.close();await reload?.();};
  function busy(){
    if(!active())return;
    $('submit').disabled=saving||pending>0;
    $('report-clipboard').disabled=pending>0;
    $('report-images').disabled=pending>0;
    $('report-image-status').textContent=pending?'Adding images…':draft.images.length+' / 8 images added';
    media.setAttribute('aria-busy',String(pending>0));
  }
  function imageError(message){if(active())$('report-image-error').textContent=message;}
  function renderMeasurements(){
    $('measurement-rows').innerHTML=draft.measurements.map((m,i)=>'<tr><td><b>'+esc(m.id)+'</b></td><td><input data-measurement="'+i+'" data-field="position" aria-label="'+esc(m.id)+' measured position" value="'+esc(m.position)+'"></td><td><input data-measurement="'+i+'" data-field="nominal" aria-label="'+esc(m.id)+' nominal value" value="'+esc(m.nominal)+'"></td><td><input data-measurement="'+i+'" data-field="value" aria-label="'+esc(m.id)+' measured value" value="'+esc(m.value)+'"></td></tr>').join('');
  }
  $('measurement-rows').oninput=e=>{const i=e.target.dataset.measurement,field=e.target.dataset.field;if(i!==undefined&&['position','nominal','value'].includes(field)){draft.measurements[Number(i)][field]=e.target.value;persist();}};
  $('measurement-add').onclick=()=>{const next=Math.max(0,...draft.measurements.map(m=>Number(m.id.slice(1))))+1;draft.measurements.push({id:'M'+next,position:'',nominal:'',value:''});renderMeasurements();persist();$('measurement-rows').lastElementChild.querySelector('input').focus();};
  function renderParams(){
    $('report-params').innerHTML=draft.selected.length?'<table class="parameter-table report-parameter-table"><thead><tr><th>Parameter</th><th>3MF value</th><th>Suggestion</th></tr></thead><tbody>'+draft.selected.map(k=>'<tr><td>'+esc(parameterName(k))+' <button type="button" class="remove-parameter" data-remove-parameter="'+esc(k)+'" aria-label="Remove '+esc(parameterName(k))+'">×</button></td><td>'+esc(parameterValue(k,parameters[k]))+'</td><td><input data-suggestion="'+esc(k)+'" aria-label="Suggestion for '+esc(parameterName(k))+'" value="'+esc(draft.suggestions[k]||'')+'"></td></tr>').join('')+'</tbody></table>':'';
    $('param-choice').innerHTML=matchingParameters(parameters,$('param-search').value).filter(k=>!draft.selected.includes(k)).map(k=>'<option value="'+esc(k)+'">'+esc(parameterName(k))+' · '+esc(parameterValue(k,parameters[k]))+'</option>').join('');
    $('param-add').disabled=!$('param-choice').value;
  }
  $('param-search').oninput=renderParams;
  $('param-choice').onchange=()=>{$('param-add').disabled=!$('param-choice').value;};
  $('param-open').onclick=()=>{$('param-picker').hidden=false;renderParams();$('param-search').focus();};
  $('param-add').onclick=()=>{const choice=$('param-choice').value;if(choice){draft.selected.push(choice);renderParams();persist();$('param-picker').hidden=true;$('report-params').querySelector('[data-suggestion="'+CSS.escape(choice)+'"]').focus();}};
  $('report-params').oninput=e=>{const key=e.target.dataset.suggestion;if(key){draft.suggestions[key]=e.target.value;persist();}};
  $('report-params').onclick=e=>{const button=e.target.closest('[data-remove-parameter]');if(button){draft.selected=draft.selected.filter(k=>k!==button.dataset.removeParameter);renderParams();persist();}};
  for(const [id,field] of [['outcome','outcome'],['report-printer','printer'],['report-plate','plate'],['report-material','material'],['notes','note']]){
    $(id).oninput=()=>{draft[field]=$(id).value;persist();};
  }
  function gallery(){
    $('report-gallery').innerHTML=draft.images.map((img,i)=>'<figure><img alt="'+esc(img.name)+'" src="'+esc(img.data)+'"><figcaption>'+esc(img.name)+' <button type="button" data-remove="'+i+'">Remove</button></figcaption></figure>').join('');
    $('report-gallery').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){draft.images.splice(Number(b.dataset.remove),1);gallery();persist();}};
    busy();
  }
  function add(load){
    pending++;busy();imageError('');
    imports=imports.then(async()=>{
      if(!active())return;
      const files=typeof load==='function'?await load():load,images=[];
      if(!files.length)throw Error('No image found on the clipboard. Copy an image or take a screenshot first.');
      if(draft.images.length+files.length>8)throw Error('Maximum eight images. Remove an image before adding another.');
      for(const file of files){
        if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose PNG, JPEG or WebP.');
        if(file.size>2000000)throw Error('This image is larger than 2 MB. Use a smaller screenshot or photo.');
        const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read this image. Try copying it again.'));reader.readAsDataURL(file);});
        images.push({name:file.name||'Screenshot '+(draft.images.length+images.length+1),data});
      }
      if(JSON.stringify({...draft,images:[...draft.images,...images]}).length>4500000)throw Error('Report image limit reached. Use smaller photos.');
      if(active()){draft.images.push(...images);gallery();persist();}
    }).catch(e=>imageError(e.message)).finally(()=>{pending--;busy();});
    return imports;
  }
  $('report-images').onchange=()=>{const input=$('report-images'),files=[...input.files];if(files.length)add(files);input.value='';};
  document.addEventListener('paste',e=>{
    if(!active())return;
    // Some clipboard providers expose image items without populating .files.
    const items=[...(e.clipboardData?.items||[])].filter(item=>item.kind==='file').map(item=>item.getAsFile()).filter(Boolean);
    const files=items.length?items:[...(e.clipboardData?.files||[])];
    if(files.length){e.preventDefault();add(files);}
    // Plain text keeps the browser's normal behavior in Notes/Measurements.
  },{capture:true,signal:lifecycle.signal});
  $('report-clipboard').onclick=()=>add(async()=>{
    if(!navigator.clipboard?.read)throw Error('Clipboard reading is unavailable here. Click in this report and press Ctrl+V.');
    let items;
    try{items=await navigator.clipboard.read();}catch{throw Error('Clipboard access was blocked. Click in this report and press Ctrl+V, or allow clipboard access in your browser.');}
    const files=[];
    for(const item of items){
      const type=['image/png','image/jpeg','image/webp'].find(type=>item.types.includes(type));
      if(type){const blob=await item.getType(type);files.push(new File([blob],'Screenshot '+(files.length+1)+'.'+type.split('/')[1],{type}));}
    }
    return files;
  });
  $('report-paste').onclick=e=>{if(!e.target.closest('button,input,summary,label'))$('report-paste').focus();};
  reportDialog.addEventListener('close',()=>lifecycle.abort(),{once:true});
  renderMeasurements();renderParams();gallery();persist();
}
