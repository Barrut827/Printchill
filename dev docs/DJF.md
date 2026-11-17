# PrintChill — Design Justification File

## DJF-003 — Begrippen en gebruikersdatamodel

Part is de vaste onderdeelidentiteit; documenten hebben onafhankelijke versies. Snapshot betekent een baseline van een combinatie van specifieke versies en bronrelaties, geen iteratie of enkele bestandstoestand. Een Print Report beschrijft één printpoging met die snapshot. Hierdoor kunnen meerdere pogingen dezelfde combinatie gebruiken en blijft eerdere printcontext behouden bij nieuwe versies.

De bestaande term revisie wordt voorlopig gelezen als versie, zonder extra formele revisielaag. Status (`draft`, `print-candidate`, `printed`, `scrap`) staat apart; niveau en overgangen zijn nog niet besloten. Zie [[Architecture]], [[USECASES#UC-003]] en [[USECASES#UC-010]]. De afbeelding illustreert één Part; de relaties ondersteunen ook meerdere Parts per 3MF/snapshot.

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
