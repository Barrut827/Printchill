// Browser-only collection preview; MVP persists the equivalent relation in SQLite.
export function createCollections({samples,esc,modal,redraw,library}){
  let groups=[],members={},selected='';
  try{({groups,members}=JSON.parse(localStorage.getItem('prc-v5-collections'))||{groups:[],members:{}});}catch{}
  const save=()=>{try{localStorage.setItem('prc-v5-collections',JSON.stringify({groups,members}));}catch{}};
  const valid=name=>name.trim()&&!groups.some(c=>c.name.toLowerCase()===name.trim().toLowerCase());
  function nav(){
    const box=document.getElementById('collection-list');
    box.innerHTML='<button class="collection-link '+(!selected?'active':'')+'" data-group="">All parts</button>'+groups.map(c=>'<button class="collection-link '+(selected===c.id?'active':'')+'" data-group="'+c.id+'"><span>'+esc(c.name)+'</span><small>'+samples.filter(p=>(members[p.id]||[]).includes(c.id)).length+'</small></button>').join('');
    box.onclick=e=>{const b=e.target.closest('[data-group]');if(b){selected=b.dataset.group;library();redraw();}};
    document.getElementById('create-collection').onclick=()=>modal('Create collection','<label>Collection name<input id="new-group" required maxlength="100"></label>','Create collection',()=>{
      const name=document.getElementById('new-group').value;if(!valid(name))throw Error('Enter a unique collection name.');groups.push({id:crypto.randomUUID(),name:name.trim()});save();redraw();
    });
  }
  function details(p){
    return '<dt>Collected by:</dt><dd><span class="row">'+(groups.filter(c=>(members[p.id]||[]).includes(c.id)).map(c=>'<span class="badge">'+esc(c.name)+'</span>').join('')||'None')+' <button class="text-button" id="edit-collections">Edit collections</button></span></dd>';
  }
  function bind(p){
    document.getElementById('edit-collections').onclick=()=>modal('Collected by','<p>Select collections for this Part.</p>'+groups.map(c=>'<label class="check"><input type="checkbox" name="group" value="'+c.id+'" '+((members[p.id]||[]).includes(c.id)?'checked':'')+'>'+esc(c.name)+'</label>').join('')+(!groups.length?'<p>Create a collection in the sidebar first.</p>':''),'Save memberships',()=>{members[p.id]=[...document.querySelectorAll('[name=group]:checked')].map(el=>el.value);save();redraw();});
  }
  return {nav,details,bind,matches:p=>!selected||(members[p.id]||[]).includes(selected)};
}
