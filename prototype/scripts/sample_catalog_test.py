import gzip,hashlib,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
class CatalogTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.catalog=json.loads((ROOT/'prototype/assets/sample-catalog.json').read_text())
 def test_inventory_hashes_and_sizes_match_every_supplied_file(self):
  self.assertEqual(self.catalog['fileCount'],67)
  for f in self.catalog['files']:
   p=ROOT/'POC material'/f['name'];self.assertEqual(p.stat().st_size,f['size']);self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),f['sha256'])
 def test_compressed_stl_is_exact_and_revision_geometry_is_distinct(self):
  files=[f for g in self.catalog['groups'] for f in g['files'] if f['kind']=='STL']
  self.assertEqual(len(files),23)
  for f in files:
   data=gzip.decompress((ROOT/'prototype/assets/samples'/f['geometryAsset']).read_bytes());self.assertEqual(hashlib.sha256(data).hexdigest(),f['sha256'])
  panels=[f for f in files if '92223061' in f['name']];self.assertEqual({f['revision'] for f in panels},{'A','B'});self.assertEqual(len({f['sha256'] for f in panels}),2)
 def test_no_native_assembly_children_are_invented(self):
  assemblies=[f for g in self.catalog['groups'] for f in g['files'] if f['kind']=='Assembly'];self.assertEqual(len(assemblies),2)
  for f in assemblies:self.assertEqual(f['structureStatus'],'unavailable_native');self.assertNotIn('components',f)
 def test_project_links_and_partial_timing_remain_explicit(self):
  project=next(f for g in self.catalog['groups'] for f in g['files'] if f['name']=='27980400_wall_mount_rev_A.3mf')
  self.assertEqual(project['details']['plateCount'],4);self.assertEqual(len(project['components']),9)
  self.assertEqual(sum(bool(c['localFile']) for c in project['components']),9)
  for c in project['components']:self.assertIn('not independently verified',c['linkEvidence'])
  self.assertTrue(all(p['timeStatus']=='needs_slicing' for p in self.catalog['projects']))
if __name__=='__main__':unittest.main()
