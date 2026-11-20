# PrintChill — Architectuur en begrippen

## Inhoudsopgave

- [Naamgeving](#naamgeving)
- [Datamodel voor gebruikers](#datamodel-voor-gebruikers)
- [Definities](#definities)
- [Relaties](#relaties)
- [Regels](#regels)
- [UI-uitgangspunten](#ui-uitgangspunten)
- [Open ontwerpvragen](#open-ontwerpvragen)

## Naamgeving applicatie

Samana ontleent zijn betekenis aan de gereconstrueerde Germaanse vorm *samana*, die ‘samen’ of ‘gezamenlijk’ betekent en verwant is aan het Oudnoordse *saman*. Als bedrijfsnaam staat het voor het samenbrengen van ideeën, mensen en techniek: van een eerste klantvraag naar een doordacht ontwerp en een tastbaar product. Daarmee past Samana bij 3D-printen, CAD-ontwerp en maatwerk, terwijl de naam ook ruimte biedt voor toekomstige engineeringactiviteiten. De vloeiende, internationaal klinkende naam heeft een rustigere en professionelere uitstraling dan Printchill en legt de nadruk op samenwerking en oplossingen. Samana wordt al door andere organisaties gebruikt; de geschiktheid als merknaam voor jouw activiteiten moet daarom nog worden vastgesteld.

shortlist; nog nader te bepalen wat te doen. printchill bekt lekker maar ligt te dicht bij Windchill. gaat gedoe opleveren. nieuwe naam moet kort en krachtig zijn, 1 a max 2 lettergrepen.

| Naam             | Gevonden bestaand gebruik                                      | Nabijheid tot jouw product                                      | Merkrechten Benelux/EU                                                          |
| ---------------- | -------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Staxo**        | Crypto-app en facturatiesoftware                               | Andere toepassingen, wel software                               | EU-registratie gevonden voor metalen bouwconstructies; softwaredekking **open** |
| **Staxly**       | Cloudbeveiliging en catalogus voor ontwikkelplatforms          | Andere toepassingen, wel IT-beheer                              | **Open**                                                                        |
| **Modex**        | Engineeringsoftware voor modelleren, simulatie en documentatie | **Sterke overlap**                                              | **Open**                                                                        |
| **Ordynate**     | Geen duidelijke exacte softwarematch gevonden                  | Nog onbekend; ook _Ordinate_ onderzoeken                        | **Open**                                                                        |
| **Strivo**       | BIM-modelbeheer met versies, catalogi en traceerbaarheid       | **Sterke overlap**                                              | **Open**                                                                        |
| **Tylix**        | Programmeertools en ontwikkelomgeving                          | Andere toepassing, wel software                                 | **Open**                                                                        |
| **Flurix**       | AI-platformen en bedrijfssoftware                              | Andere toepassingen, deels beheer                               | **Open**                                                                        |
| **Ankyr**        | Boekingsplatform voor muziekpodia                              | Andere toepassing, wel beheersoftware                           | **Open**                                                                        |
| **Pectra Print** | Geen exacte combinatie gevonden; **Pectra BPM** bestaat        | Verwant: processen en informatie beheren                        | Amerikaanse merkvermeldingen gevonden; EU/Benelux **open**                      |
| **Queris**       | Industriële software én document- en gegevensbeheer            | **Sterke overlap**                                              | Gebruik van ® gevonden; registratiebereik **open**                              |
| **Querix**       | Softwareontwikkelplatform en applicatiemigratie                | Gevestigde naam binnen software                                 | **Open**                                                                        |
| **Partofy**      | Geen duidelijke exacte softwarematch gevonden                  | Ook vergelijkbare namen onderzoeken                             | **Open**                                                                        |
| **Samana**       | IT-diensten en monitoringplatform SAMM                         | Andere toepassing, wel IT-beheer                                | **Open**                                                                        |
| Kipu Print       |                                                                |                                                                 |                                                                                 |
| Joynt            |                                                                | als in joint: verbind, verbinder                                | wordt al wel veel toegepast.                                                    |
| Stapler          |                                                                | als in een nietje dat de verschillende versies bij elkaar houdt |                                                                                 |
## Datamodel voor gebruikers

Conceptueel model; geen vastgesteld databaseschema of gerealiseerde applicatie. De afbeelding is de eerdere gebruikersrendering en is achterhaald voor Part versions en Print Reports; onderstaande definities zijn leidend.

![Part, documenten en versies, snapshot en Print Report](images/printchill-data-model.png)

## Definities

| Begrip                  | Definitie                                                                                                                                                                           | Voorbeeld                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Part**                | Het logische onderdeel met een vaste identiteit, onafhankelijk van bestandsnamen en versies. ‘Object’ is een technische verzamelterm; geen aparte gebruikersentiteit                | Makita blower wall mount, partnummer 7382-4916                          |
| **Document**            | Een beheerd bestand met eigen identiteit en versiehistorie. Een document kan verschillende vastgelegde versies hebben                                                               | SolidWorks-part, STL-document of 3MF-printproject                       |
| **Documentrevisie**     | Een vastgelegde, onveranderlijke toestand van één document, inclusief inhoud en bijbehorende metadata                                                                               | CAD C, STL C of 3MF G                                                   |
| **Part version**        | Onveranderlijke geregistreerde toestand van een PRC Part met exacte CAD-, STL- en 3MF-revisies. Nummer start bij 001 en telt op bij bestandswijzigingen                             | Part 7382-4916, version 003: CAD C, STL C, 3MF G                        |
| **Snapshot**            | Latere baseliningfunctionaliteit; geen extra verplichte laag voor de dagelijkse Part-workflow. Scope nog uit te werken, een snapshot kan meerdere parts bevatten.                   | S-001 bevat CAD C, STL C en 3MF G, git link, print reports, attachments |
| **Print Report**        | Verslag van één daadwerkelijke printpoging, gekoppeld aan de gebruikte Part version; bevat printer, materiaal, beschikbare instellingen, resultaat, metingen, foto's en opmerkingen | PR-001 beschrijft een print van Part version 003                        |
| **Status**              | Afzonderlijk te ontwerpen eigenschap. Voorlopige termen: `draft`, `print-candidate`, `printed`, `scrap`; niveau en overgangen zijn nog niet vastgesteld                             | Geen impliciete statusovergang door een save of snapshot                |
| **Tag**                 | Herbruikbaar zoeklabel op Parts; vergelijking op naam is hoofdletterongevoelig                                                                                                      | `#roboticarm`                                                           |
| **Collectie / project** | Navigatiegroepering uit de gebruikersworkflow; betekenis en onderlinge structuur nog te bepalen                                                                                     | Parts voor een robotarm                                                 |

Documentrevisies gebruiken letters; Part versions gebruiken minimaal drie cijfers vanaf 001. Interne IDs identificeren documenten, revisies en Part versions onafhankelijk van labels. Gedrag na 999 staat nog open.

## Relaties

| Relatie              | Van → naar                                                                                        | Omgekeerd zichtbaar als    |
| -------------------- | ------------------------------------------------------------------------------------------------- | -------------------------- |
| **Hoort bij**        | Document → Part                                                                                   | Documenten                 |
| **Heeft versie**     | Document → Versie                                                                                 | Versie van                 |
| **Geëxporteerd uit** | STL-versie → CAD-versie met configuratie, CAD revisie =  STL revisie                              | Exports                    |
| **Gebruikt**         | 3MF-versie → één of meerdere STL-/modelversies; CAD-assemblyversie → onderdeelversies waar bekend | Waar gebruikt / Where used |
| **Legt vast**        | Snapshot → specifieke documentversies en hun bronrelaties                                         | Opgenomen in snapshots     |
| **Geprint met**      | Print Report → exacte Part version                                                                | Print Reports              |
| **Bevat**            | Part version → exacte documentrevisies                                                            | Opgenomen in Part versions |
| **Ondersteunt**      | Attachment / Git-verwijzing → Part version                                                        | Attachments                |
| **Afgeleid van**     | Part → ander Part                                                                                 | Afgeleide Parts            |
| **Heeft tag**        | Part → Tag                                                                                        | Parts met deze tag         |
|                      |                                                                                                   |                            |

Een standaard CAD- of STL-document hoort bij het betreffende Part. Een 3MF-project en een snapshot kunnen meerdere Parts omvatten; de documentassociaties en bronrelaties mogen daarom niet tot één Part worden beperkt. Onderdeel-/plaatcontext blijft bewaard waar beschikbaar.

## Regels

**Workspace (MVP-voorstel).** Bij eerste start biedt PRC een lokale map aan, bijvoorbeeld `Documenten\PRC` als Documenten lokaal staat. In Settings kiest de gebruiker **Nieuwe workspace** (lege map) of **Bestaande workspace openen** (herkenbare PRC-database). PRC controleert schrijfrechten en onthoudt het pad per Windows-gebruiker, buiten de workspace. Binnen de workspace zijn alle opslagpaden relatief. Ontbreekt de map na een verhuizing, dan vraagt PRC de bestaande workspace aan te wijzen. Voor de MVP gebruiken we een lokale schijf buiten synchronisatie- en netwerkmappen.

| Onderdeel | Inhoud |
| --- | --- |
| `workspace.sqlite` | Workspace-ID, schemaversie, Parts, revisies, rapporten en werkkopies met hun basisversie |
| `objects/` | Onveranderlijke bestandsinhoud onder een interne sleutel; oorspronkelijke naam en extensie staan in de database |
| `work/<sessie-id>/` | Bewerkbare 3MF met herkenbare naam; PRC volgt het gekozen bestand en vangt vervangen van dat bestand op |
| `staging/` | Tijdelijke invoer voor controle en publicatie; bij herstart controleert PRC achtergebleven bestanden |

Een back-up gaat naar een apart gekozen bestemming buiten de workspace. De MVP-back-up omvat geregistreerde revisies en rapporten. De export meldt openstaande werkkopieën zodat de gebruiker gewenste wijzigingen eerst kan bevestigen. Herstel schrijft naar een lege workspace en controleert of alle geregistreerde bestanden aanwezig en intact zijn.

**MVP op Windows.** Eén gebruiker werkt in één lokale workspace. De web-UI vraagt de lokale backend om acties uit te voeren. Alleen de backend schrijft naar SQLite en de beheerde bestandsopslag. SQLite bewaart de versierelaties; de bestandsopslag bewaart de geregistreerde bestanden en houdt werkkopieën apart. Voor **Open in Bambu Studio** maakt de backend een bewerkbare kopie van de 3MF-revisie uit de geselecteerde Part version en opent deze in de lokaal geïnstalleerde Bambu Studio.

- Bij aanmaken krijgt een Part direct een Part number. De eerste bevestigde bestandscombinatie vormt Part version 001. Eén STL volstaat.
- Handmatige registratie bevestigt welke documentrevisies bij de Part version horen. De herkomst van een STL uit een specifieke CAD-revisie is een afzonderlijke relatie en mag onbekend zijn.
- PrintChill bewaart van elke geregistreerde documentrevisie een eigen kopie. Voor bewerking opent de engineer een werkkopie. Opslaan in Bambu Studio werkt die werkkopie bij. Pas na bevestiging van de wijziging in PrintChill ontstaat de volgende Part version.
- Vanuit een historische Part version of het bijbehorende Print Report zijn de exacte geregistreerde bestanden terug te halen, ook na verplaatsing van de bronmap en na herstel uit een back-up. De back-up omvat daarvoor zowel de bestandsinhoud als de versierelaties.

- CAD, STL en 3MF hebben onafhankelijke versiehistories. De STL-letter is gelijk aan de CAD-letter; de bronrelatie bepaalt de herkomst.
- Een snapshot verwijst naar concrete versies, nooit naar ‘latest’. Nieuwe CAD D of 3MF H verandert S-001 niet.
- Een snapshot kan ook een onbewezen of mislukte combinatie beschrijven. Een Print Report registreert de werkelijke printuitkomst. een snapshot kan ook verschillende parts bevatten.
- Meerdere Print Reports mogen dezelfde Part version gebruiken. Verschillende pogingen blijven afzonderlijk herkenbaar.
- Een Part kan beginnen met alleen een gedownloade STL. Ontbrekende CAD-herkomst wordt niet verzonnen.
- Een save, gewijzigde bytes, nieuwe documentversie en nieuwe snapshot zijn verschillende gebeurtenissen. Identificatie en inhoudscontrole blijven gescheiden van status.
- Bestandsnaam, timestamp of een gekopieerde custom property zijn op zichzelf geen bewijs van een exacte bronversie. Onzekere koppelingen moeten zichtbaar en te bevestigen zijn.
- Historische versies en snapshotrelaties worden niet stilzwijgend overschreven. Wijzigingen leiden tot nieuwe registraties.
- De v0.2-macro gebruikt `source.active_configuration` voor configuratiecontext. De bestaande JSON-`export_id` identificeert de extractie, geen Part, documentversie of snapshot.

## UI-uitgangspunten

Uit UC-006 t/m UC-009: circa 20% zijbalk met zoeken, filters, collecties en projecten; de overige ruimte toont Part-kaarten. Een kaart toont identiteit, beschikbare versie-/printcontext en tags. Hover/focus kan details tonen; dezelfde functies zijn via klik/toetsenbord bereikbaar.

De 3D-viewer toont welke STL-versie wordt bekeken, met een optionele bounding box en eenheden. Ontbrekende printgegevens blijven onbekend; tijd, materiaal en laatste print krijgen een expliciete 3MF-/Print Report-context binnen de gekozen Part version. Een Part toont zijn expliciete numerieke Part version met de daarin vastgelegde bestandsrevisies.

## Open ontwerpvragen

- Nummergeneratie voor Part numbers, grens na Part version 999, schrijfbeleid en import van bestaande CAD-revisielabels.
- Niveau en overgangen van status; oude UC-term ‘First printed’ is geen vastgesteld extra statuslabel.
- Relatie van collecties en projecten; navigatie en selectie van de standaard-Part-version.
- Betrouwbare bronherkenning en vervanging van STL-geometrie: [[ISSUES#ISS-001]].
- Bewijs en versieondersteuning voor automatische CAD-/slicerextractie; onbekende relaties niet als zeker presenteren.
- Technische opslag, connectors en deployments volgen na de POC; hier niet vastgesteld.

## Gerelateerde documentatie

[[USECASES]] · [[POC]] · [[PDM_VERSIONING_RESEARCH]] · [[SOLIDWORKS_JSON_POC]] · [[DJF]]

## HTML UI-prototype

Zie [prototype](../prototype/README.md): visuele bibliotheek, STL-viewer, onafhankelijke documentrevisies, numerieke Part versions, Logbook, versiegebonden attachments en Print Reports. Gegevens blijven in het browsergeheugen; historische versies en relaties zijn demo’s. Geen backend of CAD-/slicerconnector. Volledige UC-acceptatie blijft open.

## UI-feedback — prototype 2

- Part version 001, 002, … bevat vaste referenties naar één of meerdere CAD/STL-documenten en 3MF, elk met eigen letterrevisie. Eén bevestigde wijzigingsactie levert één Part version, ook bij meerdere gewijzigde bestanden.
- Een ongewijzigde inhoud levert geen nieuwe versie op. Detectie van werkelijke bestandswijzigingen blijft apart onderzoek; de UI-proef simuleert registratie, geen file-watcher.
- Print Reports, attachments en Git-verwijzingen verhogen de Part version niet. Ze blijven aan de gekozen historische versie gekoppeld.
- Logbook per Part number toont alle Part versions, gewijzigde bestanden en comments per bestand; geschiedenis wordt niet overschreven. Een versiebol opent de vaste bestandslijst en comments.
- Part number is prominent gelabeld. UI-basistaal is Engels; documentatie mag Nederlands blijven. Kaarten tonen uitsluitend de geselecteerde Part version en haar eigen printcontext.
- Where used: geselecteerde STL-revisie centraal, gebruikers (3MF/assemblies) erboven, concrete CAD-bron eronder, met verbindingslijnen. Onbekende herkomst blijft onbekend.
- Snapshots verdwijnen uit de dagelijkse UI en worden later als baseliningfunctie uitgewerkt (UC-010).
- Git-koppeling bewaart repository-URL en bij voorkeur commit-SHA; een veranderlijke branch/tag is geen vast softwareversiebewijs.


---

## Part Status and maturity

Een part loopt verschillende life cycles door op gebied van design, maar ook op gebied van productie.

Design state:
	- Draft
	- Abandoned
	- Released
	- Obsolete
Maturity of print:
	- Proof of concept
	- Prototype
	- Mature
	- End of life

Design state zegt ie over de status van het design van het part. de maturity zegt iets over het niveau van het part in zijn toepassing.

## Design States
### Draft
Dit is een eerst stap van een design om wat te proberen, het is nog work in progress.

### Abandoned
veel ontwerpen stranden al snel omdat het toch niet wat is geworden, je toch op andere ideeen bent gekomen. Abandoned geeft aan zoals de naam al zegt; men heeft het design gewoon verlaten. het is er nog wel maar er wordt niet meer naar om gekeken.
alleen parts vanuit draft kunnen naar deze status toe.

### Released
het design is af en is uit de trial en error fase, er staat een stabiel design.
bij released kun je niet zo maar een nieuwe wijziging doen, PRC vraagt expliciet of je het zeker weet aangezien het released is.

### Obsolete
er is wat beters bedacht, of het is niet meer nodig , overbodig geworden, you name it. het design eindigt hier. je kunt nu niets meer met het part. als je wilt wijzigen zul je nieuw part number uit moeten trekken.

## Maturity states

### Proof of concept
De eerst printjes om eens wat te proberen, pas testjes etc. het begin...

### Prototype
Een van de eerste volwaardige prints nadat je wat proof of concepts prints hebt gemaakt.
Je design en 3MF file hebben wat eerste iteraties door gemaakt in de PoC fase.

## Mature
Het design is stabiel nadat je de eerste feedback ontvangen hebt, je hebt de print parameters en settings goed onder de knie.
En het part is in grote getalen probleemloos te maken.

## End of Life
Het part wordt niet meer gebruikt om verschillende redenen, beter andere ideeen hebben het overbodig gemaakt. de vraag is er niet meer. De interfacende onderdelen bestaan niet meer of zijn niet meer te koop etc etc.
bij end of life kan het part niet meer gewijzigd worden. wil je er toch wat mee dan zul je een kopie moeten maken onder een nieuwe nummer.

## State mapping

bij het creeren van een part begin je altijd met Draft en Proof of concept

From to relaties. je kun niet terug.

| From / to -> | Draft | Abandoned | Released | Obsolete |
| ------------ | ----- | --------- | -------- | -------- |
| Draft        | -     | yes       | yes      | No       |
| Abandoned    | No    | -         | No       | No       |
| Released     | No    | No        | -        | Yes      |
| Obsolete     | No    | No        | No       | -        |

mapping design states op maturity states

|                  | Draft | Abandoned | Released | Obsolete |
| ---------------- | :---: | :-------: | :------: | :------: |
| Proof of concept |   x   |           |          |          |
| Prototype        |   x   |     x     |          |          |
| Mature           |       |           |    x     |    x     |
| End of Life      |       |           |    x     |    x     |

## Part Types

PRC part kan een mono deel zijn maar ook een samenstelling.
er zal een tab zijn binnen de part tab met "Part structure"
hierin zullen alle child componentne zichtbaar zijn die in de solidworks file zitten.
met part nummer en name, revision. vanuit deze child components kun je dan where met "where used" verticaal door de structuur navigeren.
bij een mono part is er geen structure en deze tab dus leeg.

side note: het is nu erg op solidworks ge-orienteerd, maar in de toekomst moeten ook om kunnen gaan met Fusion 360 en freeCad

## Part Details

Part Details vervangt de dubbele bestandentab. Het Part-versionpaneel blijft de bestandsselectie tonen. Details refereren alleen de gekozen 3MF-revisie: materiaal, totaalgewicht, printtijd, laaghoogte, infillpercentage/-type, filamentkleuren/-types en plaatcount. Projectpresets, objectoverrides, configuratie en werkelijk filamentverbruik zijn verschillende scopes; onbekende waarden blijven Unknown. De proef gebruikt een reproduceerbare extractie uit het aangeleverde Bambu-3MF voor demo-revisie G, zonder automatische revisieherkenning.

## Back-up Mechanism

De reportuitbreiding bewaart meetverslagen, parameterwaarden en afbeeldingen bij de geselecteerde Part version in SQLite (schema 3). Parameterwaarden worden bij bewaren vastgelegd. Reports ondersteunen acht afbeeldingen, 2 MB per upload en 5 MB voor het volledige report. Databaseback-ups bevatten deze afbeeldingen. Voor schemamigraties maakt PRC een back-up. Plaatpreviews komen uit de exacte geregistreerde 3MF.
printchill bevat een backup mechanisme. om een backup te make nvan de volledige database en de alle native files. deze moet kunnen worden geexporteerd naar een door de user aangegeven locatie. en ook weer ingelezen kunnen worden. bij het selecteren van de backup folder wordt de backup ingelezen en wordt in het backup/restore venster getoond: time date stamp gemaakt backup,naam backup , aantal parts deze bevat. grootte van backup in MB's.
### Backup restore merge conflicts
Bij het inlezen van een backup worden alle files die zowel in de huidige als in de backup staan overschreven door de backup. anders gebruik je de backup functionaliteit niet. voordat de backup restore wordt doorgezet wordt er gemeld aan de gebruiker: let op, deze part numbers bestaan in de huidige database én in de backup, door op restore te drukken worden bestaande parts in de huidige database overschreven met de content van de backup.

## Tijdnotatie in applicatie
PRC werkt met een DD/MM/YYY HH:MM (24hr clock) notatie.
## Consolidatie filament en tijdindicatie

Part Details toont geselecteerde model-/slicingfilamenten; projectconfiguratie is geen live AMS-inventaris. Tijdindicatie gebruikt complete voorspellingen per plaat, of ingesloten G-code-tijdcommentaar, afgerond op vijf minuten. Zonder complete gegevens: Slice required. Geen schatting uit filamentlengte en nominale printsnelheid. Bronnen, scope en beperkingen: [[3MF_PRINT_DETAILS_RESEARCH]].


## Prototype v4 — samples en UI-review

- Read-only samplecatalogus: 67 bestanden, hashes en expliciete naam-/metadata-associaties. Zie [[SAMPLE_ANALYSIS]]. De 36 groepen zijn importgroepen, geen automatisch bewezen CAD-identiteiten.
- Echte A/B-STL’s krijgen eigen geometry-assets; de previewcache is per bestand, niet per Part. Gesimuleerde revisies houden een zichtbaar samplelabel en geen fictieve nieuwe bronhash.
- 3MF-object-/volumerecords, plaatbeelden en filamenttoewijzingen vormen projectcompositie. Native CAD-assemblykinderen zijn een andere relatie en worden uitsluitend via expliciete extractie/manifest getoond.
- IndexedDB bewaart lokaal workspace, concepts, reports en attachments; export/import van JSON-backups maakt overdracht mogelijk. Geen serveropslag, accounts, rechtenmodel of cloudsync.
- Tabel met sortering/kolommen, versievergelijking, compacte inspectie, deelbare versiehash, toetsenbordtabs, benoemde dialogs en hover-/focustooltips verwerken [[UI_DESIGN_REVIEW]].
- Design state en maturity zijn Part-level metadata. Het bestaande mappingbeleid blijft leidend; statuswijzigingen verhogen geen Part version. Released-bestandswijzigingen vragen bevestiging; Obsolete/End of life blokkeren ze en bieden kopiëren.
- Assemblymanifestimport verrijkt een bestaande Part version met uitleesbewijs, zonder wijziging van bronbestanden. Bestandsnaammatch zonder bronhash wordt zichtbaar onbevestigd gehouden.
