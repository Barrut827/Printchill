# PrintChill — Design Justification File

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
