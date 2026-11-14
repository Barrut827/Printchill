# PrintChill — Use cases

## Inhoudsopgave

- [Doel en scope](#doel-en-scope)
- [Werkwijze](#werkwijze)
- [Identificatie en traceerbaarheid](#identificatie-en-traceerbaarheid)
- [Status en prioriteit](#status-en-prioriteit)
- [Use-caseregister](#use-caseregister)
- [UC-001 — SolidWorks-metadata read-only naar JSON exporteren](#uc-001)
- [UC-002 — Part aanmaken, reviseren en voorbereiden voor printen](#uc-002)
- [UC-003 — Feedback op een printrun vastleggen](#uc-003)
- [UC-004 — Een bestaand part openen in SolidWorks of Bambu Studio](#uc-004)
- [UC-005 — Wijzigingen aan een CAD-part of slicerproject als nieuwe revisie bewaren](#uc-005)
- [Volledig use-casetemplate](#volledig-use-casetemplate)
  - [UC-XXX — Template: werkwoord + gebruikersdoel](#uc-xxx)
- [Controle vóór implementatie](#controle-vóór-implementatie)

Dit document bevat de use cases van PrintChill en vormt de basis voor scope, ontwerp, implementatie en verificatie.



## Use-caseregister

Voeg hier bij elke nieuwe use case een rij toe en gebruik hetzelfde ID in de detailbeschrijving.

| ID | Titel | Primaire actor | Status | Prioriteit | Release | Afhankelijkheden |
| --- | --- | --- | --- | --- | --- | --- |
| UC-001 | SolidWorks-metadata read-only naar JSON exporteren | CAD-gebruiker | In uitvoering | Must | Metadata-POC | SolidWorks Design Premium 2026 SP0, Windows 64-bit |
| UC-002 | Part aanmaken, reviseren en voorbereiden voor printen | CAD-engineer | Concept | Nog te bepalen | Nog te bepalen | SolidWorks 2026, Bambu Studio, beheerde opslag |
| UC-003 | Feedback op een printrun vastleggen | CAD-engineer / productiemedewerker | Concept | Nog te bepalen | Nog te bepalen | UC-002, 3MF-parameters en bijlagen |
| UC-004 | Een bestaand part openen in SolidWorks of Bambu Studio | CAD-engineer | Concept | Nog te bepalen | Nog te bepalen | UC-002, bestanden en applicaties |
| UC-005 | Wijzigingen aan een CAD-part of slicerproject als nieuwe revisie bewaren | CAD-engineer | Concept | Nog te bepalen | Nog te bepalen | UC-004, revisieregistratie en mapdetectie |

### UC-001

[Back to top](#inhoudsopgave)

**Titel:** SolidWorks-metadata read-only naar JSON exporteren

**Status:** In uitvoering — VBA-bron beschikbaar; compilatie en runtimeverificatie in de doelinstallatie staan nog open. **Prioriteit:** Must voor deze POC. Geen productrelease of formele goedkeuring vastgesteld.

**Doel:** opgeslagen document- en configuratieproperties beschikbaar maken voor een volgende tool zonder het CAD-bronbestand te wijzigen.

**Actor / trigger:** CAD-gebruiker start de macro in SolidWorks Design Premium 2026 SP0.

**Voorwaarden:** een gesloten zelfstandig `.sldprt`, een schrijfbare uitvoermap en de lokale SolidWorks-typebibliotheken. Geen ander geopend document met dezelfde bestandsnaam.

**Hoofdscenario:** gebruiker kiest een gesloten `.sldprt` via de Windows-bestandskiezer en een nieuwe JSON-locatie via een padprompt; macro opent read-only, leest documentproperties, configuratieproperties en summarygegevens, sluit alleen het eigen document zonder opslaan en schrijft UTF-8-JSON. Annuleren van de bestandskiezer stopt zonder export. Gecachete/onopgeloste waarden en uitleesfouten worden zichtbaar gerapporteerd.

**Alternatieven en fouten:** annuleren stopt zonder export; een bestaand uitvoerbestand, al geopend bronbestand of niet-bevestigde read-only toestand blokkeert de export. Propertyfouten geven een gedeeltelijk rapport; een niet uitleesbare groep wordt `null` met foutmelding. Een fatale fout publiceert geen eindbestand en sluit alleen het door de macro geopende document.

**Businessregels / garanties:** geen Save, rebuild, propertysetters of configuratiewissels. Gelijke propertynamen in verschillende scopes blijven apart. Geen afleiding van revisies uit bestandsnamen. Bronbestand blijft behouden; een eerdere gebruikerssave wordt niet teruggedraaid. Geen volledige geometrie- of cut-listdump in deze eerste versie.

| ID | Gegeven / wanneer | Dan | Verificatie |
| --- | --- | --- | --- |
| UC-001-AC-01 | Een part met `test123_printchill` wordt uitgelezen | Naam, scope en waarde komen overeen met de Property-dialog | Niet uitgevoerd in SolidWorks |
| UC-001-AC-02 | Dezelfde naam bestaat op meerdere niveaus | Document- en configuratiewaarden blijven afzonderlijk beschikbaar | Niet uitgevoerd |
| UC-001-AC-03 | Export bevat Unicode, quotes en control characters | Een JSON-parser leest de oorspronkelijke tekst correct terug | Serializer statisch beoordeeld; runtime nog niet uitgevoerd |
| UC-001-AC-04 | De uitleesrun wordt afgerond | Bronhash vóór/na gelijk; geen bestaand gebruikersdocument gesloten of opgeslagen | Niet uitgevoerd |
| UC-001-AC-05 | Bron al geopend, uitvoer bestaat of gebruiker annuleert | Geen overschrijving, geen wijziging van gebruikersdocumenten | Niet uitgevoerd |
| UC-001-AC-06 | Een waarde is gecachet of een veld is niet uitleesbaar | Status, waarschuwingen/fouten en scope maken de beperking zichtbaar | Niet uitgevoerd |

**Open punten:** exacte API-werking en compilatie onder SP0, gedrag van externe add-ins en actuele versus gecachete properties. Zie [[SOLIDWORKS_JSON_POC]] voor contract en testplan. Ontwerpafweging: [[DJF]].

**Scope-uitbreiding schema 0.2:** interne opslaggegevens, Windows-bestandsgegevens, configuratiedetails/materialen, releasehistorie, directe referenties, vergelijkingen, actieve feature-/cut-list-inventaris en bodygegevens. Daarmee vervangt deze uitbreiding de eerdere afbakening die cut-lists en alle geometriegegevens uitsloot. Volledige geometrie, massa en inactieve configuratiegeometrie blijven buiten scope. De basisexport is door de gebruiker uitgevoerd; uitbreiding nog niet runtimegeverifieerd. AC-04 blijft open: `read_only`/dirty-flags bewijzen geen gelijke bronhash.

| ID | Gegeven / wanneer | Dan | Verificatie |
| --- | --- | --- | --- |
| UC-001-AC-07 | Part met ingevulde opslaggegevens | Interne last saved/by wordt apart van Windows-tijden en runtimeversie weergegeven | Niet uitgevoerd |
| UC-001-AC-08 | Actieve configuratie bevat bodies en features | Inventaris, cut-list-properties en benaderende bounds zijn gelabeld met hun actieve-configuratiecontext | Niet uitgevoerd |
| UC-001-AC-09 | Een optioneel veld is niet beschikbaar | De overige groepen worden geëxporteerd en de beperking verschijnt expliciet | Niet uitgevoerd |

[Back to top](#inhoudsopgave)

## Volledig use-casetemplate

> [!info] Gebruik van het template
> Kopieer onderstaande sectie voor iedere nieuwe use case. Vervang `UC-XXX` door het volgende vrije ID en vul de velden in. Gebruik **Niet van toepassing** met een korte reden waar nodig. Markeer onbekende punten als **Nog te bepalen**; presenteer aannames niet als besluiten.

### UC-XXX

[Back to top](#inhoudsopgave)

**Titel:** [Werkwoord + gebruikersdoel]

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-XXX |
| Titel | [Korte, doelgerichte naam] |
| Type | [CRUD-C, CRUD-R, CRUD-U, CRUD-D of combinatie volgens het gebruikersdoel] |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | [JJJJ-MM-DD] |
| Goedkeuring | [Besluitnemer, datum en verwijzing naar besluit; nog niet goedgekeurd] |

#### Doel en waarde

[Welk probleem lost dit voor de gebruiker op? Wat heeft de gebruiker na afloop bereikt?]

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | [Rol die het scenario start om een doel te bereiken] |
| Overige actoren | [Andere gebruikersrollen of externe systemen; indien van toepassing] |

#### Trigger

[De concrete gebeurtenis of gebruikersactie die het scenario start.]

#### Voorwaarden

- [Wat moet vóór de start waar zijn, zoals aanwezige gegevens of benodigde toegangsrechten?]

#### Resultaat bij succes

- [Waarneembare eindtoestand van gegevens en gebruikerservaring.]

#### Garanties bij mislukking

- [Welke bestaande gegevens blijven behouden en welke gedeeltelijke wijzigingen moeten worden voorkomen of teruggedraaid?]

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | [Start de handeling] | [Toont of controleert de benodigde informatie] |
| 2 | [Voert gegevens in of maakt een keuze] | [Valideert invoer en geeft waar nodig feedback] |
| 3 | [Bevestigt de handeling] | [Voert de handeling uit en toont het resultaat] |

Voeg stappen toe of verwijder ze naar behoefte. Beschrijf het normale succespad; verwijs voor afwijkingen naar de betreffende stap.

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | [Stapnummer] | [Geldige alternatieve keuze of annuleren] | [Actoractie en systeemreactie] | [Einde of terug naar stap X] |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | [Stapnummer] | [Bijvoorbeeld ongeldige invoer of onbereikbare opslag] | [Begrijpelijke melding en mogelijke vervolgstap] | [Wat is wel of niet opgeslagen?] |

#### Businessregels

- [Domeinregel die voor dit scenario geldt. Verwijs naar gedeelde regels zodra die zijn vastgelegd.]
- [Beschrijf bij bestandsrelaties expliciet of een verwijzing naar een specifieke revisie wordt vastgelegd.]

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| [Object, bestand, revisie of relatie] | [Invoer, uitvoer of wijziging] | [Verplichte velden, toegestane waarden of consistentieregel] |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** [Wie mag deze handeling uitvoeren en welke gegevens inzien?]
- **Dataconsistentie:** [Welke wijzigingen moeten samen slagen of samen ongedaan blijven?]
- **Gebruiksgemak en toegankelijkheid:** [Concrete, toetsbare verwachtingen indien relevant.]
- **Prestaties en grenzen:** [Meetbare grenzen met meetcondities, of nog te bepalen; geen ongefundeerde streefwaarden.]

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-XXX-AC-01 | [Begintoestand] | [Actie op het succespad] | [Concreet, toetsbaar resultaat] | [Test-ID of testnaam; nog niet uitgevoerd] |
| UC-XXX-AC-02 | [Begintoestand voor een relevant alternatief] | [Alternatieve actie] | [Verwachte uitkomst] | [Test-ID of testnaam; nog niet uitgevoerd] |
| UC-XXX-AC-03 | [Begintoestand voor een relevante fout] | [Fout treedt op] | [Melding en gegarandeerde gegevenstoestand] | [Test-ID of testnaam; nog niet uitgevoerd] |

Maak criteria afzonderlijk toetsbaar. Dek relevante alternatieven, fouten, rechten en domeinregels af; het aantal rijen staat niet vast.

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** [Andere use-case-ID’s of externe voorwaarden.]
- **Gerelateerde use cases:** [ID en aard van de relatie.]
- **Buiten scope:** [Gedrag dat deze use case bewust niet omvat.]
- **Ontwerpbesluiten:** [Verwijzing naar [[DJF]] en het betreffende besluit.]
- **Planning:** [Verwijzing naar [[ROADMAP]] en release of fase.]

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-XXX-Q-01 | [Wat moet nog worden vastgesteld?] | [Naam of rol; nog te bepalen] | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| [JJJJ-MM-DD] | [AC-ID’s] | [Geslaagd, gefaald, geblokkeerd of niet uitgevoerd] | [Testresultaat, verslag of reden] |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | [JJJJ-MM-DD] | Eerste concept | [Naam of rol] |

[Back to top](#inhoudsopgave)




### UC-002

[Back to top](#inhoudsopgave)

**Titel:** Part aanmaken, reviseren en voorbereiden voor printen
#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-002 |
| Titel | Part aanmaken, reviseren en voorbereiden voor printen |
| Type | CRUD-C |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-12 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

De CAD-engineer bewaart een ontwerp met herleidbare CAD-, STL- en 3MF-revisies en ziet de printgegevens bij het part terug.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | CAD-engineer |
| Overige actoren | SolidWorks 2026, Bambu Studio en de door de engineer bediende printer |

#### Trigger

De engineer kiest in de SolidWorks-ribbon **Save to Printchill** voor een nieuw part of **Save & push to Printchill** voor een volgende revisie.

#### Voorwaarden

- SolidWorks bevat het te bewaren part en de gebruiker heeft STL-exportinstellingen gekozen.
- De PrintChill-opslag is bereikbaar en schrijfbaar.
- Bambu Studio is beschikbaar voor **Prepare to print**.

#### Resultaat bij succes

- Het partoverzicht toont partnummer, thumbnail, CAD- en STL-revisies en het gekoppelde 3MF-project met beschikbare printgegevens.
- De engineer kan het voorbereide bestand naar de printer sturen en de status **First printed** vastleggen.

#### Garanties bij mislukking

- Eerdere geregistreerde revisies blijven beschikbaar.
- Een gedeeltelijke opslag of export krijgt een foutstatus en kan gecontroleerd worden hervat.
- Onzekere bronrelaties worden aan de gebruiker voorgelegd.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Maakt en tekent een nieuw part in SolidWorks | SolidWorks biedt het actieve part aan de PrintChill-integratie aan |
| 2 | Kiest Save to Printchill | Controleert het partnummer in de partmetadata |
| 3 | Bevestigt Generate part number bij een ontbrekend nummer | Genereert een willekeurig uniek partnummer en eerste revisie, hernoemt het part en slaat het op de PrintChill-locatie op |
| 4 | Wacht op registratie | Schrijft partnummer en revisie in de afgesproken metadata, registreert een tijdstip en maakt een isometrische thumbnail |
| 5 | Wacht op STL-export | Exporteert met de ingestelde SolidWorks-opties, bewaart de STL in PrintChill en neemt partnummer en revisie op in de STL-header |
| 6 | Wijzigt het part en kiest Save & push to Printchill | Herkent het bestaande part, maakt op de achtergrond een Save As voor de nieuwe CAD-revisie en actualiseert de revisiemetadata |
| 7 | Wacht op de nieuwe registratie | Registreert tijdstip en thumbnail, exporteert opnieuw en bewaart de STL als partnummer-naam-revisie.STL met identificatie in de header |
| 8 | Opent het partoverzicht en kiest Prepare to print naast de gewenste STL | Toont de creatie met thumbnail, partnummer en bestanden en opent de gekozen STL in Bambu Studio |
| 9 | Past printinstellingen aan en bewaart het project | Detecteert het 3MF-bestand, leest de bronverwijzing partnummer-naam-revisie.STL en koppelt de specifieke STL-revisie aan het printproject |
| 10 | Bekijkt het partoverzicht | Toont beschikbaar printmateriaal, printduur, filamentgewicht, filamentlengte en aantal platen uit het 3MF |
| 11 | Stuurt het bestand naar de printer en print het part | Houdt de geregistreerde bronrelaties beschikbaar |
| 12 | Beoordeelt het geprinte part en constateert afwijkingen | Biedt de betreffende revisie en het printproject aan als context voor [[#UC-003]] |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 3 | Partnummer bestaat al | Gebruikt het bestaande nummer en bepaalt de volgende revisie | Verder bij stap 4 |
| A2 | 3 | Gebruiker annuleert nummergeneratie | Beëindigt de registratie | Part blijft beschikbaar in SolidWorks |
| A3 | 6 | Eerste revisie is gereed voor printen | Gebruiker opent direct het partoverzicht | Verder bij stap 8 |
| A4 | 11 | Engineer wil de eerste print markeren | Zet de partstatus op First printed | Status zichtbaar in PrintChill |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 3–7 | Opslag of export mislukt | Toont de mislukte stap en biedt herhalen aan | Eerdere revisies blijven behouden |
| E2 | 8 | Bambu Studio kan de STL niet openen | Toont de fout en de gekozen STL | Geregistreerde bestanden blijven beschikbaar |
| E3 | 9 | Bronverwijzing ontbreekt of is ambigu | Vraagt de gebruiker de bronrevisie te bevestigen | Relatie blijft open tot bevestiging |
| E4 | 10 | Printgegevens ontbreken in 3MF | Toont welke gegevens beschikbaar en onbekend zijn | Beschikbare gegevens blijven zichtbaar |

#### Businessregels

- Het partnummer identificeert het part over revisies heen.
- CAD, STL en 3MF hebben onafhankelijke revisies. Iedere afleiding verwijst naar concrete bronrevisies.
- De STL-header draagt het partnummer en de revisie van de export.
- De koppeling vanuit 3MF moet de gekozen STL-revisie herleiden.
- Revisieregistratie bewaart een tijdstip en een isometrische thumbnail.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Partnummer en revisiemetadata | Identiteit en herkenning | Uniek partnummer, concrete revisie, exacte veldnamen nog te bepalen |
| SLDPRT-revisie | CAD-bron | Eerdere revisies blijven raadpleegbaar |
| STL-revisie | Printgeometrie | Verwijst naar de gebruikte CAD-revisie |
| 3MF-revisie | Slicerproject | Verwijst naar gebruikte STL-revisie(s) |
| Thumbnail en tijdstip | Herkenning | Gebonden aan de geregistreerde revisie |
| Printgegevens | Partoverzicht | Eenheden en plaatcontext zichtbaar |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** engineer heeft lees- en schrijfrechten op de gekozen opslag.
- **Dataconsistentie:** registratie maakt zichtbaar welke CAD-opslag en STL-export voltooid zijn.
- **Gebruiksgemak en toegankelijkheid:** de gekozen revisie is herkenbaar naast Prepare to print.
- **Prestaties en grenzen:** nog te bepalen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-002-AC-01 | Part zonder nummer | Engineer bevestigt nummergeneratie | Uniek nummer en revisie staan in metadata en het part is onder het nummer opgeslagen | Niet uitgevoerd |
| UC-002-AC-02 | Opgeslagen part | STL-export slaagt | STL gebruikt de ingestelde exportopties en bevat nummer en revisie in de header | Niet uitgevoerd |
| UC-002-AC-03 | Bestaand part met revisie | Engineer bewaart een wijziging | Nieuwe CAD- en STL-revisies, tijdstip en thumbnail zijn beschikbaar naast eerdere revisies | Niet uitgevoerd |
| UC-002-AC-04 | Geregistreerde STL | Engineer kiest Prepare to print | Bambu Studio opent de gekozen STL | Niet uitgevoerd |
| UC-002-AC-05 | 3MF met herleidbare bronverwijzing | Het project wordt gedetecteerd | De relatie wijst naar de gebruikte STL-revisie | Niet uitgevoerd |
| UC-002-AC-06 | 3MF met printgegevens | Het project wordt geanalyseerd | Materiaal, duur, gram, meter en plaatcount verschijnen met eenheden en context | Niet uitgevoerd |
| UC-002-AC-07 | Geprint part | Engineer kiest First printed | Partstatus is opgeslagen en zichtbaar | Niet uitgevoerd |
| UC-002-AC-08 | Opslagfout of onzekere 3MF-bron | Registratie wordt uitgevoerd | Fout of open relatie is zichtbaar en eerdere revisies blijven beschikbaar | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** SolidWorks-integratie, beheerde opslag, STL-export, Bambu Studio en 3MF-detectie.
- **Gerelateerde use cases:** [[#UC-001]] levert metadataonderzoek, [[#UC-003]] registreert feedback na printen.
- **Buiten scope:** printeraansturing vanuit PrintChill en automatische maatbeoordeling.
- **Ontwerpbesluiten:** [[DJF]] en [[3MF_METADATA_RESEARCH]] leveren onderzoek voor de integratie.
- **Planning:** nog te bepalen in [[ROADMAP]].

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-002-Q-01 | Welke metadata-veldnamen, nummernotatie en revisieregels gebruiken we? | Nog te bepalen | Open |
| UC-002-Q-02 | Hoe detecteert PrintChill nieuwe 3MF-bestanden en welke opslaglocaties worden gevolgd? | Nog te bepalen | Open |
| UC-002-Q-03 | Hoe betrouwbaar blijft de STL-bronverwijzing na opslaan, dupliceren en vervangen in Bambu Studio? | Nog te bepalen | Praktijktest open |
| UC-002-Q-04 | Welke revisionering en totalen gelden bij meerdere onderdelen, platen en materialen? | Nog te bepalen | Open |
| UC-002-Q-05 | Wat gebeurt met het actieve SolidWorks-document na Save As en hoe wordt een gedeeltelijke registratie hervat? | Nog te bepalen | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-12 | UC-002-AC-01 t/m AC-08 | Niet uitgevoerd | Workflow beschreven als concept |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-12 | Gebruikersworkflow uitgewerkt volgens het template | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)

### UC-003

[Back to top](#inhoudsopgave)

**Titel:** Feedback op een printrun vastleggen

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-003 |
| Titel | Feedback op een printrun vastleggen |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-12 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

De engineer of productiemedewerker bewaart meetresultaten, notities, screenshots en foto's bij de daadwerkelijk geprinte revisie en de gebruikte procesinstellingen.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | CAD-engineer of productiemedewerker van een klein bedrijf |
| Overige actoren | Bambu Studio levert het 3MF-project, SolidWorks en Bambu Studio leveren screenshots |

#### Trigger

Na de print uit [[#UC-002]] constateert de gebruiker afwijkingen en kiest **Create print run** bij het betreffende part.

#### Voorwaarden

- Part, geprinte revisie en gebruikt 3MF-project zijn beschikbaar in PrintChill.
- De gebruiker heeft meetresultaten of observaties en mag een rapport opslaan.

#### Resultaat bij succes

- Een printrunrapport met procesparameters, metingen en bijlagen is opgeslagen bij de betreffende geprinte revisie.

#### Garanties bij mislukking

- Reeds opgeslagen rapporten blijven beschikbaar.
- Bij een opslagfout blijft de invoer beschikbaar om opnieuw op te slaan.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Meet het geprinte onderdeel en constateert afwijkingen | Biedt zoeken naar het part aan |
| 2 | Zoekt het part, opent de laatste opgeslagen versie en controleert de geprinte revisie | Toont revisie en gekoppelde 3MF-projecten |
| 3 | Kiest Create print run bij de betreffende revisie en het gebruikte project | Opent een rapportvenster voor notities en meetresultaten |
| 4 | Bekijkt de procesgegevens | Toont bovenaan laaghoogte, temperatuur, materiaal, walls, binnen- en buitenwandsnelheid, retractie-instellingen en first-layer speed uit het 3MF |
| 5 | Vult gemeten maten en afwijkingen ten opzichte van het 3D-model in | Neemt waarden, eenheden en notities op in het rapport |
| 6 | Kopieert screenshots uit SolidWorks en Bambu Studio en plakt met Ctrl+V | Voegt de afbeeldingen aan het rapport toe |
| 7 | Uploadt een foto van het geprinte part | Toont de foto als bijlage |
| 8 | Kiest + bij de parametertabel en zoekt een aanvullende parameter | Toont alle gevonden 3MF-parameters en filtert op de zoekopdracht |
| 9 | Selecteert de gewenste parameter | Voegt de parameter met waarde en context aan de tabel toe |
| 10 | Kiest Save print run en sluit het venster | Bewaart het rapport onder de geprinte revisie met verwijzing naar de gebruikte 3MF-revisie |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 2 | Een eerdere revisie is geprint | Gebruiker selecteert de betreffende revisie | Verder bij stap 3 |
| A2 | 6–9 | Bijlagen of extra parameters zijn overbodig | Gebruiker slaat de optionele stappen over | Verder bij stap 10 |
| A3 | 3 | Meerdere 3MF-projecten horen bij het part | Gebruiker selecteert het gebruikte project | Verder bij stap 4 |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 4 | 3MF of parameter kan niet worden gelezen | Toont de ontbrekende gegevens en biedt opnieuw selecteren aan | Notities blijven beschikbaar |
| E2 | 6–7 | Plakken of uploaden mislukt | Toont de fout en biedt opnieuw toevoegen aan | Overige rapportinhoud blijft beschikbaar |
| E3 | 10 | Opslaan mislukt | Toont de fout en houdt het rapport open voor herhalen | Invoer blijft beschikbaar |
| E4 | 10 | Revisie of 3MF-relatie ontbreekt | Vraagt selectie van de geprinte broncontext | Definitieve opslag wacht op de bronselectie |

#### Businessregels

- Iedere printrun verwijst naar de daadwerkelijk geprinte revisie en de gebruikte 3MF-revisie.
- De gebruiker bevestigt de revisie wanneer de laatste opgeslagen versie afwijkt van het geprinte onderdeel.
- Parameterwaarden behouden hun naam, eenheid en beschikbare object-, materiaal- of plaatcontext.
- Metingen worden met eenheden en de referentiemaat of beschreven afwijking vastgelegd.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Printrunrapport | Notities, metingen en afbeeldingen | Gebonden aan concrete part- en 3MF-revisie |
| Procesparameters | Uitgelezen uit het gekozen 3MF | Herkomst en beschikbare context bewaard |
| Meetwaarden | Vergelijking met het model | Eenheid en referentie herkenbaar |
| Screenshots en foto's | Visueel bewijs | Bijlagen gekoppeld aan het rapport |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** engineer of productiemedewerker met leesrecht op het part en schrijfrecht voor het rapport.
- **Dataconsistentie:** rapport, bijlagen en revisieverwijzingen worden als samenhangend resultaat opgeslagen.
- **Gebruiksgemak en toegankelijkheid:** screenshots zijn via Ctrl+V toe te voegen en parameters via naam te doorzoeken.
- **Prestaties en grenzen:** ondersteunde afbeeldingsformaten, bestandsgrootten en zoektijd nog te bepalen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-003-AC-01 | Geprinte revisie met 3MF | Gebruiker kiest Create print run | Rapport opent met de geselecteerde broncontext | Niet uitgevoerd |
| UC-003-AC-02 | Beschikbare procesparameters | Rapport wordt geopend | De genoemde standaardparameters verschijnen bovenaan met waarden en context | Niet uitgevoerd |
| UC-003-AC-03 | Metingen en notities | Gebruiker vult het rapport in | Waarden, eenheden en afwijkingen zijn vastgelegd | Niet uitgevoerd |
| UC-003-AC-04 | Screenshot op klembord en fotobestand | Gebruiker plakt en uploadt | Beide afbeeldingen verschijnen en blijven na opslaan beschikbaar | Niet uitgevoerd |
| UC-003-AC-05 | Aanvullende parameter in 3MF | Gebruiker zoekt via + en selecteert | Parameter en waarde verschijnen in de tabel | Niet uitgevoerd |
| UC-003-AC-06 | Volledig rapport | Gebruiker bewaart en heropent | Inhoud en bijlagen staan onder de geprinte revisie met de gebruikte 3MF-relatie | Niet uitgevoerd |
| UC-003-AC-07 | Oudere geprinte revisie | Gebruiker selecteert deze voor registratie | Rapport wordt aan die revisie gekoppeld | Niet uitgevoerd |
| UC-003-AC-08 | Opslagfout | Gebruiker kiest Save print run | Invoer blijft beschikbaar voor een nieuwe poging | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** geregistreerde part- en 3MF-revisies, parameteruitlezing, klembord en bijlageopslag.
- **Gerelateerde use cases:** [[#UC-002]] levert de printcontext.
- **Buiten scope:** automatische CAD-wijzigingen en automatische tolerantiebeoordeling.
- **Ontwerpbesluiten:** verdere uitwerking in [[DJF]].
- **Planning:** nog te bepalen in [[ROADMAP]].

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-003-Q-01 | Welke parameters en eenheden gelden per object, plaat en materiaal? | Nog te bepalen | Open |
| UC-003-Q-02 | Hoe kiest de gebruiker de werkelijk geprinte 3MF-revisie? | Nog te bepalen | Open |
| UC-003-Q-03 | Welke meetvelden, bijlageformaten en opslaglimieten zijn vereist? | Nog te bepalen | Open |
| UC-003-Q-04 | Hoe worden annuleren, rapportwijzigingen en gelijktijdig bewerken afgehandeld? | Nog te bepalen | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-12 | UC-003-AC-01 t/m AC-08 | Niet uitgevoerd | Workflow beschreven als concept |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-12 | Gebruikersworkflow uitgewerkt volgens het template | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)


### UC-004

[Back to top](#inhoudsopgave)

**Titel:** Een bestaand part openen in SolidWorks of Bambu Studio

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-004 |
| Titel | Een bestaand part openen in SolidWorks of Bambu Studio |
| Type | CRUD-R |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-12 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

De engineer opent vanuit PrintChill het CAD-part of het bijbehorende 3MF-project om het te bekijken, te meten en eventueel opnieuw te printen.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | CAD-engineer |
| Overige actoren | SolidWorks 2026, Bambu Studio en eventueel de printer voor een herhaalprint |

#### Trigger

De engineer klikt tijdens het browsen in PrintChill op de thumbnail van een part en kiest het SolidWorks-symbool of Bambu-logo.

#### Voorwaarden

- Het part en de bijbehorende bestanden zijn geregistreerd en bereikbaar.
- De gebruiker heeft leesrechten op de geselecteerde bestanden.
- De gekozen applicatie is geïnstalleerd en kan het bestand openen.

#### Resultaat bij succes

- De geselecteerde revisie is in de gekozen applicatie geopend.
- De engineer kan het model bekijken en maten inspecteren.
- Bij openen van het 3MF kan de engineer besluiten het project opnieuw te printen en daarna Bambu Studio sluiten.

#### Garanties bij mislukking

- Geregistreerde revisies en relaties blijven beschikbaar.
- PrintChill toont een mislukte openactie met de betrokken applicatie en het bestand.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Browset in PrintChill en klikt op de thumbnail | Opent de partdetails |
| 2 | Bekijkt de partdetails | Selecteert automatisch de laatste partversie en toont de bijbehorende bestanden |
| 3 | Klikt op het SolidWorks-partsymbool | Start SolidWorks of gebruikt de beschikbare sessie en opent het CAD-part van de geselecteerde revisie |
| 4 | Bekijkt het part en meet kenmerken | SolidWorks biedt weergave en meetfuncties |
| 5 | Sluit het part | SolidWorks sluit het document volgens de normale applicatieworkflow |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 3 | Engineer kiest het Bambu-logo | PrintChill start Bambu Studio en opent het bijbehorende 3MF van de geselecteerde versie. Engineer bekijkt het bestand, meet kenmerken, kan opnieuw printen en sluit Bambu Studio | Einde |
| A2 | 2 | Engineer wil een oudere revisie bekijken | Selecteert de oudere revisie en het bijbehorende bestand | Verder bij stap 3 of A1 |
| A3 | 4 | Engineer besluit wijzigingen te bewaren | Vervolgt met [[#UC-005]] | Nieuwe revisie volgens UC-005 |
| A4 | 3 / A1 | Meerdere CAD- of 3MF-bestanden zijn gekoppeld | Engineer kiest het gewenste bestand binnen de geselecteerde revisie | Bestand opent in de gekozen applicatie |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 2–3 | Bestand ontbreekt of leesrechten ontbreken | Toont welke revisie of welk bestand ontoegankelijk is | Registratie blijft beschikbaar |
| E2 | 3 / A1 | Applicatie kan niet starten of bestand weigert te openen | Toont de fout en biedt opnieuw proberen aan | Geregistreerde bestanden blijven beschikbaar |
| E3 | A1 | Bij de gekozen versie ontbreekt een 3MF | Toont dat een slicerproject moet worden geselecteerd of aangemaakt via [[#UC-002]] | Bronrelaties blijven beschikbaar |

#### Businessregels

- Het detailoverzicht opent standaard op de laatste partversie.
- Het applicatiesymbool opent het bestand van de geselecteerde revisie.
- Een herhaalprint gebruikt het geopende 3MF-project.
- Bewaren van ontwerp- of slicerwijzigingen volgt [[#UC-005]].

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Part en revisie | Selectie in het detailoverzicht | Standaard laatste versie, expliciete selectie van oudere versie mogelijk |
| SLDPRT | Openen in SolidWorks | Bestand behoort bij de geselecteerde revisie |
| 3MF | Openen in Bambu Studio | Project behoort bij de geselecteerde revisie en bijbehorende bronrelaties |
| Thumbnail en applicatiesymbolen | Navigatie | Acties verwijzen naar het getoonde part en de geselecteerde revisie |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** leesrechten op de geselecteerde revisie en bestanden.
- **Dataconsistentie:** de openactie gebruikt de in de UI geselecteerde broncontext.
- **Gebruiksgemak en toegankelijkheid:** revisie en bestandskeuze zijn herkenbaar bij de applicatiesymbolen.
- **Prestaties en grenzen:** starttijd en gedrag bij reeds geopende documenten nog te bepalen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-004-AC-01 | Part met meerdere revisies | Engineer klikt op de thumbnail | Partdetails tonen standaard de laatste versie | Niet uitgevoerd |
| UC-004-AC-02 | Geselecteerde CAD-revisie | Engineer klikt op het SolidWorks-symbool | SolidWorks opent het betreffende part, waarna bekijken, meten en sluiten mogelijk zijn | Niet uitgevoerd |
| UC-004-AC-03 | Geselecteerde versie met 3MF | Engineer klikt op het Bambu-logo | Bambu Studio opent het bijbehorende 3MF, waarna bekijken, meten, eventueel opnieuw printen en sluiten mogelijk zijn | Niet uitgevoerd |
| UC-004-AC-04 | Eerdere revisie geselecteerd | Engineer opent een bestand | Het bestand van die revisie wordt geopend | Niet uitgevoerd |
| UC-004-AC-05 | Ontbrekend bestand of falende applicatie | Engineer probeert te openen | PrintChill toont de fout met bestand en applicatie | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** bestandsregistratie en relaties uit [[#UC-002]], bereikbare opslag en applicatie-integratie.
- **Gerelateerde use cases:** [[#UC-005]] voor wijzigingen, [[#UC-003]] voor printfeedback.
- **Afbakening:** bekijken, meten en starten van een herhaalprint gebeuren in de geopende applicatie.
- **Ontwerpbesluiten:** applicatiestart en sessiehergebruik uitwerken in [[DJF]].
- **Planning:** nog te bepalen in [[ROADMAP]].

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-004-Q-01 | Welke revisie geldt als laatste bij onafhankelijke CAD-, STL- en 3MF-revisies? | Nog te bepalen | Open |
| UC-004-Q-02 | Hoe worden bestaande applicatiesessies, reeds geopende bestanden en lokale wijzigingen afgehandeld? | Nog te bepalen | Open |
| UC-004-Q-03 | Hoe presenteert PrintChill meerdere gekoppelde 3MF-projecten binnen dezelfde versie? | Nog te bepalen | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-12 | Alle criteria van UC-004 | Niet uitgevoerd | Gebruikersworkflow uitgewerkt, runtimeverificatie staat open |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-12 | Gebruikersbeschrijving uitgewerkt volgens het template | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)

### UC-005

[Back to top](#inhoudsopgave)

**Titel:** Wijzigingen aan een CAD-part of slicerproject als nieuwe revisie bewaren

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-005 |
| Titel | Wijzigingen aan een CAD-part of slicerproject als nieuwe revisie bewaren |
| Type | CRUD-C |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-12 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

De engineer bewaart kleine ontwerp- of printinstellingswijzigingen als nieuwe revisie in PrintChill, met de relatie tussen 3MF, STL en CAD.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | CAD-engineer |
| Overige actoren | SolidWorks 2026, Bambu Studio, PrintChill-database en gevolgde opslagmap |

#### Trigger

De engineer opent een bestaand bestand via [[#UC-004]], wijzigt het ontwerp of de printinstellingen en kiest **Save PRC** in SolidWorks of **Save** in Bambu Studio.

#### Voorwaarden

- Het bestaande partnummer en de laatste geregistreerde revisie zijn in PrintChill beschikbaar.
- De gekozen bronrevisie is geopend via [[#UC-004]].
- De gebruiker heeft schrijfrechten op de gebruikte opslag.
- Voor de slicerroute volgt PrintChill de map waarin Bambu Studio de 3MF bewaart.

#### Resultaat bij succes

- De CAD-route levert een nieuwe CAD-revisie en bijbehorende STL met identificatie in de header.
- De slicerroute registreert de nieuwe 3MF-revisie en de relaties naar de gebruikte STL- en CAD-revisies.
- De nieuwe versie-identificatie is zichtbaar in PrintChill.

#### Garanties bij mislukking

- Eerdere geregistreerde revisies en bronrelaties blijven beschikbaar.
- Een gedeeltelijke registratie is herkenbaar en kan worden hervat.
- De gebruiker kan een ontbrekende of ambigue bronrelatie aanvullen.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Opent het part in SolidWorks volgens [[#UC-004]] | Biedt het betreffende part en de bronrevisie aan |
| 2 | Maakt kleine wijzigingen | SolidWorks bevat de gewijzigde ontwerpstaat |
| 3 | Klikt op Save PRC | Zoekt het partnummer op in de database en leest de laatste version identifier variable, waarvan de exacte definitie nog te bepalen is |
| 4 | Wacht op revisieregistratie | Maakt een nieuwe revisie van het bestaande partnummer en schrijft de nieuwe versie-identificatie in het SolidWorks-partattribuut |
| 5 | Wacht op opslaan en export | Bewaart de nieuwe CAD-revisie, maakt de bijbehorende STL en schrijft partnummer en versie in de STL-header |
| 6 | Bekijkt het resultaat in PrintChill | Toont de nieuwe revisie met de relatie tussen CAD en STL |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 1 | Wijziging betreft printinstellingen | Volg het onderstaande Bambu Studio-scenario | Nieuwe 3MF-revisie geregistreerd |
| A2 | 3 | Partnummer is onbekend in de database | Vervolg registratie van het part via [[#UC-002]] | Hervat na registratie van de broncontext |
| A3 | 5 | Engineer wil nieuwe geometrie in een bestaand Bambu-project herladen | Raadpleeg [[ISSUES#ISS-001]] over Reload from disk bij een gewijzigde STL-naam | Afhandeling wordt na de praktijktest bepaald |

##### Bambu Studio-scenario A1

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| B1 | Opent het 3MF-project volgens [[#UC-004]] | Bambu Studio toont de gekozen projectrevisie |
| B2 | Maakt kleine wijzigingen aan de printinstellingen | Bambu Studio bevat de aangepaste instellingen |
| B3 | Klikt op Save in Bambu Studio | Bewaart het 3MF in de gevolgde map |
| B4 | Wacht op detectie | PrintChill signaleert een nieuw of gewijzigd 3MF via het bestandstijdstip in die map en controleert de opgeslagen inhoud |
| B5 | Wacht op analyse | Bepaalt welke STL-partnummers en versies in het 3MF worden genoemd |
| B6 | Wacht op registratie | Legt relaties vast tussen de nieuwe 3MF-revisie, de gebruikte STL-revisie en de bijbehorende CAD-revisie |
| B7 | Bekijkt de nieuwe versie | Verhoogt de PRC part version ID volgens de nog vast te stellen revisieregels en toont het resultaat |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 4–5 | Metadata schrijven, opslaan of STL-export mislukt | Toont de mislukte stap en biedt gecontroleerd hervatten aan | Eerdere revisies blijven beschikbaar, gedeeltelijke registratie is zichtbaar |
| E2 | B4 | 3MF is nog in opbouw of kan niet worden gelezen | Stelt analyse uit of toont een leesfout en probeert opnieuw zodra het bestand beschikbaar is | Registratie wacht op leesbare inhoud |
| E3 | B5–B6 | STL-identificatie ontbreekt of verwijst naar meerdere kandidaten | Vraagt bevestiging van de concrete bronrevisie | Relatie blijft open tot bevestiging |
| E4 | 4 / B7 | Revisie is ondertussen door een andere registratie verhoogd | Controleert opnieuw de actuele revisie en meldt een conflict indien nodig | Unieke revisie-identificatie blijft vereist |

#### Businessregels

- Het opgegeven type CRUD-C beschrijft het aanmaken van een nieuwe revisie bij een wijziging.
- Het partnummer blijft de identiteit over de revisies heen.
- De CAD-route schrijft de nieuwe versie in het partattribuut en in de STL-header.
- De slicerroute bewaart de specifieke bronrelaties tussen 3MF, STL en CAD.
- Het bestandstijdstip geeft aanleiding tot inhoudscontrole. De revisieregels bepalen wanneer een save een nieuwe revisie oplevert.
- De door de gebruiker gevraagde verhoging van PRC part version ID bij een slicerwijziging wordt uitgewerkt met behoud van de onafhankelijke bestandsrevisies.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Partnummer | Database-opzoeking | Verwijst naar het bestaande part |
| Version identifier variable | Laatste en volgende versie bepalen | Naam, notatie en increment nog te bepalen |
| SolidWorks-partattribuut | Opslag van de nieuwe versie | Komt overeen met de geregistreerde CAD-revisie |
| STL-header | Partnummer en versie | Verwijst naar de bijbehorende CAD-export |
| 3MF-bestand en tijdstip | Detectie en analyse | Inhoud leesbaar vóór definitieve registratie |
| 3MF → STL → CAD | Traceerbaarheid | Relaties verwijzen naar concrete bestandsrevisies |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** engineer heeft leesrecht op de bron en schrijfrecht voor nieuwe revisies.
- **Dataconsistentie:** herhaalde detectie van dezelfde opgeslagen inhoud krijgt een gecontroleerde afhandeling, revisie-ID's blijven uniek.
- **Gebruiksgemak en toegankelijkheid:** registratie toont de nieuwe versie of de stap die herstel vereist.
- **Prestaties en grenzen:** detectievertraging, retrybeleid en ondersteunde maplocaties nog te bepalen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-005-AC-01 | Bestaand CAD-part geopend via UC-004 | Engineer wijzigt het part en kiest Save PRC | PrintChill vindt het partnummer en de laatste versie in de database | Niet uitgevoerd |
| UC-005-AC-02 | Herkend partnummer | Nieuwe CAD-revisie wordt geregistreerd | Nieuwe versie staat in PrintChill en het SolidWorks-partattribuut | Niet uitgevoerd |
| UC-005-AC-03 | Gewijzigd CAD-part | Opslaan en export slagen | Bijbehorende STL bevat partnummer en versie in de header en verwijst naar de opgeslagen CAD-revisie | Niet uitgevoerd |
| UC-005-AC-04 | Bestaand 3MF geopend via UC-004 | Engineer wijzigt printinstellingen en bewaart in de gevolgde map | PrintChill signaleert de bestandswijziging via het tijdstip en analyseert de inhoud | Niet uitgevoerd |
| UC-005-AC-05 | 3MF met herkenbare STL-bron | Registratie slaagt | Nieuwe 3MF-revisie is gekoppeld aan de juiste STL- en CAD-revisies en de PRC part version ID volgt de vastgestelde revisieregels | Niet uitgevoerd |
| UC-005-AC-06 | Onzekere STL-bron of leesfout | Analyse wordt uitgevoerd | Fout of open bronrelatie is zichtbaar en herstel kan worden gestart | Niet uitgevoerd |
| UC-005-AC-07 | Eerdere revisies aanwezig | Een nieuwe registratie deels faalt | Eerdere revisies blijven beschikbaar en gedeeltelijke registratie is herkenbaar | Niet uitgevoerd |
| UC-005-AC-08 | Nieuwe STL met gewijzigde bestandsnaam | Reload from disk wordt onderzocht | Gedrag en vervolgaanpak staan met testbewijs bij ISS-001 | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** [[#UC-004]], database, SolidWorks-integratie, STL-export en 3MF-mapdetectie.
- **Gerelateerde use cases:** [[#UC-002]] voor eerste registratie en [[#UC-003]] voor printfeedback.
- **Afbakening:** ontwerpwijzigingen gebeuren in SolidWorks, printinstellingen worden in Bambu Studio gewijzigd.
- **Ontwerpbesluiten:** revisiebeleid en detectie uitwerken in [[DJF]], save-detectie onderzocht in [[3MF_METADATA_RESEARCH]].
- **Planning:** nog te bepalen in [[ROADMAP]], Reload from disk opvolgen via [[ISSUES#ISS-001]].

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-005-Q-01 | Wat zijn de naam en incrementregels van version identifier variable en het SolidWorks-attribuut? | Nog te bepalen | Open |
| UC-005-Q-02 | Betekent PRC part version ID bij een 3MF-save een partrevisie, projectrevisie of overkoepelende registratie? | Nog te bepalen | Open, afstemmen op onafhankelijke CAD-, STL- en 3MF-revisies |
| UC-005-Q-03 | Welke map wordt gevolgd en hoe worden saves met identieke inhoud en herhaalde events behandeld? | Nog te bepalen | Open |
| UC-005-Q-04 | Hoe blijft de vorige 3MF-revisie beschikbaar bij Save naar hetzelfde pad? | Nog te bepalen | Open |
| UC-005-Q-05 | Werkt Reload from disk bij een nieuw geëxporteerde STL met andere naam en hoe blijven slicerinstellingen behouden? | Nog te bepalen | Open, [[ISSUES#ISS-001]] |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-12 | Alle criteria van UC-005 | Niet uitgevoerd | Gebruikersworkflow uitgewerkt, runtimeverificatie staat open |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-12 | Gebruikersbeschrijving uitgewerkt volgens het template | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)

## UC#6 - Browsing for parts to print

involved, engineer

engineer zoekt een part voor nieuwe print.
1: open PRC , UI laad.
beschrijving UI: linkerkant scherm kolom met boven aan zoekbalk, filter knop.
daaronder collecties en projecten. zie beschrijving in architecture .md
deze kolom in ongeveer 20% van UI breedte. de rest bestaat uit "cards" waarin een thumbnail te zien is van het part met daaronder heel beknopt een samenvatting:
- partnaam , number, versie , status, last modified, last printed , print materiaal, hoeveelheid materiaal , kleur , print tijd. tags.
2: engineer scrold door de cards op zoek naar een part.
3: typt in search bar een naam in.
4: cards met matchende namen of daar op lijkend blijven over.
5: engineer hovert met muis over een card, card wordt groter en laat meer detials zien aan attributes en ook geoppelde files.
6: engineer klikt op thumbnail, een viewer opent om het STL file te bkijken in 3D.
7: engineer wil weten hoe groot het part is. boven in de viewer zit ene knop met een kubus met maat lijntjes er bij, de viewer laat meteen een bounding box zien met lengte breedte hoogte van part.
8: engineer draait part wat rond en sluit vervolgens de viewer weer door op het kruisje in de hoek te klikken, en weer terug te keren op de card.
9: dit wordt hem, engineer klikt op het slicer symbool. bambustudio opent het part in bambustudio, part is de vorige keer al gesliced en al. engineer klikt op: print plaat
10: bambu studio start print process.



----------------------------------------------------------------------------------------------------------------------------------------------------------------------------


[Back to top](#inhoudsopgave)

## Doel en scope

PrintChill helpt CAD-hobbyisten, zzp’ers en kleine organisaties om CAD-bestanden, STL-bestanden en 3MF-printprojecten te beheren. Bestanden hebben onafhankelijke revisies. Relaties leggen vast welke specifieke bronrevisies bij een afgeleid bestand of printproject horen.

De eerste productcontext is SolidWorks 2026 en Bambu Studio. Dit betekent nog niet dat automatische integraties met deze applicaties zijn besloten.

## Werkwijze

- Beschrijf een nieuwe feature eerst als use case, voordat implementatie begint.
- Beschrijf het gebruikersdoel en waarneembaar systeemgedrag; leg technische ontwerpkeuzes vast in [[DJF]].
- Gebruik één primaire gebruikersdoelstelling per use case.
- Houd dit document, [[ROADMAP]] en de architectuurdocumentatie onderling consistent.
- Voeg elke nieuwe use case toe aan de inhoudsopgave met een link naar de kop met het unieke ID, bijvoorbeeld `[UC-001 — Model importeren](#uc-001)`. Gebruik het ID als kop en plaats de titel op de regel eronder, zoals in het template. Behoud bovenaan en onderaan elke use case de link `[Back to top](#inhoudsopgave)`.
- Onderstaande indeling is geïnspireerd op requirementsbeheer in IBM DOORS. Het is een projecttemplate, geen officieel IBM-template.
- CRUD beschrijft het use-casetype. Gebruik CRUD-C voor aanmaken, CRUD-R voor lezen, CRUD-U voor bijwerken en CRUD-D voor verwijderen. Neem het type op in de metadata.

## Identificatie en traceerbaarheid

| Object | Notatie | Regel |
| --- | --- | --- |
| Use case | `UC-001` | Oplopend nummer; eenmaal toegewezen niet wijzigen of hergebruiken |
| Acceptatiecriterium | `UC-001-AC-01` | Uniek binnen de use case |
| Open vraag | `UC-001-Q-01` | Vraag met eigenaar en besluit indien bekend |
| Verificatie | Testnaam of test-ID | Verwijs naar de controle die een acceptatiecriterium daadwerkelijk verifieert |

Gebruik de use-case-ID in roadmapitems, ontwerpbesluiten en relevante tests. Verwijder vervallen use cases niet uit het register; markeer ze als vervallen en vermeld de reden of opvolger.

## Status en prioriteit

| Status | Betekenis |
| --- | --- |
| Concept | Eerste uitwerking; aannames en vragen kunnen nog openstaan |
| Ter beoordeling | Voldoende uitgewerkt om scope en gedrag te beoordelen |
| Goedgekeurd | Scope en acceptatiecriteria zijn afgestemd en de besluitnemer is vastgelegd |
| In uitvoering | Implementatie is gestart |
| Geïmplementeerd | Implementatie beschikbaar; verificatie nog niet volledig afgerond |
| Geverifieerd | Alle acceptatiecriteria aantoonbaar gecontroleerd; bewijs vastgelegd |
| Vervallen | Niet meer van toepassing; reden en eventuele opvolger vastgelegd |

Een status verandert alleen op basis van het bijbehorende resultaat. Een geslaagde deeltest maakt een use case nog niet geverifieerd.

[Back to top](#inhoudsopgave)

| Prioriteit | Betekenis |
| --- | --- |
| Must | Nodig voor het afgesproken doel van de betreffende release |
| Should | Belangrijk, maar de release kan zonder functioneren |
| Could | Wenselijk als tijd en ruimte beschikbaar zijn |
| Won’t deze release | Bewust buiten de betreffende release gehouden |
| Nog te bepalen | Nog niet geprioriteerd |


## Controle vóór implementatie

- Het doel, de actoren, trigger en voorwaarden zijn duidelijk.
- Het succespad, relevante alternatieven en fouten zijn beschreven.
- Gegevensrelaties, revisiegedrag en toegangsrechten zijn expliciet waar van toepassing.
- Acceptatiecriteria zijn toetsbaar en hebben unieke ID’s.
- Blokkerende vragen zijn opgelost; resterende aannames zijn zichtbaar.
- Prioriteit, afhankelijkheden, status en planning zijn consistent met het register en de roadmap.
- Er is een implementatieplan met een afweging van impact en ontwerpkeuzes, conform [[AGENT]].
  
[Back to top](#inhoudsopgave)
