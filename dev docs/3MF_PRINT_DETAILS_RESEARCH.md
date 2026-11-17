# 3MF — geselecteerd filament en printtijdindicatie

Onderzocht op 2026-11-16: aangeleverd Bambu-project en online Bambu Studio-broncode. De aangehaalde broncode is commit `930fe93851afbc76b1c64dd37d8728b6a9afc89c`; het voorbeeld is opgeslagen met Bambu Studio 02.08.02.61. Volledige versiecompatibiliteit is niet bewezen.

## Bevinding in het aangeleverde project

- `filament_colour`, `filament_type` en `filament_settings_id` zijn lijsten met projectfilamenten. Geen live AMS-inventaris; een AMS-synchronisatie kan zulke instellingen vullen, maar bewijst geen fysieke traybezetting.
- `Metadata/model_settings.config`: object 2 (wall mount) en object 4 (mouthpiece storage) hebben `extruder=4`. Indexering is hier één-gebaseerd.
- Geselecteerd: **projectfilament 4, Generic PLA, #DCF478**. De drie andere geconfigureerde kleuren zijn niet aan deze modellen toegewezen. Geen `paint_color` gevonden.
- `Metadata/slice_info.config` bevat uitsluitend een header. Geen ingesloten `.gcode`. Gewicht en totale tijd ontbreken.
- `Metadata/plate_2.json` bevat `first_layer_time=121.50058` seconden voor het andere model op plaat 2. Dit is geen totale tijd en geen voldoende basis voor een extrapolatie van het gehele project.

## Filamentkeuze

1. Waar aanwezig: opgeslagen slicinggebruik per plaat (`filament`, `id`, `used_g`, `used_m`, `type`, `color`). Dit is berekend verbruik, geen meting tijdens een echte print.
2. Anders: objecttoewijzing en eventuele part/volume-overrides (`extruder`). Toon die als **Selected on model**, niet als bewezen verbruik.
3. Geconfigureerde, ongebruikte slots blijven uit het hoofdscherm. Toon wel geselecteerd/geconfigureerd aantal en de herkomst van de selectie.
4. Geverfde kleuren, support-/feature-overrides, modifiers en gemengde virtuele filamenten vragen aanvullende verwerking of slicing. De proef detecteert schilderdata als onvolledig en pretendeert geen universele multicolor-decoder te zijn.

## Printtijd: bruikbare aanpak

- Lees per plaat `prediction` uit `Metadata/slice_info.config`; Bambu zet hier de voorspelde normale-mode tijd in seconden.
- Fallback bij ingesloten tekst-G-code: `total estimated time` of `estimated printing time (normal mode)`. De totale tijd heeft voorrang boven alleen modeltijd.
- Bewaar bron, ruwe seconden en plaatdekking; sommeer uitsluitend als alle projectplaten een geldige tijd hebben. Een gedeeltelijke som mag niet als volledig project worden getoond.
- UI: **Print time · indication**, afgerond op vijf minuten; bijvoorbeeld `Approx. 15 min`, `Approx. 1 h`. Dit is een slicerindicatie, geen gemeten duur. Som is voor opeenvolgende plaatprints, niet parallelle printers.
- Ontbrekende slicegegevens: **Slice required**. Slice alle platen met het bedoelde printerprofiel en exporteer/bewaar een 3MF inclusief slicingdata. Controleer of `prediction` of ingesloten tijdcommentaar aanwezig is; een gewone project-save hoeft dit niet te bevatten.
- Latere connector: gecontroleerde lokale/background slicing met passend slicer-/printerprofiel. Nog niet geïmplementeerd. De UI-proef leest vooraf geëxtraheerde data; geen nieuwe geslicete 3MF-import via de browser.

## Waarom geen filamentlengte × printsnelheid?

Voor tijd deel je lengte door een snelheid van dezelfde beweging. Filamentlengte is aangevoerd materiaal; ingestelde printsnelheid is de nozzlebeweging over het model. Die zijn niet uitwisselbaar. Benaderend geldt tijdens extrusie:

`v_filament ≈ v_nozzle × lijnbreedte × laaghoogte / (π × filamentdiameter² / 4)`

Ook deze omzetting geeft alleen extrusietijd onder sterke aannames. Travel, versnellen/remmen, laagkoeling, flowlimieten, support, opwarmen en materiaalwissels ontbreken. `materiaalvolume / maximale volumeflow` is hoogstens een theoretische ondergrens, geen nuttige totale indicatie. Het voorbeeld bevat bovendien geen totale filamentlengte.

Bambu's tijdprocessor rekent met bewegingsblokken, snelheidsplanning en aanvullende tijden. De eigen sliceruitkomst afronden is daarom een betere en eenvoudigere basis dan een nieuwe geometrische schatter bouwen.

## Bronnen

- [3MF-export: prediction/weight per geslicete plaat en filamentgebruik](https://github.com/bambulab/BambuStudio/blob/930fe93851afbc76b1c64dd37d8728b6a9afc89c/src/libslic3r/Format/bbs_3mf.cpp#L9046).
- [Platenlijst: voorspelde normale-mode tijd naar prediction](https://github.com/bambulab/BambuStudio/blob/930fe93851afbc76b1c64dd37d8728b6a9afc89c/src/slic3r/GUI/PartPlate.cpp#L7506).
- [G-code: totale/modeltijdcommentaar en filamenttotalen](https://github.com/bambulab/BambuStudio/blob/930fe93851afbc76b1c64dd37d8728b6a9afc89c/src/libslic3r/GCode/GCodeProcessor.cpp#L701).
- [Tijdprocessor: planning, versnellen/remmen en aanvullende tijden](https://github.com/bambulab/BambuStudio/blob/930fe93851afbc76b1c64dd37d8728b6a9afc89c/src/libslic3r/GCode/GCodeProcessor.cpp#L444).

## Grenzen van de proef

Python-stdlib-extractie is read-only; bronhash blijft vastgelegd. Tests gebruiken het echte ongeslicete voorbeeld plus synthetische slice-info/G-code-fixtures. Geen geslicet gebruikersbestand beschikbaar voor een onafhankelijke end-to-end-vergelijking met Bambu Studio. Binary G-code, willekeurige andere slicerformaten, effectieve objectinstellingen en automatisch opnieuw slicen zijn nog niet ondersteund.
