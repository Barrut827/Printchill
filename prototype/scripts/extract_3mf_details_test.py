import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile
from extract_3mf_details import extract, SOURCE, duration

class ExtractionTest(unittest.TestCase):
    def fixture(self, slice_info='<config/>', gcode=None, painted=False):
        with ZipFile(SOURCE) as real:
            entries={n:real.read(n) for n in ('Metadata/project_settings.config','Metadata/model_settings.config')}
        entries['Metadata/slice_info.config']=slice_info
        entries.update(gcode or {})
        if painted:
            entries['3D/test.model']='<model><triangle paint_color="1"/></model>'
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'test.3mf'
            with ZipFile(path,'w') as archive:
                for name,data in entries.items():archive.writestr(name,data)
            return extract(path)

    def test_actual_project_selects_only_four_without_inventing_time(self):
        d=extract(SOURCE)
        self.assertEqual([f['slot'] for f in d['filaments'] if f['selected']],[4])
        self.assertEqual(d['filaments'][3]['profile'],'Generic PLA')
        self.assertEqual(d['selectionBasis'],'model_assignment')
        self.assertEqual(len(d['modelAssignments']),2)
        self.assertEqual(d['timeStatus'],'needs_slicing')
        self.assertIsNone(d['printTimeSeconds']) # plate_2.json first_layer_time is not total time

    def test_sliced_plate_totals_and_confirmed_usage(self):
        d=self.fixture('''<config>
          <plate><metadata key="index" value="1"/><metadata key="prediction" value="900"/>
          <metadata key="weight" value="4"/><filament id="4" type="PLA" color="#DCF478" used_g="4" used_m="1"/></plate>
          <plate><metadata key="index" value="2"/><metadata key="prediction" value="2700"/>
          <metadata key="weight" value="8"/><filament id="2" type="PETG" color="#123456" used_g="8" used_m="2"/></plate>
        </config>''')
        self.assertEqual(d['printTimeSeconds'],3600)
        self.assertEqual(d['totalWeight'],12)
        self.assertEqual(d['selectionBasis'],'saved_slicing_usage')
        self.assertEqual([f['slot'] for f in d['filaments'] if f['selected']],[2,4])
        self.assertEqual(d['filaments'][1]['type'],'PETG')
        self.assertEqual(d['filaments'][1]['usedGrams'],8)

    def test_partial_results_are_not_presented_as_full_project(self):
        d=self.fixture('<config><plate><metadata key="index" value="1"/><metadata key="prediction" value="900"/><metadata key="weight" value="4"/></plate></config>')
        self.assertEqual(d['timeStatus'],'partial')
        self.assertEqual(d['timedPlateCount'],1)
        self.assertIsNone(d['printTimeSeconds'])
        self.assertIsNone(d['totalWeight'])

    def test_gcode_total_comment_fallback_and_time_units(self):
        d=self.fixture(gcode={'Metadata/plate_1.gcode':'; model printing time: 10m; total estimated time: 15m\n',
                             'Metadata/plate_2.gcode':'; estimated printing time (normal mode) = 45m\n'})
        self.assertEqual(d['printTimeSeconds'],3600)
        self.assertEqual(d['printTimeSource'],'gcode_comment')
        self.assertIsNone(d['totalWeight'])
        self.assertEqual(duration('1h 2m 3s'),3723)
        for value in ('NaN','-1','unknown','12 min',''):
            self.assertIsNone(duration(value))

    def test_painting_without_usage_marks_selection_incomplete(self):
        d=self.fixture(painted=True)
        self.assertTrue(d['paintedModels'])
        self.assertFalse(d['selectionComplete'])

if __name__=='__main__':unittest.main()
