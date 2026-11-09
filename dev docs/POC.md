# PrintChill — POC: SolidWorks → STL → Bambu Studio

## Inhoudsopgave

- [Doel en status](#doel-en-status)
- [Scope en aanpak](#scope-en-aanpak)
- [Beoogde flow](#beoogde-flow)
- [Exportpakket en identificatie](#exportpakket-en-identificatie)
- [Testplan](#testplan)
- [POC-R01 — Resultaat STL-header en 3MF-inspectie](#poc-r01)
- [Succescriteria en besluit](#succescriteria-en-besluit)
- [Risico’s en open vragen](#risicos-en-open-vragen)
- [Bronnen](#bronnen)

## Doel en status

Onderzoeken of een eenvoudige SolidWorks-macro de herkomst van een STL betrouwbaar kan vastleggen, en of die identificatie na handmatige import in Bambu Studio nog terug te vinden is in een opgeslagen 3MF-project.

**Status:** gedeeltelijk uitgevoerd. Op 2026-11-08 is een bestaande STL van een header-ID voorzien en is het door de gebruiker teruggeleverde Bambu Studio-3MF onderzocht; zie POC-R01. De SolidWorks-macro en de volledige CAD → STL → 3MF-proef zijn nog niet gerealiseerd of geverifieerd. Architectuur wordt pas opgesteld nadat de POC is voltooid. Dit document beschrijft een technische proef, geen goedgekeurde productfeature. Voor productimplementatie wordt eerst een use case uitgewerkt volgens [[USECASES]].

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

Onderstaande tabel beschrijft het testplan. De uitgevoerde deelcontroles staan in de resultaatregistratie; de overige controles zijn **Niet uitgevoerd**. Bewaar per testrun invoer, uitvoer, manifest, relevante metadatafragmenten en eventuele foutmeldingen.

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
| POC-R01 / 2026-11-08 | POC-T02, bytecontrole | PowerShell/.NET; SolidWorks niet gebruikt | Geslaagd | Alleen de 80-byte-header gewijzigd; overige bytes identiek; 5.920 driehoeken |
| POC-R01 / 2026-11-08 | POC-T03, bestandsinspectie | Bambu Studio 02.08.02.61 volgens 3MF-metadata | Geslaagd (deelcontrole) | Bronbestandsnaam en mesh aanwezig; header-ID afwezig. Schaal in de UI en heropenen niet onafhankelijk gecontroleerd |
| Nog niet uitgevoerd | POC-T01, POC-T04 t/m POC-T12; resterende controles POC-T02/03 | Nog te bepalen | Niet uitgevoerd | Geen volledige macroproef of onafhankelijke UI-verificatie |

Gebruik als resultaat: **Geslaagd**, **Gefaald**, **Geblokkeerd** of **Niet uitgevoerd**. Het ontbreken van de header-ID in 3MF is een geldige onderzoeksuitkomst, maar betekent dat deze identificatieroute niet is aangetoond.

## POC-R01

**Titel:** Resultaat STL-header en 3MF-inspectie

**Datum:** 2026-11-08. Deze deelproef gebruikt een bestaande STL; er is geen SolidWorks-macro gebruikt en geen CAD-bronrelatie bewezen. De gebruiker heeft het 3MF uit Bambu Studio teruggeleverd. Beide bronbestanden zijn alleen gelezen bij de inspectie.

| Controle / parameter | Waarde / waarneming | Betekenis / beperking |
| --- | --- | --- |
| STL | `NEO_key_chain_PRCL.STL` | Kopie van bestaande STL; alleen de eerste 80 bytes aangepast |
| Export-ID in STL-header | `bd87cf6f-f343-4d41-80e9-fd0518fdf1c7` | Niet aangetroffen in de uitgepakte inhoud van het 3MF |
| 3MF | `NEO_key_chain_PRCL.3mf` | Aangeleverd vanaf de desktop van de gebruiker; niet naar de repository gekopieerd |
| Applicatie | `BambuStudio-02.08.02.61` | Versie uit de projectmetadata |
| `source_file` | `NEO_key_chain_PRCL.STL` | Bronverwijzing aanwezig; naam is geen uniek revisiebewijs |
| Object- en partnaam | `NEO_key_chain_PRCL.STL` | Herkenningspunt, geen bewijs van identieke STL-bytes |
| `source_object_id` / `source_volume_id` | `0` / `0` | Indexen binnen de bron |
| `source_offset_x/y/z` | `23.135409861803055 / 23.320085763931274 / 2.7999999523162842` | Gebruikt om de ingebedde mesh terug te plaatsen voor vergelijking |
| Part-UUID | `92e4941e-b431-42ad-9d35-f5f404e42fa9` | Projectidentificatie; geen bewezen relatie met de STL-export-ID |
| Driehoeken | STL en 3MF: `5920` | Aantal komt overeen |
| Geometrievergelijking | Geen verschil bij coördinaten afgerond op drie decimalen in mm, na optellen van source-offsets | Driehoeken als multiset vergeleken, onafhankelijk van volgorde van driehoeken en hoekpunten; geen byte-identiteit of algemene tolerantiebewijsvoering |
| STL-afmetingen | Circa `46.26884 × 39.01367 × 5.60000 mm` | Meshafmetingen; eenheid geïnterpreteerd als mm |
| Oorspronkelijke STL als archiefbestand | Niet aanwezig | Geometrie staat in `3D/Objects/object_1.model` |
| Hash van de bron-STL in het 3MF | Niet gevonden | Exacte STL-revisie niet zelfstandig uit dit project bewezen |
| Printer / nozzle | `Bambu Lab X1 Carbon` / `0.4 mm` | Printcontext |
| Procesprofiel / laaghoogte | `BOL-0.20mm Standard @BBL X1C` / `0.2 mm` | Printcontext |

**Conclusie:** de bronbestandsnaam en overeenkomende geometrie ondersteunen de relatie tussen deze STL en dit 3MF. De header-ID is voor deze testrun niet behouden als terugvindbare tekst. De exacte oorspronkelijke STL-bytes en CAD-revisie zijn hiermee niet bewezen. Heropenen, behoud van supports en behoud van bronverwijzingen na opnieuw opslaan zijn nog niet onafhankelijk geverifieerd.

**Vervolgproef:** plaats een unieke export-ID in de STL-bestandsnaam en controleer `source_file` na import, heropenen en opnieuw opslaan. Dit is een te toetsen aanpak, geen vastgesteld productontwerp.

### Bestandsidentificatie van de onderzochte invoer

| Bestand | SHA-256 |
| --- | --- |
| NEO_key_chain_PRCL.STL | `BF33F4D7DAAB7F2E1BA440F6B83247B3E4CE132FFBFD63965C290668E134B082` |
| NEO_key_chain_PRCL.3mf | `31BCB31E1BFCF568ACFAC07030C64CB52E56E6E8C209FF67C704BE49C01E8DA2` |

### Volledig parameteroverzicht

De volledige extractie staat in het [doorzoekbare HTML-parameteroverzicht](NEO_key_chain_PRCL_3mf_parameters.html). Open dit bestand in een browser. Het overzicht heeft een zoekveld, vaste kolomkoppen en afzonderlijk scrollbare, inklapbare secties. De grote geometriesectie is standaard ingeklapt. Alle tabelwaarden van POC-R01 zijn behouden. De oorspronkelijke Markdown-extractie staat in [het losse parameterbestand](../NEO_key_chain_PRCL_3mf_parameters.md).

[Back to top](#inhoudsopgave)

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

- **Behoud STL-header:** in POC-R01 is de header-ID niet teruggevonden in het teruggeleverde 3MF (Bambu Studio 02.08.02.61). Dit resultaat geldt voor deze testrun; behoud bij andere flows of versies is niet vastgesteld.
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
