# PrintChill — Design Justification File

## DJF-007 — Documentatiestructuur en connectorpad (2026-11-21)

Architecture krijgt een compacte indeling geïnspireerd op [arc42](https://arc42.org/overview/): context, structuur, runtime, deployment, begrippen, afspraken en risico's. Actuele MVP-keuzes, geplande functies en prototypehistorie zijn expliciet gescheiden; naamgevingsonderzoek blijft behouden als productnotitie. Dit voorkomt dat een prototype of oud voorstel als runtimecontract wordt gelezen. Roadmap bevat één actuele voortgangstabel en werkpakketten met afhankelijkheden en oplevercriteria; acceptatieresultaten blijven in het MVP-testplan.

SolidWorks start met mono-parts via Windows-helper + VBA; dit sluit aan op de POC en beperkt installatiecomplexiteit ten opzichte van een add-in. COM/macrostart en save/export moeten eerst op 2026 SP0 bewezen worden. PRC beheert nummers en commits, de macro alleen de werkkopie; native Save maakt geen Part version. Een basisversieproperty vermijdt circulaire wijzigingen van reeds gehashte CAD-bytes. CAD/STL-labels en herkomstbewijs krijgen vóór exportimplementatie een expliciet beleid. Details: [[SOLIDWORKS_INTEGRATION_PLAN]]. Assemblies volgen later.

Wiki-formules blijven opgeslagen LaTeX met lokale weergave. PDF begint als gedeelde printweergave met browser Save as PDF; een directe exporter vereist eerst render-/licentieafweging. De officiële [BlockNote PDF-exporter](https://www.blocknotejs.org/docs/features/export/pdf) valt onder het XL-licentiemodel; niet automatisch toevoegen aan de basiseditor. UC-022 begrenst export, UC-023 toekomstig AI-advies. Advies krijgt bronverwijzingen en schrijfrechten op geen enkele CAD-/slicerregistratie. Deze wijziging implementeert geen connector, wiki, PDF- of AI-functionaliteit.

## Geplande Part-wiki — BlockNote en SQLite FTS5

Gebruiker kiest BlockNote voor de ingebouwde wiki (UC-020). Een afgebakend React-onderdeel benut de bestaande editorbediening zonder de hele PRC-UI om te bouwen. Pagina's blijven bij het Part number; expliciete pagina-/blokverwijzingen leggen versiecontext vast zonder de tekst te bevriezen of Part versions te verhogen. Stabiele blok-ID's ondersteunen kantlijnbadges en terugverwijzingen. Eigen paginarevisies houden dit onafhankelijk van technische History.

SQLite FTS5 indexeert de actuele opgeslagen wiki-inhoud voor de bestaande linkerzoekbalk. Dit vermijdt een extra zoekdienst in de lokale Windows-stack. De index is afgeleid, transactioneel bij te werken en herbouwbaar uit de bronrevisies; afbeeldingen en volledige historie blijven onderdeel van de reguliere back-up. Implementatie, runtimeondersteuning en acceptatiegrenzen worden nog gecontroleerd. Technische details: [[Architecture#Part-wiki met BlockNote en lokale zoekindex]].

## MVP 0.3.0 — collecties en UI-overdracht

Collecties zijn een aparte many-to-many-relatie in SQLite. Dit ondersteunt meerdere verzamelingen per Part zonder bestanden te kopiëren of revisies aan te maken. Namen zijn uniek zonder hoofdletteronderscheid. Stabiele collectie-ID's houden lidmaatschappen intact bij hernoemen. Bij merge koppelen gelijke namen aan dezelfde collectie, terwijl niet vervangen Parts behouden blijven.

De v5-UI gebruikt de bestaande lokale API, metadata-extractie, viewer en reportopslag. UI-state blijft in de browser; geregistreerde gegevens blijven bij de backend. Git-verwijzingen zijn versiegebonden. Een afgeleid Part hergebruikt bestandsobjecten en bewaart een expliciete bronrelatie voor de History-grafiek. Schema 4 wordt voorafgegaan door een herstelbare back-up. Nieuwe dependencies zijn niet nodig.

## DJF-003 — Begrippen en gebruikersdatamodel

een part is de major carrier van informatie. een part heeft een uniek part number zie DJF-04. een part heeft related objects.
een part heeft z'n eigen version. uitgedrukt in een nummer 000 beginnend altijd bij 001.bij 999 is het op en moet een nieuw part gemaakt worden.
de versie van het part staat los van de revisies van de related objects.
Er zijn 2 typen: 
- Describing Objects
- Reference objects.
Describing object zijn objecten die een beschrijvende relatie hebben tot het part. deze relatie bepaald hoe het part er fysiek uit ziet en hoe het gemaakt wordt. Dit is een "dwingende relatie"

### Desribing Objects
dit zijn de volgende objecten:
- CAD file - heeft zelfde partnummer als part, revisie CAD = Revisie STL
- STL file - heeft zelfde partnummer als part , revisie STL = Revisie CAD
- 3MF file - heeft zelfde partnummer als part, eigen revisies

### Reference Objects
dit zijn;
- print reports (hebben geen revisie alleen een created date en last modified date)
- document als attachment zoals een bouw handleiding of electrisch schema etc.
- linkje naar een git repo (geen versie beheer)

## DJF-001 — Metadata-POC via SolidWorks VBA

**Scope:** [[USECASES#UC-001]], [[SOLIDWORKS_JSON_POC]]. Dit is een POC-keuze, geen definitieve productarchitectuur.

- VBA in SolidWorks Design Premium 2026 SP0, 64-bit, gebruikt de aanwezige COM-API zonder Document Manager-sleutel of extra installer.
- Eerste versie leest document- en configuratieproperties plus summaryvelden. Cut-lists en geometrie blijven expliciet buiten scope om de basisproef te isoleren.
- Read-only openen van een gesloten part voorkomt het verwarren van opgeslagen data met een bestaande, gewijzigde gebruikerssessie. Reeds geopende bronnen worden geweigerd.
- Cached propertywaarden voorkomen bewust gevraagde rebuilds en configuratieactivaties, met als nadeel mogelijk verouderde berekende waarden. Retourcodes en flags blijven daarom in de JSON.
- Scope en fouten worden expliciet bewaard; geen stilzwijgende samenvoeging van document-/configuratieproperties.
- Geen externe JSON-library: kleine writer met escaping en UTF-8 via Windows ADODB. Geen harde Office-reference; wel Windows-runtime-afhankelijkheid.
- Nieuwe JSON wordt via een tijdelijk bestand gepubliceerd zonder bestaande uitvoer te overschrijven. De bronhash wordt onafhankelijk gecontroleerd door de tester.
- De API-majorcheck bewaakt 2026; editie/SP0 worden handmatig bevestigd. Compilatie en uitvoering zijn nog niet geverifieerd.

**Alternatief later:** Document Manager voor uitlezen zonder SolidWorks-proces. Licentie en uitleesverschillen eerst toetsen; hetzelfde versieerbare JSON-contract is het uitgangspunt.

## DJF-002 — Uitgebreide read-only export, schema 0.2

De gebruiker vraagt om zoveel mogelijk uitleesbare gegevens. De macro voegt opslaggegevens, configuratiedetails/materialen, referenties, vergelijkingen en actieve feature-/bodygegevens toe zonder rebuild of configuratiewissel. Daarmee wordt de eerdere beperkte POC-scope uitgebreid. Volledige geometrie en massa worden niet berekend.

- Interne SummaryInfo-datums blijven gelokaliseerde raw strings; Windows-bestandsdatums worden apart als lokale tijden gelabeld. Geen onbewezen UTC-conversie of unieke revisiebetekenis.
- Optionele members worden met `CallByName` uitgelezen en krijgen een veldstatus. Dit beperkt compileerafhankelijkheden, maar verplaatst beschikbaarheidscontrole naar runtime; waarschuwingen blijven zichtbaar.
- Bestaande cut-lists worden alleen gelezen; geen update. Actieve bodybounds zijn benaderingen in SI-eenheden, geen exact geometriebewijs.
- Traversal heeft omvang-/dieptelimieten; brondata wordt nooit als opdrachten uitgevoerd.
- Contractversie verhoogd naar 0.2 om de scopewijziging zichtbaar te maken. Validatie in SolidWorks 2026 SP0 staat nog open.

## DJF - 003
baselining fuctionaliteit noemen we snapshots. een snapshot bevat part versions inclusief de daarbij hordende related object; STL, CAD, 3MF maar ook print reports en andere attachments. een snapshot kan een verzameling zijn van meerdere parts. Dit om de status van je ontwerp en print in de tijd vast te leggen. een snapshot heeft een uniek ID, Sxxxx , xxxx zijn random generated nummers, moeten uniek zijn en mogen nooit dubbel zijn. 

## DJF - 004
een part number bestaat default uit 8 cijfers met een - als separotor voor de leesbaarheid.
de 8 cijfers zijn random generated. beginnen niet met een 0 en eindigen ook nooit op een 0.
roadmap topic: custom partnumbering via settings. niet nu.



## DJF-005 — Lokale MVP en openen in Bambu Studio

UC-018 bepaalt de eerste oplevering: een engineer kan een geregistreerde 3MF vanuit PRC in Bambu Studio bewerken en de wijziging expliciet als volgende Part version bevestigen. De lokale Windows-backend kan zowel de werkkopie beheren als het geïnstalleerde programma starten. SolidWorks-integratie, macro’s en het reconstrueren van assemblywerkkopieën met hun interne verwijzingen volgen in een latere fase.

## DJF-006 — Reports en zoekbare projectmetadata

Functionele uitbouw gaat vooraf aan de volgende visuele herinrichting. Plaatbeelden komen uit de geregistreerde 3MF. Filters doorzoeken projectinstellingen; materiaal en datum van een printfilter horen bij dezelfde poging. Reports bewaren een snapshot van de geselecteerde parameters. Begrensde reportafbeeldingen staan voor deze lokale pilot in de database zodat back-up en merge dezelfde transacties gebruiken als de rapporttekst. Grote algemene attachments blijven een afzonderlijke vervolgstap.

## Eerste UI-prototype



HTML met Vite, Three.js voor echte STL-previews en Phosphor-iconen. Zo zijn de flows uit UC-003 t/m UC-010 direct te bespreken en lokaal te testen. Geen backend of framework nodig voor deze proef. Snapshots blijven vaste combinaties; nieuwe 3MF-versies wijzigen bestaande combinaties niet. [Scope en grenzen](../prototype/README.md).

## Prototype 2 — Part versions als dagelijkse context

Gebruikersfeedback: snapshots voelden dubbel. Daarom legt een numerieke Part version (001…) de exacte bestandscombinatie vast; documentrevisies blijven letters. Eén bestandswijzigingsactie geeft één nieuwe Part version. Reports en attachments zijn aanvullende registraties zonder versietrigger. Snapshots blijven een latere baseliningfunctie. Logbook en Where used maken wijziging en herkomst zichtbaar; Engels is de basistaal. Prototype gebruikt alleen geheugenopslag en simuleert bestandsregistratie.

## Part Details in plaats van dubbele bestandslijst

Bestanden staan al naast de viewer. De tab toont nu 3MF-instellingen en printgegevens. De aangeleverde 3MF wordt vooraf uitgelezen met Python-stdlib; geen extra browserafhankelijkheid. De proef koppelt de extractie expliciet aan demo G. Gewicht/tijd ontbreken en blijven Unknown. Geconfigureerde filamenten worden apart van toegewezen/verbruikte filamenten benoemd.

## Filamentselectie en grove printtijd

Geselecteerde filamenten uit modeltoewijzing, waar beschikbaar versterkt door slicinggebruik. Geen AMS-liveclaim. Hergebruik de slicerindicatie en rond die af; een eigen lengte/snelheidsformule verwart materiaaltoevoer met nozzlebeweging. Onvolledige plaatdata niet als totaal presenteren. Zie [[3MF_PRINT_DETAILS_RESEARCH]].

## Prototype v4 — veilige bewijsvoering en engineeringwerk

De samples bevatten bruikbare 3MF-compositie maar nog geen betrouwbaar uitgelezen native SLDASM-childboom. Daarom geen inferred assembly uit omliggende namen: aparte componenttypen, herkomst en manifest-import. Nieuwe read-only SolidWorks-macro als Windows-vervolgproef; geen sleutelvrije Document Manager-herkansing.

STL-assets zijn lossless gzip om de zelfstandige HTML klein genoeg te houden; Three.js en bestaande browser-API’s blijven voldoende, zonder nieuwe runtime-dependency. IndexedDB biedt lokale Blob/binaire opslag en concepts; expliciete backup en opslagfouten voorkomen de indruk van gegarandeerde cloudopslag. Workflow en toegankelijkheid verbeteren binnen de bestaande lichte PRC-vormgeving; geen complete redesign.
