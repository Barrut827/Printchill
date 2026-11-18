export function timeIndication(seconds) {
 if(!Number.isFinite(seconds)||seconds<0)return null;
 if(seconds<150)return 'Less than 5 min';
 const minutes=Math.max(5,Math.round(seconds/300)*5),hours=Math.floor(minutes/60),rest=minutes%60;
 return `Approx. ${hours?hours+' h':''}${hours&&rest?' ':''}${rest?rest+' min':''}`;
}
export function detailValues(details) {
 const d=details||{},filaments=(d.filaments||[]).filter(f=>f.selected);
 return {
  material:[...new Set(filaments.map(f=>f.type).filter(Boolean))].join(' / ')||'Unknown',
  weight:d.totalWeight==null?'Unknown':`${d.totalWeight} g`,
  time:timeIndication(d.printTimeSeconds)||(details?'Slice required':'Unknown'),
  height:d.layerHeight==null?'Unknown':`${d.layerHeight} mm`,
  density:d.infillDensity||'Unknown',
  pattern:d.infillPattern||'Unknown',
  plates:d.plateCount==null?'Unknown':String(d.plateCount),
  filaments,
 };
}
