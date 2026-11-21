import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {zipSync,strToU8} from 'fflate';
export function fixtures(tmp){
 const stl=fileURLToPath(new URL('../POC material/27980400_wall_mount_rev_A.STL',import.meta.url));
 const cad=path.join(tmp,'design.step'),project=path.join(tmp,'settings.3mf');fs.writeFileSync(cad,'ISO-10303-21;\nEND-ISO-10303-21;');
 fs.writeFileSync(project,zipSync(Object.fromEntries(Object.entries({
  '3D/3dmodel.model':'<model><resources/></model>',
  'Metadata/project_settings.config':JSON.stringify({printer_model:'Fixture printer',filament_type:['PLA'],support_top_z_distance:'0.2'}),
  'Metadata/model_settings.config':'<config><plate><metadata key="plater_id" value="1"/></plate><object><part><metadata key="extruder" value="1"/></part></object></config>',
  'Metadata/plate_1.gcode':'; total estimated time: 5m\n; filament used [g] = 3.0\n'
 }).map(([k,v])=>[k,strToU8(v)]))));return {stl,cad,project};
}
