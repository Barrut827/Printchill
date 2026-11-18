"""Read Bambu project assignments and saved slicing estimates without changing 3MF.
No printer/AMS connection, slicing execution or geometric timing heuristic.
"""
import hashlib
import json
import math
import re
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'POC material/7382-4916 - makita blower wall mount.3mf'

def metadata(element):
    return {m.get('key'): m.get('value') for m in element.findall('./metadata')}

def number(value):
    try:
        n = float(value)
        return n if math.isfinite(n) and n >= 0 else None
    except (ValueError, TypeError):
        return None

def duration(value):
    """Numeric Bambu prediction is seconds; G-code estimates can be d/h/m/s."""
    if value is None:
        return None
    text = str(value).strip()
    if re.fullmatch(r'\d+(?:\.\d+)?', text):
        return number(text)
    if not re.fullmatch(r'(?:\d+(?:\.\d+)?\s*[dhms]\s*)+', text):
        return None
    return sum(float(n) * {'d':86400,'h':3600,'m':60,'s':1}[unit]
               for n, unit in re.findall(r'(\d+(?:\.\d+)?)\s*([dhms])', text))

def extract(source):
    with ZipFile(source) as archive:
        names = set(archive.namelist())
        settings = json.loads(archive.read('Metadata/project_settings.config'))
        model = ET.fromstring(archive.read('Metadata/model_settings.config'))
        colors, types = settings.get('filament_colour', []), settings.get('filament_type', [])
        profiles = settings.get('filament_settings_id', [])
        assigned, assignments = set(), []
        for obj in model.findall('./object'):
            info = metadata(obj)
            # Volume/part-specific extruders override the object default.
            parts = obj.findall('./part') or [obj]
            for part in parts:
                part_info = metadata(part)
                slot = part_info.get('extruder')
                if slot in (None, '0'):
                    slot = info.get('extruder')
                if slot and slot.isdigit() and int(slot) > 0:
                    assigned.add(int(slot))
                    assignments.append({'objectId':obj.get('id'), 'name':part_info.get('name',info.get('name')),
                                        'slot':int(slot)})
        painted = any(b'paint_color=' in archive.read(n) or b'mmu_segmentation=' in archive.read(n)
                      for n in names if n.endswith('.model'))
        plates = model.findall('./plate')
        plate_ids = [metadata(p).get('plater_id') for p in plates]
        stats = {}
        usage = {}
        if 'Metadata/slice_info.config' in names:
            sliced = ET.fromstring(archive.read('Metadata/slice_info.config'))
            for plate in sliced.findall('./plate'):
                info = metadata(plate)
                index = info.get('index')
                if index is None:
                    continue
                time = duration(info.get('prediction'))
                weight = number(info.get('weight'))
                filament_weights = []
                for filament in plate.findall('./filament'):
                    slot = filament.get('id', '')
                    grams, meters = number(filament.get('used_g')), number(filament.get('used_m'))
                    filament_weights.append(grams)
                    if slot.isdigit() and int(slot) > 0 and ((grams or 0) > 0 or (meters or 0) > 0):
                        entry = usage.setdefault(int(slot), {'usedGrams':0, 'usedMeters':0,
                                                            'color':filament.get('color'), 'type':filament.get('type')})
                        entry['usedGrams'] += grams or 0
                        entry['usedMeters'] += meters or 0
                if weight is None and filament_weights and all(w is not None for w in filament_weights):
                    weight = sum(filament_weights)
                stats[index] = {'seconds':time, 'weight':weight, 'timeSource':'slice_info' if time is not None else None,
                                'usageKnown':bool(filament_weights) and all(w is not None for w in filament_weights)}
        # Plain-text embedded G-code fallback. No estimate from first_layer_time.
        for name in sorted(names):
            match = re.fullmatch(r'Metadata/plate_(\d+)\.gcode', name)
            if not match:
                continue
            entry = stats.setdefault(match[1], {'seconds':None,'weight':None,'timeSource':None,'usageKnown':False})
            if entry['seconds'] is not None:
                continue
            text = archive.read(name).decode('utf-8', errors='replace')
            time_match = re.search(r';[^\n]*?total estimated time:\s*([^;\r\n]+)', text)
            if time_match is None:
                time_match = re.search(r';\s*estimated printing time \(normal mode\)\s*=\s*([^\r\n]+)', text)
            if time_match:
                entry['seconds'] = duration(time_match[1])
                if entry['seconds'] is not None:
                    entry['timeSource'] = 'gcode_comment'
        # Only count expected project plates; never total a partial subset as the full project.
        timings = [stats.get(i, {}).get('seconds') for i in plate_ids]
        weights = [stats.get(i, {}).get('weight') for i in plate_ids]
        time_complete = bool(plate_ids) and all(t is not None for t in timings)
        weight_complete = bool(plate_ids) and all(w is not None for w in weights)
        seconds = sum(timings) if time_complete else None
        usage_complete = bool(plate_ids) and all(stats.get(i, {}).get('usageKnown') for i in plate_ids) and bool(usage)
        selected = set(usage) if usage_complete else assigned | set(usage)
        filaments = []
        for slot in sorted(set(range(1, max(len(colors), len(types)) + 1)) | set(usage) | assigned):
            actual = usage.get(slot, {})
            filaments.append({'slot':slot,
                              'color':actual.get('color') or (colors[slot-1] if slot <= len(colors) else None),
                              'type':actual.get('type') or (types[slot-1] if slot <= len(types) else None),
                              'profile':profiles[slot-1] if slot <= len(profiles) else None,
                              'selected':slot in selected, 'assigned':slot in assigned,
                              'usageConfirmed':slot in usage,
                              'usedGrams':actual.get('usedGrams'), 'usedMeters':actual.get('usedMeters')})
        overrides = [m.get('key') for m in model.findall('.//metadata')
                     if m.get('key') in {'layer_height','sparse_infill_density','sparse_infill_pattern'}]
        return {
            'sourceFile':source.name, 'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
            'scope':'Project settings and model assignments; all plates. Not a per-object effective settings calculation.',
            'layerHeight':settings.get('layer_height'), 'infillDensity':settings.get('sparse_infill_density'),
            'infillPattern':settings.get('sparse_infill_pattern'), 'plateCount':len(plates),
            'filaments':filaments, 'modelAssignments':assignments,
            'selectionBasis':'saved_slicing_usage' if usage_complete else 'model_assignment',
            'selectionComplete':usage_complete or (bool(assignments) and not painted),
            'paintedModels':painted,
            'totalWeight':sum(weights) if weight_complete else None,
            'printTimeSeconds':seconds,
            'printTimeSource':','.join(sorted({stats[i]['timeSource'] for i in plate_ids})) if time_complete else None,
            'timedPlateCount':sum(t is not None for t in timings),
            'timeStatus':'available' if time_complete else 'partial' if any(t is not None for t in timings) else 'needs_slicing',
            'plateStatistics':[{'plate':i, **stats.get(i, {'seconds':None,'weight':None,'timeSource':None,'usageKnown':False})} for i in plate_ids],
            'statisticsNote':'Saved slicer estimates, not measured print durations.' if time_complete else
                             'Complete saved slicing estimates are missing. Slice all plates and save/export with slicing data to obtain a time indication.',
            'overridesPresent':sorted(set(overrides)),
        }

if __name__ == '__main__':
    data = extract(SOURCE)
    output = ROOT / 'prototype/assets/makita-details.json'
    output.write_text(json.dumps(data, indent=2) + '\n')
    print(output.relative_to(ROOT))
