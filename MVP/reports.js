const defaults=['layer_height','nozzle_temperature','filament_type','wall_loops','inner_wall_speed','outer_wall_speed','retraction_length','retraction_speed','initial_layer_speed'];
export function reportForm({part,version,parameters,source,api,dialog,esc,refresh}){
  const key='prc-report:'+source.root+':'+part+':'+version;
  let draft;
  try{draft=JSON.parse(localStorage.getItem(key));}catch{}
  draft||={id:crypto.randomUUID(),outcome:'Success',material:'',printer:'',plate:'All project plates',note:'',measurements:'',images:[],selected:defaults};
  let storageError='';
  function persist(){
    try{localStorage.setItem(key,JSON.stringify(draft));storageError='';}
    catch{storageError='Draft storage is full. Keep this dialog open and save the report, or remove images.';}
    document.getElementById('draft-status').textContent=storageError||'Draft saved on this PC.';
  }
  const html='<p>Part '+esc(part)+' / '+String(version).padStart(3,'0')+' · '+esc(source.name||'No registered 3MF')+'</p>'+
    '<label>Outcome<select id="outcome">'+['Success','Failed','Aborted'].map(s=>'<option '+(s===draft.outcome?'selected':'')+'>'+s+'</option>').join('')+'</select></label>'+
    '<label>Printer<input id="report-printer" value="'+esc(draft.printer||'')+'"></label><label>Printed plate or scope<input id="report-plate" value="'+esc(draft.plate||'')+'"></label>'+
    '<label>Printed material<input id="report-material" value="'+esc(draft.material)+'"></label>'+
    '<label>Measurements · expected / measured / unit / deviation<textarea id="measurements">'+esc(draft.measurements)+'</textarea></label>'+
    '<label>Notes<textarea id="notes">'+esc(draft.note)+'</textarea></label>'+
    '<details open><summary>Process parameters · project settings</summary><p>Array values preserve the source profile slots. Object overrides can differ.</p><dl id="report-params"></dl><label>Find another parameter<input type="search" id="param-search"></label><select id="param-choice" aria-label="Additional parameter"></select><button type="button" id="param-add">+ Add parameter</button></details>'+
    '<label>Photos and screenshots · PNG/JPEG/WebP<input type="file" id="report-images" accept="image/png,image/jpeg,image/webp" multiple></label><p>Paste a screenshot with Ctrl+V while this report is open.</p><div id="report-gallery"></div><p id="draft-status" role="status"></p>';
  dialog('Print report',html,'Save report',async()=>{
    persist();
    await api('report',{part,v:version,outcome:draft.outcome,material:draft.material,note:draft.note,details:{
      id:draft.id,printer:draft.printer,plate:draft.plate,measurements:draft.measurements,images:draft.images,
      parameters:Object.fromEntries(draft.selected.map(k=>[k,parameters[k]??null])),sourceName:source.name||null
    }});
    localStorage.removeItem(key);
    await refresh(true);
  });
  const $=id=>document.getElementById(id);
  function renderParams(){
    $('report-params').innerHTML=draft.selected.map(k=>'<dt>'+esc(k.replaceAll('_',' '))+'</dt><dd>'+esc(JSON.stringify(parameters[k]??'Unknown'))+'</dd>').join('');
    const query=$('param-search').value.toLowerCase();
    $('param-choice').innerHTML=Object.keys(parameters).filter(k=>k.toLowerCase().includes(query)&&!draft.selected.includes(k)).sort().map(k=>'<option>'+esc(k)+'</option>').join('');
  }
  $('param-search').oninput=renderParams;
  $('param-add').onclick=()=>{const choice=$('param-choice').value;if(choice){draft.selected.push(choice);renderParams();persist();}};
  for(const [id,field] of [['outcome','outcome'],['report-printer','printer'],['report-plate','plate'],['report-material','material'],['notes','note'],['measurements','measurements']]){
    $(id).oninput=()=>{draft[field]=$(id).value;persist();};
  }
  function gallery(){
    $('report-gallery').innerHTML=draft.images.map((img,i)=>'<figure><img alt="'+esc(img.name)+'" src="'+esc(img.data)+'"><figcaption>'+esc(img.name)+' <button type="button" data-remove="'+i+'">Remove</button></figcaption></figure>').join('');
    $('report-gallery').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){draft.images.splice(Number(b.dataset.remove),1);gallery();persist();}};
  }
  async function add(files){
    try{
      for(const file of files){
        if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose PNG, JPEG or WebP.');
        if(draft.images.length>=8||file.size>2000000)throw Error('Maximum eight images, 2 MB per image.');
        const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
        if(JSON.stringify(draft).length+data.length>4500000)throw Error('Report image limit reached. Use smaller photos.');
        draft.images.push({name:file.name||'Screenshot',data});gallery();persist();
      }
    }catch(e){$('error').textContent=e.message;}
  }
  $('report-images').onchange=()=>add($('report-images').files);
  $('dialog').onpaste=e=>{const files=[...(e.clipboardData?.files||[])];if(files.length){e.preventDefault();add(files);}};
  $('dialog').addEventListener('close',()=>{$('dialog').onpaste=null;},{once:true});
  renderParams();gallery();persist();
}
