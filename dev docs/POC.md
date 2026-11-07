# PrintChill — POC: SolidWorks → STL → Bambu Studio

## Inhoudsopgave

- [Doel en status](#doel-en-status)
- [Scope en aanpak](#scope-en-aanpak)
- [Beoogde flow](#beoogde-flow)
- [Exportpakket en identificatie](#exportpakket-en-identificatie)
- [Testplan](#testplan)
- [Succescriteria en besluit](#succescriteria-en-besluit)
- [Risico’s en open vragen](#risicos-en-open-vragen)
- [Bronnen](#bronnen)

## Doel en status

Onderzoeken of een eenvoudige SolidWorks-macro de herkomst van een STL betrouwbaar kan vastleggen, en of die identificatie na handmatige import in Bambu Studio nog terug te vinden is in een opgeslagen 3MF-project.

**Status:** testplan; nog niet geïmplementeerd of uitgevoerd. Een werkende macro, voorbeeldbestanden en resultaten moeten nog worden toegevoegd. Dit document beschrijft een technische proef, geen goedgekeurde productfeature. Voor productimplementatie wordt eerst een use case uitgewerkt volgens [[USECASES]].

De centrale onderzoeksvraag is:

> Kunnen we vanuit een Bambu Studio-project aantoonbaar terugvinden welke exacte STL en welke opgeslagen SolidWorks-toestand zijn gebruikt, zonder een Bambu Studio-plugin te bouwen?

## Scope en aanpak

- SolidWorks 2026 op Windows met een geldig te gebruiken installatie.
- Eén zelfstandig `.sldprt`-part met één te exporteren solid body en een expliciet vastgelegde configuratie.
- Binaire STL-export, met millimeter als afgesproken eenheid.
- Een macroknop **Export to Printchill** in de SolidWorks-toolbar.
- Handmatige STL-import in Bambu Studio en opslag als bewerkbaar `.3mf`-project.
- Voor de eerste proef een lokale exportmap; geen Printchill-server of database vereist.
- Noteer de exacte SolidWorks-versie inclusief servicepack en de Bambu Studio-versie bij iedere testrun.

Assemblies, externe CAD-referenties, multibody-export, automatische printeraansturing en automatische overdracht van supports naar gewijzigde geometrie vallen buiten deze eerste proef. Gebruik een testpart zonder externe referenties; een snapshot van alleen het part is anders onvoldoende om de volledige CAD-toestand te bewaren.

### Afweging

Een macro houdt installatie en gebruik eenvoudig. Een begeleidend JSON-bestand maakt de proef controleerbaar zonder metadatafuncties in SolidWorks of Bambu Studio te veronderstellen. De STL-header is slechts een mogelijke transportdrager voor een ID; de proef moet aantonen wat Bambu Studio ermee doet.

## Beoogde flow

```text
SolidWorks-part (.sldprt)
    ↓ klik op toolbar: Export to Printchill
Opslaan en opgeslagen CAD-toestand vastleggen
    ↓
Binaire STL exporteren en unieke export-ID in header plaatsen
    ↓
Exportpakket bewaren: CAD-snapshot + STL + manifest
    ↓ handmatig importeren
Bambu Studio: oriëntatie / supports / printinstellingen aanpassen
    ↓ opslaan als project
3MF-project inspecteren op herkomst en instellingen
    ↓
Relatie automatisch aantoonbaar, handmatig bevestigd of onbekend
```

### Stap 1 — CAD-part voorbereiden

1. Open een eenvoudig testpart, bijvoorbeeld `lego_poppetje.sldprt`.
2. Kies de te exporteren configuratie en controleer dat het model correct is opgebouwd.
3. Gebruik voor herkenbaarheid bijvoorbeeld CAD-revisie C als testlabel. Dit label wordt voor de proef expliciet opgegeven; de macro mag geen revisie afleiden uit alleen de bestandsnaam.

### Stap 2 — Macroknop uitvoeren

De macro moet achtereenvolgens:

1. Controleren dat het actieve document een ondersteund part is en de gekozen configuratie vastleggen.
2. Het part opslaan. Bij een nieuw document eerst een opslaglocatie laten kiezen. Stoppen bij annuleren, opslagfouten of blokkerende rebuildfouten.
3. Een unieke export-ID genereren en een nieuwe exportmap aanmaken; eerdere exports niet overschrijven.
4. Een kopie van het opgeslagen CAD-bestand bewaren als bron-snapshot en de SHA-256 daarvan berekenen. De export moet uit diezelfde opgeslagen toestand komen; bij tussentijdse wijziging de registratie afbreken.
5. STL-exportinstellingen expliciet instellen: binair, eenheid en tessellatiekwaliteit. Eventueel gewijzigde gebruikersinstellingen na afloop herstellen, ook bij fouten.
6. De STL exporteren, fout- en waarschuwingscodes controleren en het bestand op geldigheid controleren.
7. Alleen de 80-byte-header van de binaire STL aanpassen om de export-ID op te nemen. Geen bytes invoegen of verwijderen; de driehoektelling en geometrie moeten gelijk blijven.
8. SHA-256 van de definitieve STL berekenen, dus **na** de headeraanpassing, en het manifest schrijven.
9. Pas succes melden wanneer CAD-snapshot, STL en manifest compleet zijn. Gedeeltelijke output als mislukt markeren en niet als geldige export aanbieden.

Een opgeslagen CAD-part terugdraaien na een latere exportfout is niet de bedoeling. Meld in dat geval duidelijk: CAD opgeslagen, export niet voltooid.

### Stap 3 — Handmatig importeren in Bambu Studio

1. Importeer de geëxporteerde STL via de normale interface.
2. Controleer schaal en afmetingen; STL legt de eenheid niet gestandaardiseerd vast.
3. Kies printer-, nozzle-, filament- en procesprofiel.
4. Pas oriëntatie, supports en relevante printinstellingen aan.
5. Sla het resultaat op als bewerkbaar 3MF-project, bijvoorbeeld `lego_poppetje_print_B.3mf`. Alleen G-code exporteren is onvoldoende voor deze proef.
6. Sluit het project en open het opnieuw om te controleren dat model en aanpassingen behouden zijn.

De printprojectrevisie B staat los van CAD-revisie C en STL-revisie C. De proef kent deze labels handmatig toe; automatische revisienummering is geen onderdeel van de macroproef.

### Stap 4 — 3MF inspecteren

Inspecteer een **kopie** van het 3MF-project als ZIP-archief. Bewaar het originele bestand ongewijzigd.

- Zoek in de archiefinhoud naar de export-ID: is deze werkelijk overgenomen uit de STL-header?
- Inspecteer `Metadata/model_settings.config` op onder andere `source_file`, object- en volumegegevens, indien aanwezig.
- Inspecteer `Metadata/project_settings.config`, indien aanwezig, op bewaarde instellingen.
- Onderzoek of bronbestandsnaam, pad of objectnaam naar de juiste export verwijst en of deze verwijzing opnieuw opslaan overleeft.
- Noteer apart of geometrie is ingebed en of het oorspronkelijke STL-bestand zelf wordt bewaard. Gelijke geometrie is geen bewijs dat de oorspronkelijke STL-bytes behouden zijn.
- Leg de gebruikte CAD- en STL-export vast bij de 3MF-snapshot. Geef aan of de relatie rechtstreeks is waargenomen, door gecontroleerde overdracht is vastgelegd of handmatig is bevestigd.

Een bestandsnaam of pad is een aanwijzing, geen zelfstandig bewijs van een exacte bronrevisie. Een handmatige bevestiging mag niet als automatische herkenning worden gerapporteerd.

## Exportpakket en identificatie

Voorgestelde lokale structuur per export:

```text
exports/
└── <export-id>/
    ├── source.sldprt
    ├── lego_poppetje.stl
    └── manifest.json
```

### STL-header

Voorstel voor de eerste proef: ASCII-tekst `Printchill-ID=<UUID>`, aangevuld met nulbytes tot exact 80 bytes. Gebruik geen `solid` als begin van de header om verwarring met ASCII-STL te vermijden.

De ID identificeert de **exportgebeurtenis**, niet automatisch een nieuwe inhoudelijke CAD- of STL-revisie. Twee identieke exports kunnen verschillende export-ID’s hebben.

### Manifest

| Veld | Doel |
| --- | --- |
| `schema_version` | Versie van het manifestformaat |
| `export_id` | Dezelfde unieke ID als in de STL-header |
| `exported_at_utc` | Tijdstip van de export; geen revisiebewijs |
| `solidworks_version` | Versie en servicepack voor reproduceerbaarheid |
| `cad_original_filename` | Herkenbare oorspronkelijke bestandsnaam |
| `cad_snapshot` / `cad_sha256` | Bewaarde bron en inhoudsidentificatie |
| `cad_configuration` | De geëxporteerde configuratie |
| `cad_revision_label` / `stl_revision_label` | Expliciete testlabels; onafhankelijk van elkaar |
| `stl_filename` / `stl_sha256` | Definitieve STL inclusief nieuwe header |
| `stl_geometry_payload_sha256` | Aanvullende hash van de binaire STL vanaf byte 80, om alleen headerwijzigingen te onderscheiden |
| `export_settings` | Binair formaat, eenheid en relevante resolutie-/exportkeuzes |

De payloadhash is geen algemene geometrische vergelijker: een andere driehoekvolgorde of tessellatie geeft een andere hash. Verschillende export-ID’s veranderen de volledige STL-hash, ook als de geometrie gelijk blijft.

Registreer voor het opgeslagen printproject apart: projectrevisielabel, Bambu Studio-versie, 3MF-snapshot, SHA-256, betrokken export-ID’s, configuratie/profielinformatie en bewijs voor de bronrelaties. Voeg bij meerdere gebruikte modellen één relatie per betrokken export toe.

## Testplan

Alle onderstaande tests hebben de status **Niet uitgevoerd**. Bewaar per testrun invoer, uitvoer, manifest, relevante metadatafragmenten en eventuele foutmeldingen.

| ID | Handeling | Te controleren resultaat |
| --- | --- | --- |
| POC-T01 | Part opslaan en via macro exporteren | CAD-snapshot, STL en manifest zijn compleet; ID’s en hashes stemmen overeen |
| POC-T02 | STL vóór en na headeraanpassing vergelijken | Alleen de eerste 80 bytes verschillen; afmetingen, driehoeken en geldigheid blijven gelijk |
| POC-T03 | STL handmatig in Bambu importeren en als 3MF opslaan | Correcte afmetingen; aanwezigheid of afwezigheid van header-ID en bronverwijzingen is vastgelegd |
| POC-T04 | Oriëntatie, supports en instellingen aanpassen; sluiten en heropenen | Aanpassingen blijven behouden; opnieuw onderzoeken welke herkomstgegevens blijven bestaan |
| POC-T05 | Dezelfde CAD-toestand nogmaals exporteren | Nieuwe export-ID; geen overschrijving. Verschillen in volledige hash en payloadhash worden verklaard |
| POC-T06 | CAD-geometrie wijzigen en opnieuw exporteren | Nieuwe bron-snapshot en export; het bestaande 3MF blijft gekoppeld aan de oude export |
| POC-T07 | Twee verschillende STL’s met dezelfde bestandsnaam uit verschillende mappen gebruiken | Onderzoeken of Bambu ze nog onderscheidt; geen automatische revisietoekenning op naam alleen |
| POC-T08 | STL kopiëren/hernoemen vóór import; ook de bron na import verplaatsen | Onderzoeken welke koppelingen behouden blijven en of het 3MF zelfstandig heropent |
| POC-T09 | Opslag annuleren, read-only doel of exportfout simuleren | Geen succesmelding of compleet verklaard pakket; bestaande exports blijven intact |
| POC-T10 | Meerdere geëxporteerde onderdelen in één 3MF plaatsen | Per onderdeel herkomst onderzoeken; geen aanname dat één 3MF maar één STL gebruikt |
| POC-T11 | Alleen printinstellingen wijzigen en een nieuwe 3MF-revisie bewaren | Dezelfde STL-bron kan gekoppeld blijven; 3MF heeft een eigen snapshot en revisielabel |
| POC-T12 | STL-inhoud wijzigen terwijl de header-ID behouden blijft | ID wordt niet blind vertrouwd: opgeslagen hash komt niet overeen; bestand is geen identieke revisie |

### Resultaatregistratie

| Testrun / datum | Test-ID | Softwareversies | Resultaat | Bewijs / beperking |
| --- | --- | --- | --- | --- |
| Nog te bepalen | Nog te bepalen | Nog te bepalen | Niet uitgevoerd | Nog geen testbestanden of werkende macro beschikbaar |

Gebruik als resultaat: **Geslaagd**, **Gefaald**, **Geblokkeerd** of **Niet uitgevoerd**. Het ontbreken van de header-ID in 3MF is een geldige onderzoeksuitkomst, maar betekent dat deze identificatieroute niet is aangetoond.

## Succescriteria en besluit

### A — CAD → STL aantoonbaar

- De toolbarflow bewaart de juiste CAD-toestand en configuratie vóór de export.
- Iedere export is herleidbaar via het manifest, de bewaarde bestanden en hun hashes.
- Toevoegen van de header-ID verandert de geometrie niet en verhindert import niet.
- Eerdere exports worden niet overschreven; foutgevallen leveren geen schijnbaar geldig exportpakket op.

### B — STL → 3MF onderzocht

- De bewerkte 3MF kan opnieuw worden geopend met de bedoelde geometrie en printaanpassingen.
- Er is bewijs of de header-ID wordt overgenomen en behouden.
- De betrouwbaarheid van andere bronverwijzingen is getest, inclusief naamconflicten en opnieuw opslaan.

### Beslispunt

| Uitkomst | Vervolg |
| --- | --- |
| Header-ID blijft aantoonbaar bruikbaar | Als herkenningshulp gebruiken; exacte bronrelaties blijven expliciet geregistreerd |
| Header-ID verdwijnt, maar een unieke exportbestandsnaam blijft behouden | Vervolgproef met export-ID in de STL-bestandsnaam; niet stilzwijgend als bewezen oplossing behandelen |
| Geen betrouwbare identificatie na handmatige import | Bronrevisies bij registratie van de 3MF expliciet laten selecteren en bevestigen |
| Later meer automatisering nodig | Een lokale connector onderzoeken die de overdracht en terugname gecontroleerd registreert |

Een geslaagde CAD → STL-proef maakt de volledige CAD → STL → 3MF-keten nog niet automatisch bewezen. De uitkomst moet per stap worden gerapporteerd.

## Risico’s en open vragen

- **Behoud STL-header:** nog niet getest; Bambu Studio kan de geometrie inlezen zonder de oorspronkelijke header te bewaren.
- **ID versus inhoud:** een behouden ID kan bij gewijzigde geometrie horen. Gebruik de ID nooit als vervanging van inhoudscontrole.
- **Eigen metadata in 3MF:** niet aannemen dat Bambu Studio onbekende velden bij opnieuw opslaan bewaart. In deze proef wijzigen we de 3MF niet.
- **Printeroptimalisaties:** een nieuwe STL kan geschilderde supports, kleuring en andere geometriegebonden instellingen ongeldig maken. Geen automatische overname claimen.
- **Profielen:** een profielnaam alleen is geen reproduceerbare configuratie; bewaar project en beschikbare instellingen, plus softwareversie.
- **Meetwaarden:** STL beschrijft een getesselleerde benadering van het CAD-model. Meshafmetingen zijn niet automatisch exacte CAD-maten.
- **Opslaan en rebuild:** bepalen welke waarschuwingen blokkerend zijn en hoe de macro tussentijdse wijzigingen detecteert.
- **Revisiebeleid:** wanneer een nieuwe export een nieuwe inhoudelijke revisie is, wordt later in een use case en ontwerpbesluit vastgesteld.
- **Testomgeving:** SolidWorks en Bambu Studio moeten op een geschikte werkplek worden getest; dit document bewijst geen uitvoerbaarheid in de cloudomgeving.

## Bronnen

- [SOLIDWORKS API-support](https://www.solidworks.com/sw/support/api-support.htm) — officiële ingang voor API-documentatie en ondersteuning.
- [SolidWorks-exportvoorbeeld](https://www.codestack.net/solidworks-api/import-export/export-multi-formats/) — technisch voorbeeld van export via de API; geen validatie van onze macro.
- [Bambu Studio 3MF-broncode](https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/Format/bbs_3mf.cpp) — onder meer projectmetadata en `source_file`; interne implementatie, geen garantie voor behoud van STL-headers.
- [Bambu Studio commandline](https://github.com/bambulab/BambuStudio/wiki/Command-Line-Usage) — mogelijke latere automatisering, buiten deze handmatige proef.

[Back to top](#inhoudsopgave)
