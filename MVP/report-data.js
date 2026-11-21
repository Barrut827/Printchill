export function hasValue(value){
  if(value==null)return false;
  if(typeof value==='string')return !!value.trim()&&!/^(null|undefined)$/i.test(value.trim());
  if(Array.isArray(value))return value.some(hasValue);
  if(typeof value==='object')return Object.values(value).some(hasValue);
  return true;
}
export function filledParameters(parameters){return Object.fromEntries(Object.entries(parameters||{}).filter(([,v])=>hasValue(v)));}
export function parameterText(value){
  if(!hasValue(value))return '';
  if(Array.isArray(value)){
    if(value.length===1)return parameterText(value[0]);
    const groups=new Map();
    value.forEach((v,i)=>{if(hasValue(v)){const text=parameterText(v);if(!groups.has(text))groups.set(text,[]);groups.get(text).push(i+1);}});
    return [...groups].map(([text,slots])=>{
      const contiguous=slots.length>1&&slots.at(-1)-slots[0]+1===slots.length;
      return (slots.length===1?'Slot ':'Slots ')+(contiguous?slots[0]+'–'+slots.at(-1):slots.join(', '))+': '+text;
    }).join(' · ');
  }
  if(typeof value==='object')return Object.entries(value).filter(([,v])=>hasValue(v)).map(([k,v])=>k+': '+parameterText(v)).join(' · ');
  return String(value);
}
export function reportContext(parameters={},filaments=[]){
  const text=value=>[...new Set((Array.isArray(value)?value:[value]).filter(hasValue).map(String))];
  const selected=[...new Set(filaments.map(f=>f.type).filter(hasValue))],configured=text(parameters.filament_type);
  return {printer:parameterText([parameters.printer_model,parameters.printer_settings_id,parameters.machine_model].find(hasValue)),
    material:selected.length?selected.join(' / '):configured.length===1?configured[0]:''};
}
export function parameterName(key){return ({support_top_z_distance:'Support Z offset',support_bottom_z_distance:'Bottom support Z offset',support_material_contact_distance:'Support Z offset'})[key]||key.replaceAll('_',' ');}
export function parameterValue(key,value){const text=parameterText(value);return /^(support_(top|bottom)_z_distance|support_material_contact_distance)$/.test(key)&&text&&!/mm\b/i.test(text)?text+' mm':text;}
export function matchingParameters(parameters,query){const terms=query.toLowerCase().replaceAll('_',' ').split(/\s+/).filter(Boolean);return Object.keys(filledParameters(parameters)).filter(key=>terms.every(term=>(key.replaceAll('_',' ')+' '+parameterName(key)).toLowerCase().includes(term))).sort((a,b)=>parameterName(a).localeCompare(parameterName(b)));}
export function parameterTable(parameters,esc,suggestions=null){
  const rows=Object.entries(filledParameters(parameters)).sort(([a],[b])=>a.localeCompare(b));
  return rows.length?'<table class="parameter-table"><thead><tr><th>Parameter</th><th>Value</th>'+(suggestions?'<th>Suggestion</th>':'')+'</tr></thead><tbody>'+rows.map(([k,v])=>'<tr><td>'+esc(parameterName(k))+'</td><td>'+esc(parameterValue(k,v))+'</td>'+(suggestions?'<td>'+esc(suggestions[k]||'')+'</td>':'')+'</tr>').join('')+'</tbody></table>':'';
}
export function measurementTable(details,esc){
  const rows=Array.isArray(details.measurements)?details.measurements:[];
  const legacy=typeof details.measurements==='string'?details.measurements:details.legacyMeasurements;
  return (rows.length?'<div class="table-wrap"><table class="measurement-table"><thead><tr><th>Measurement</th><th>Measured position</th><th>Nominal value (3D model)</th><th>Measured value</th></tr></thead><tbody>'+rows.map(m=>'<tr><td>'+esc(m.id)+'</td><td>'+esc(m.position)+'</td><td>'+esc(m.nominal||'')+'</td><td>'+esc(m.value)+'</td></tr>').join('')+'</tbody></table></div>':'')+(hasValue(legacy)?'<p class="legacy-measurements">'+esc(legacy)+'</p>':'')+(!rows.length&&!hasValue(legacy)?'<p>No measurements recorded.</p>':'');
}
