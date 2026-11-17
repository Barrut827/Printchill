# Printchill prototype v4

Klikbare engineeringdemo met de actuele POC-samples. Engelse UI; geen productie-PDM.

## Openen

Download [Printchill-demo.html](Printchill-demo.html), sla op en open in Chrome of Edge. Alle previews en samplemetadata zijn inbegrepen; geen webserver nodig. Voor ontwikkelen: Node 20.19+ / 22.12+, `npm ci` en `npm run dev` vanuit deze map.

## Wat is toegevoegd?

- **36 samplegroepen / 67 bestanden:** 23 STL, 21 SolidWorks-parts, twee assemblies, twaalf 3MF-projecten en FreeCAD/ondersteunende bestanden. Bronhashes en de zekerheid van relaties zijn zichtbaar.
- **Echte revisies:** light panel en clips hebben aparte A/B-STL’s; geometrycache per bestand. Filenameletters bepalen importvolgorde, niet een herstelde CAD-savehistorie.
- **Components:** object-/volumerecords, platen, filament en lokale bronkandidaten voor 3MF. Jeep-chassis heeft 99 records. Native assemblies blijven structure unavailable zolang geen echte child-extractie is geïmporteerd.
- **Tabel:** raster/tabel, sorteerbare kolommen, kolomkeuze, zoeksyntax, filters, opgeslagen queries en batchtags.
- **Compare:** vaste bestandsrevisies en 3MF-parameters naast elkaar, plus echte aangeleverde STL-previews. Geen berekende mesh-afwijkingen.
- **Compacte inspectie:** Part Details links; geselecteerde bestanden en preview rechts. De eerste gegevens staan op een gewone laptop binnen het zichtbare scherm.
- **Lokaal bewaren:** IndexedDB bewaart Part versions, reports, bijlagen, geïmporteerde STL’s en concepts. Sluiten/herladen wist een reportdraft niet. Opslagstatus en schrijffouten zijn zichtbaar; JSON-backup export/import is beschikbaar.
- **Lifecycle:** bestaande design-/maturity-mapping. Released vraagt bevestiging; Obsolete/End of life is read-only en biedt kopiëren naar nieuw Part number. Geen versieverhoging door lifecycle, reports of attachments.
- **Toegankelijkheid:** donkerdere tekst, grotere selectiedoelen, toetsenbordtabs, benoemde dialogs en tooltips bij hover/focus, Escape sluit tooltip zonder focusverlies. Mobiel heeft zichtbare viewerknoplabels.
- **Snel werken:** `/` zoekt, `?` toont help; deelbare versiehash. Pijltjes draaien de modelpreview; +/− zoomen.

## Assemblies

De huidige Linux-cloud kon de childstructuur van `buitenlamp.SLDASM` en `WCD_cover_zolder.SLDASM` niet betrouwbaar uitlezen. Een 3MF-componentlijst is geen vervanging daarvoor.

`../macros/ExportAssemblyStructure.bas` is de nieuwe read-only SolidWorks 2026-proef. Nog niet op Windows uitgevoerd/gecompileerd. Zie [macro-instructies](../macros/README.md). De JSON-import controleert schema en de bronbestandsnaam, behoudt configuratie/suppression/diepte en markeert het ontbreken van byte-level bronverificatie.

## Gegevensgrenzen

- Een nummer/revisie uit een bestandsnaam is niet automatisch een CAD-property. SMP-ID’s zijn lokaal toegekend.
- Filename-relaties en de expliciete WTW-/armatuur-naamgroeperingen blijven kandidaten. Geen native assembly of CAD-exportrelatie verzonnen.
- Het gelijknamige wall_mount-3MF verwijst naar lampcomponenten maar niet naar de wall_mount-STL; dit wordt in de UI gemeld. `velg_band_fusee.3mf` bevat alleen de verklaarde Band-bron.
- Alle twaalf 3MF’s missen complete timingdata. Geen fictieve indicatie uit lengte/snelheid of eerste-laagtijd. Projectdefaults zijn geen volledig opgeloste objectinstellingen.
- Een gesimuleerde wijziging maakt een nieuw Part-versionnummer en verhoogt gekozen fileletters; bron-CAD wordt niet bewerkt en er is geen echt nieuwe STL. De preview vermeldt dat.
- Lokale browseropslag kan door quota, privémodus of wissen van browserdata verdwijnen. Exporteer backups. Geen accounts, cloudsync, ACL’s, CAD-/slicerconnector of daadwerkelijke slicing.
- 3MF-plaatbeelden zijn opgeslagen projectpreviews; native CAD-assemblygeometrie is niet ontsloten. Snapshots blijven latere baseliningfunctionaliteit.

## Reproduceren en testen

```sh
python scripts/extract_3mf_details.py
python scripts/build_sample_catalog.py
npm test
python -m unittest discover -s scripts -p '*_test.py'
npm run build
npm run build:portable
# Met Vite op poort 4173 en Python Playwright:
python smoke_test.py
# Of hetzelfde tegen de downloadbare HTML:
PROTOTYPE_URL=file:///absolute/path/Printchill-demo.html python smoke_test.py
```

Three.js, Vite en Phosphor blijven de enige runtime/build-dependencies. Nieuwe modules scheiden catalogus, opslag, manifestvalidatie, tooltips en viewer van UI-weergave.

[Sampleanalyse](../dev%20docs/SAMPLE_ANALYSIS.md) · [UI-review](../dev%20docs/UI_DESIGN_REVIEW.md) · [Verificatie](design-qa.md).
