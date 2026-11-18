# Nieuwe POC-samples — analyse en samenhang

17 november 2026. Repository bijgewerkt tot `4f6d552`; 58 nieuw toegevoegde samples. Alle 67 huidige bestanden read-only geïnventariseerd, met grootte en SHA-256 in `prototype/assets/sample-catalog.json`.

## Inventaris

| Type | Aantal | Verwerking |
| --- | --- | --- |
| STL | 23 | Exacte aangeleverde meshes; gzip-assets met dezelfde bronhash na decompressie. STL is unitloos; UI neemt mm aan |
| SolidWorks Part | 21 | Bestand, naam, hash en eventuele revisieletter uit bestandsnaam; geen native CAD-geometrie of properties verondersteld |
| SolidWorks Assembly | 2 | `buitenlamp.SLDASM`, `WCD_cover_zolder.SLDASM`; native childstructuur niet betrouwbaar uitgelezen |
| 3MF | 12 | Projectsettings, object-/volumerecords, platen, verklaarde source_file, filamenttoewijzingen en opgeslagen plaatpreviews |
| FreeCAD FCStd | 2 | Document.xml, objecttypes en opgeslagen Group-verwijzingen |
| FreeCAD backup | 2 | Geïnventariseerd, niet als nieuwe CAD-revisie of assemblyboom geïnterpreteerd |
| JSON / Markdown | 4 / 1 | Bestaande POC-uitvoer en documentatie; geen nieuwe CAD-identiteit uit export-ID afgeleid |

36 samplegroepen worden als lokale Parts/projecten aangeboden. Achtcijferige of 4-4-nummers komen uit bestandsnamen, niet uit geverifieerde CAD-properties. Overige samples hebben herkenbaar lokale `SMP-…`-ID’s.

## Belangrijkste relaties

| Sample | Vastgesteld | Zekerheid / beperking |
| --- | --- | --- |
| `92223061_light_panel_rev_A/B` | Twee CAD- en twee verschillende STL-bestanden; A/B als importvolgorde 001/002 | Revisieletter uit naam, geen teruggewonnen SolidWorks-savehistorie. Beide previews gebruiken hun eigen STL |
| `65686761_armatuur_internal_clips_rev_A/B` | STL A en B, CAD alleen B | Geen fictieve CAD A. B voegt het aangeleverde CAD-bestand toe |
| `27980400_wall_mount_rev_A.3mf` | Vier platen, negen object-/volumerecords; alle verklaarde STL-namen lokaal aanwezig | Het project bevat géén verklaarde bronverwijzing naar de gelijknamige wall_mount-STL. De UI waarschuwt dat dit projectcontext is, geen bewezen printsetup voor de wall mount |
| Lamp-project, plaat 1 | Vier records voor light panel **B** | Naamgebaseerde source_file-relatie, geen byte-/exportbewijs |
| Lamp-project, plaat 2 | Twee records voor lamp pillar A | Afzonderlijke opgeslagen objectrecords; geen native BOM-quantity claim |
| Lamp-project, plaat 3 | Twee records voor light cap A | Zelfde beperking |
| Lamp-project, plaat 4 | Eén record voor internal clips B | Zelfde beperking |
| `velg_band_fusee.3mf` | Eén plaat; verklaarde bron is alleen `Band.stl` | Geen Velg of Fusee bijverzonnen op basis van de projectnaam |
| `plate_holder-Body-small.3mf` | Twee platen en twee lokaal aanwezige bron-STL’s | Verwijst ook naar Body_holes; naamassociatie, niet als native assembly gepresenteerd |
| Makita blower | Twee platen/twee objectrecords, één bron-STL lokaal | Mouthpiece-storage-bron ontbreekt; niet als compleet bronpakket gepresenteerd |
| WTW valve | Genummerde STL/3MF en `WTW_valve.SLDPRT` | CAD-groepering is een expliciete kandidaat op basis van naam; native identiteit/export niet bewezen |

## Grotere 3MF-projecten

| Project | Platen | Object-/volumerecords | Losse bronbestanden lokaal |
| --- | --- | --- | --- |
| JEEP_BAMBU_PRINT_CHASSIS | 5 | 99 | Geen naamovereenkomsten |
| JEEP_BAMBU_PRINT_GEARBOX | 3 | 36 | Geen naamovereenkomsten |
| JEEP_BODY_PARTS | 5 | 20 | Geen naamovereenkomsten |
| JEEP_interior+bumpers | 6 | 39 | Geen naamovereenkomsten |

Embedded geometrie blijft in die 3MF’s aanwezig, ook als de oorspronkelijke losse bestanden ontbreken. De UI gebruikt de opgeslagen plaatbeelden en de componentmetadata. Er wordt geen geconverteerde native CAD-assembly of complete bewerkbare Jeep-BOM geclaimd. Zoekbare componentlijsten onderscheiden object-ID, naam, plaat, filament en eventuele lokale kandidaat.

Alle twaalf 3MF’s missen complete opgeslagen tijdvoorspellingen; er is geen tekst-G-code ingesloten. De eerdere extractieregels blijven gelden: geen fictieve tijd uit filamentlengte/nominale snelheid of first_layer_time. Projectinstellingen zijn niet automatisch effectieve objectinstellingen.

## SolidWorks-assemblies

**Gedeeltelijk resultaat:** de native child-componenten van de twee SLDASM’s zijn hier nog niet bekend.

- Eerste inspectie vond geen gewone ZIP/OLE-container, leesbare componentpaden of bruikbare zlib-stream met referenties. Dit bewijst niet dat de inhoud onleesbaar is met leverancierssoftware; het rechtvaardigt alleen geen eigen childlijst.
- De Linux-cloud heeft geen SolidWorks 2026 of bruikbare Document Manager-worker. De eerdere sleutelvrije Document Manager-proef blijft afgesloten; geen nieuwe licentieclaim.
- `macros/ExportAssemblyStructure.bas` is toegevoegd als read-only Windows/SolidWorks-POC: kies een gesloten assembly, inspecteer de actieve configuratie via GetRootComponent3(False)/GetChildren en exporteer instantie, pad, referentieconfiguratie, suppressionstate en diepte.
- Geen rebuild, configuratiewissel, resolve, CAD-save of propertysetter. Lightweight/suppressed subassemblies kunnen onvolledig zijn; scope en waarschuwingen blijven vastgelegd.
- **Macro niet uitgevoerd of gecompileerd op Windows/SolidWorks.** Grootte/timestampcontrole is geen onafhankelijk bronhashbewijs. De UI accepteert het manifest alleen bij passende bronbestandsnaam en markeert de koppeling als nog niet byte-geverifieerd.
- De demo toont de assemblytab met een concrete ontbrekende-structuurmelding en kan het echte macro-JSON importeren zonder Part-versionverhoging. Een browsertest gebruikt uitsluitend een als zodanig benoemde synthetische manifestfixture; deze is geen uitgelezen native sampledata.

## FreeCAD

`assemby test.FCStd` bevat een Assembly-object met een Group-verwijzing naar Joints, maar geen opgeslagen gekoppelde fysieke child parts. Origin/assen/vlakken/Joints zijn hulponderdelen en vormen geen bewijs van een gevulde assembly. `end_caps_v2.FCStd` bevat feature-/bodystructuur; ook dat is geen SolidWorks-childboom.

## Grenzen en vervolgstap

Een bestandsnaam is geen unieke ID of bewijs van exacte geometrieherkomst. Sla bronhash, extractor en zekerheid apart op. De eerste echte vervolgstap voor native assemblies is de macro op Windows draaien en componenten/configuraties met de SolidWorks-tree vergelijken. Daarna kan dezelfde JSON-grens door een gelicentieerde Document Manager-worker worden gevuld.
