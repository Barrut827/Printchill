"""Read-only sample inventory. Name associations are explicit candidates, not CAD proof."""
import sys,json,re,hashlib,gzip,struct
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
from collections import Counter
from extract_3mf_details import extract,metadata
ROOT=Path(__file__).resolve().parents[2];SRC=ROOT/'POC material';OUT=ROOT/'prototype/assets/samples'
OUT.mkdir(exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def identity(name):
 stem=Path(name).stem
 m=re.search(r'[_ -]rev[_ -]([A-Z])$',stem,re.I)
 rev=m[1].upper() if m else None
 key=stem[:m.start()] if m else stem
 if key.startswith('98056723_A_'):key=key.replace('98056723_A_','98056723_',1);rev='A'
 return key.casefold(),key,rev
files=[];groups={};projects=[]
for p in sorted(SRC.iterdir(),key=lambda p:p.name.casefold()):
 if not p.is_file():continue
 suffix=p.suffix.lower();record={'name':p.name,'size':p.stat().st_size,'sha256':sha(p),'kind':{'.stl':'STL','.sldprt':'CAD','.sldasm':'Assembly','.3mf':'3MF','.fcstd':'FreeCAD'}.get(suffix,'Supporting file')};files.append(record)
 if suffix not in ('.stl','.sldprt','.sldasm','.3mf','.fcstd'):continue
 key,label,rev=identity(p.name)
 # Known name-only association is kept explicit, never represented as confirmed CAD export.
 if label=='WTW_valve':key,label='98056723_wtw_valve','98056723_WTW_valve'
 if label=='armatuur_houder_A':key,label,rev='armatuur_houder','armatuur_houder','A'
 group=groups.setdefault(key,{'key':key,'label':label,'files':[]})
 f={**record,'revision':rev or 'A','revisionBasis':'Filename revision' if rev else 'Assigned on import; source revision unknown'}
 if suffix=='.stl':
  raw=p.read_bytes();count=struct.unpack_from('<I',raw,80)[0] if len(raw)>=84 else -1
  f['mesh']={'triangles':count,'binarySizeValid':len(raw)==84+50*count,'units':'STL unitless; mm assumed by preview'}
  asset=record['sha256'][:16]+'.stl.gz';(OUT/asset).write_bytes(gzip.compress(p.read_bytes(),mtime=0));f['geometryAsset']=asset
 if suffix=='.sldasm':f['structureStatus']='unavailable_native';f['note']='Native SLDASM not decoded in this Linux environment. Use the read-only SolidWorks component export.'
 if suffix=='.fcstd':
  with ZipFile(p) as z:
   r=ET.fromstring(z.read('Document.xml'));objects={o.get('name'):o.get('type') for o in r.findall('./Objects/Object')};f['objectTypes']=objects
   f['groups']=[{'name':o.get('name'),'members':[x.get('value') for x in o.findall('./Properties/Property[@name="Group"]/LinkList/Link')]} for o in r.findall('./ObjectData/Object') if o.findall('./Properties/Property[@name="Group"]')]
   f['note']='FreeCAD saved Group links; origin/joint containers are not physical child parts.'
 if suffix=='.3mf':
  f['details']=extract(p)
  with ZipFile(p) as z:
   r=ET.fromstring(z.read('Metadata/model_settings.config'));plate_map={}
   for plate in r.findall('./plate'):
    plate_id=metadata(plate).get('plater_id');
    for inst in plate.findall('./model_instance'):plate_map.setdefault(metadata(inst).get('object_id'),[]).append(plate_id)
   components=[]
   for obj in r.findall('./object'):
    meta=metadata(obj)
    for part in obj.findall('./part'):
     pm=metadata(part);name=pm.get('name',meta.get('name','Unnamed object'));source=pm.get('source_file')
     local=[x for x in SRC.iterdir() if source and x.name.casefold()==Path(source.replace('\\','/')).name.casefold()]
     components.append({'objectId':obj.get('id'),'name':name,'sourceFile':source,'plates':plate_map.get(obj.get('id'),[]),'filamentSlot':pm.get('extruder',meta.get('extruder')),'localFile':local[0].name if len(local)==1 else None,'linkEvidence':'3MF declared source filename; content/revision not independently verified' if local else 'Embedded model; external source absent or unresolved'})
   f['components']=components
   previews=[]
   for n in sorted(z.namelist()):
    if re.fullmatch(r'Metadata/plate_\d+\.png',n):
     asset=record['sha256'][:12]+'-'+Path(n).name;(OUT/asset).write_bytes(z.read(n));previews.append({'plate':re.search(r'plate_(\d+)',n)[1],'asset':asset})
   f['platePreviews']=previews
   projects.append({'name':p.name,'plates':f['details']['plateCount'],'objects':len(components),'localSourceMatches':sum(bool(x['localFile']) for x in components),'timeStatus':f['details']['timeStatus']})
 group['files'].append(f)
# Shared filenames are not enough to prove that a project prints its namesake STL.
for group in groups.values():
 stls={f['name'] for f in group['files'] if f['kind']=='STL'}
 for f in group['files']:
  if f['kind']=='3MF':
   included=any(c['localFile'] in stls for c in f['components']) if stls else None
   f['association']={'method':'Shared filename stem; not a content proof','includesGroupStl':included}
   if included is False:
    f['details']['associationNote']='The similarly named 3MF does not declare this Part’s STL as a source. Values describe the full project, not a verified print setup for this Part.'
catalog={'schema':1,'generatedAt':'2026-11-17','counts':dict(Counter(p.suffix.lower() for p in SRC.iterdir() if p.is_file())),'fileCount':len(files),'files':files,'groups':list(groups.values()),'projects':projects,'notes':['Native SLDASM child structure not decoded. No inferred assembly tree.','Filename revision order is an import ordering, not recovered CAD save history.','All current 3MF samples lack complete saved timing; no invented estimates.']}
(ROOT/'prototype/assets/sample-catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
print(json.dumps({'files':len(files),'groups':len(groups),'projects':projects,'compressedAssetsMB':round(sum(p.stat().st_size for p in OUT.iterdir())/1e6,2)},indent=2))
