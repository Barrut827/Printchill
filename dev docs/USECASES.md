# PrintChill — Use cases

## Inhoudsopgave

- [Doel en scope](#doel-en-scope)
- [Werkwijze](#werkwijze)
- [Identificatie en traceerbaarheid](#identificatie-en-traceerbaarheid)
- [Status en prioriteit](#status-en-prioriteit)
- [Use-caseregister](#use-caseregister)
- [UC-001 — SolidWorks-metadata read-only naar JSON exporteren](#uc-001)
- [UC-002 — Part aanmaken, reviseren en voorbereiden voor printen](#uc-002)
- [UC-003 — Print Report van een printpoging vastleggen](#uc-003)
- [UC-004 — Een bestaand part openen in SolidWorks of Bambu Studio](#uc-004)
- [UC-005 — Wijzigingen aan een CAD-part of slicerproject als nieuwe revisie bewaren](#uc-005)
- [UC-006 — Parts visueel browsen en voorbereiden voor herhaalprint](#uc-006)
- [UC-007 — Tags aanmaken, toekennen en gebruiken](#uc-007)
- [UC-008 — Parts zoeken, filteren en zoekopdrachten opslaan](#uc-008)
- [UC-009 — Waar-gebruikt-relaties bekijken en volgen](#uc-009)
- [UC-010 — Snapshot van documentversies vastleggen en raadplegen](#uc-010)
- [UC-011 — Part versions en logbook beheren](#uc-011)
- [UC-012 — Attachments en softwareverwijzingen per Part version beheren](#uc-012)
- [UC-013 — Samplebestanden en assemblycomponenten inspecteren](#uc-013)
- [UC-014 — Part versions vergelijken en efficiënt doorzoeken](#uc-014)
- [UC-015 — Werk en rapportconcepten lokaal bewaren en herstellen](#uc-015)
- [UC-016 — Design state en maturity toepassen](#uc-016)
- [Architectuur en definities](Architecture.md)
- [Volledig use-casetemplate](#volledig-use-casetemplate)
  - [UC-XXX — Template: werkwoord + gebruikersdoel](#uc-xxx)
- [Controle vóór implementatie](#controle-vóór-implementatie)

> [!important] Feedback verwerkt in prototype 2
> Part versions tellen vanaf **001** op wanneer een beheerd bestand verandert; CAD/STL/3MF behouden onafhankelijke letterrevisies. Print Reports en attachments koppelen aan een exacte Part version zonder verhoging. Dit vervangt eerdere verplichte snapshotcontext. UC-010 is uitgesteld als latere baseliningfunctie. UI-taal: Engels.

Dit document bevat de use cases van PrintChill en vormt de basis voor scope, ontwerp, implementatie en verificatie.


## Use-caseregister

Voeg hier bij elke nieuwe use case een rij toe en gebruik hetzelfde ID in de detailbeschrijving.

| ID | Titel | Primaire actor | Status | Prioriteit | Release | Afhankelijkheden |
| --- | --- | --- | --- | --- | --- | --- |
| UC-001 | SolidWorks-metadata read-only naar JSON exporteren | CAD-gebruiker | In uitvoering | Must | Metadata-POC | SolidWorks Design Premium 2026 SP0, Windows 64-bit |
| UC-002 | Part aanmaken, reviseren en voorbereiden voor printen | CAD-engineer | Concept | Nog te bepalen | Nog te bepalen | SolidWorks 2026, Bambu Studio, beheerde opslag |
| UC-003 | Print Report van een printpoging vastleggen | CAD-engineer / productiemedewerker | Concept | Nog te bepalen | Nog te bepalen | UC-002, UC-011, 3MF-parameters en bijlagen |
| UC-004 | Een bestaand part openen in SolidWorks of Bambu Studio | CAD-engineer | Concept | Nog te bepalen | Nog te bepalen | UC-002, bestanden en applicaties |
| UC-005 | Wijzigingen aan een CAD-part of slicerproject als nieuwe revisie bewaren | CAD-engineer | Concept | Nog te bepalen | Nog te bepalen | UC-004, revisieregistratie en mapdetectie |
| UC-006 | Parts visueel browsen en voorbereiden voor herhaalprint | Engineer / maker | Concept | Nog te bepalen | Nog te bepalen | Zie detailbeschrijving |
| UC-007 | Tags aanmaken, toekennen en gebruiken | Engineer / maker | Concept | Nog te bepalen | Nog te bepalen | Zie detailbeschrijving |
| UC-008 | Parts zoeken, filteren en zoekopdrachten opslaan | Engineer / maker | Concept | Nog te bepalen | Nog te bepalen | Zie detailbeschrijving |
| UC-009 | Waar-gebruikt-relaties bekijken en volgen | Engineer / maker | Concept | Nog te bepalen | Nog te bepalen | Zie detailbeschrijving |
| UC-010 | Snapshot van documentversies vastleggen en raadplegen | Engineer / maker | Uitgesteld | Nog te bepalen | Nog te bepalen | Zie detailbeschrijving |
| UC-011 | Part versions en logbook beheren | Engineer / maker | Concept | Must | UI-prototype 2 | UC-002, UC-005 |
| UC-012 | Attachments en softwareverwijzingen per Part version beheren | Engineer / maker | Concept | Must | UI-prototype 2 | UC-011 |
| UC-016 | Design state en maturity toepassen | Engineer / maker | In uitvoering | Must | Prototype v4 | UC-006, UC-011 |
| UC-015 | Werk en rapportconcepten lokaal bewaren en herstellen | Engineer / maker | In uitvoering | Must | Prototype v4 | UC-006, UC-011 |
| UC-014 | Part versions vergelijken en efficiënt doorzoeken | Engineer / maker | In uitvoering | Must | Prototype v4 | UC-006, UC-011 |
| UC-013 | Samplebestanden en assemblycomponenten inspecteren | Engineer / maker | In uitvoering | Must | Prototype v4 | UC-006, UC-011 |


### UC-001

[Back to top](#inhoudsopgave)

**Titel:** SolidWorks-metadata read-only naar JSON exporteren

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-001 |
| Titel | SolidWorks-metadata read-only naar JSON exporteren |
| Type | CRUD-R / CRUD-C |
| Status | In uitvoering |
| Prioriteit | Must |
| Beoogde release | Metadata-POC |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-15 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

Opgeslagen CAD-metadata als JSON beschikbaar maken voor verdere analyse zonder de broninhoud te wijzigen.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | Engineer / maker |
| Overige actoren | PrintChill; externe CAD-/slicerapplicatie waar genoemd |

#### Trigger

Gebruiker start de macro in SolidWorks Design Premium 2026 SP0, 64-bit.

#### Voorwaarden

- Gesloten zelfstandig .sldprt en schrijfbare uitvoermap; geen geopend bestand met dezelfde naam.
- SolidWorks en lokale typebibliotheken zijn beschikbaar.

#### Resultaat bij succes

- JSON bevat scope, document-/configuratieproperties, beschikbare uitgebreide metadata en uitleesstatus.

#### Garanties bij mislukking

- Bestaande Parts, versies, snapshots en rapporten blijven behouden.
- Invoer en selectie blijven waar mogelijk beschikbaar voor herstel; gedeeltelijke resultaten worden niet als volledig gepresenteerd.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Start macro en kiest een part in de Windows-bestandskiezer | Controleert bron en weigert reeds geopende documenten |
| 2 | Kiest een nieuwe JSON-uitvoerlocatie | Controleert dat uitvoer niet bestaat |
| 3 | Bevestigt uitlezen | Opent read-only en controleert toegangsstatus |
| 4 | Wacht op extractie | Leest properties, summary, bestandstijden en ondersteunde v0.2-groepen zonder rebuild of configuratiewissel |
| 5 | Wacht op afronding | Controleert sessiestatus, sluit alleen het eigen document zonder opslaan en publiceert UTF-8-JSON |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 1–2 | Gebruiker annuleert | Stopt zonder export | Einde |
| A2 | 4 | Optionele gegevens ontbreken | Markeert ontbrekende velden expliciet; export kan partial zijn | Verder bij stap 5 |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 1–3 | Bron open, uitvoer bestaat of read-only niet bevestigd | Toont reden en stopt | Geen overschrijving of mutatie van gebruikersdocument |
| E2 | 4 | Property of groep onleesbaar | Rapporteert fout met context; null is geen lege collectie | Overige gegevens waar mogelijk behouden |
| E3 | 5 | Schrijven mislukt | Toont fout; geen half eindbestand publiceren | Eerdere uitvoer blijft behouden |

#### Businessregels

- Geen save, rebuild, configuratieactivatie of propertysetter op de bron.
- Cached/resolved status is geen bewijs dat een berekende waarde actueel is.
- Document- en configuratiescope blijven gescheiden.
- Voor v0.2: summary/opslagvelden, configuratiedetails, referenties, vergelijkingen en actieve feature-/bodycontext; cut-lists alleen bestaand en actief.
- Read-only- en dirty-flags vervangen geen onafhankelijke bronhashcontrole.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Bronpart | Read-only uitlezen | Identiteit en configuratie vastleggen |
| Property | Naam, type, raw/resolved en status | Scope behouden |
| JSON-export | Versieerbaar rapport | export_id identificeert extractie, geen snapshot |
| Bestandsdatums | Herkomst | Windows en interne SolidWorks-datums apart |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** alleen gegevens en acties tonen waarvoor de gebruiker rechten heeft; controle vindt ook server-side plaats.
- **Dataconsistentie:** concrete versies en herkomst behouden; conflicten expliciet afhandelen.
- **Gebruiksgemak en toegankelijkheid:** functies werken via toetsenbord en klik; hover is nooit de enige toegang.
- **Prestaties en grenzen:** schaal- en reactietijddoelen nog vast te stellen; geen ongefundeerde limieten.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-001-AC-01 | Part met custom property hashkey | Macro uitgevoerd | Naam, scope en waarde overeen met Property-dialog | Deelbewijs: JSON v0.1 bevat hashkey=test123-printchill_id; UI-vergelijking niet onafhankelijk uitgevoerd |
| UC-001-AC-02 | Dezelfde naam op meerdere niveaus | Export uitgevoerd | Alle scopes afzonderlijk beschikbaar | Niet uitgevoerd |
| UC-001-AC-03 | Unicode, quotes en control characters | JSON gelezen | Oorspronkelijke tekst correct terugleesbaar | Niet uitgevoerd |
| UC-001-AC-04 | Bronpart en andere gebruikersdocumenten | Run afgerond | Bronhash gelijk; geen gebruikersdocument onbedoeld opgeslagen of gesloten | Niet uitgevoerd |
| UC-001-AC-05 | Geopende bron, bestaande uitvoer of annuleren | Export gestart | Geen overschrijving of gebruikersdocumentwijziging | Niet uitgevoerd |
| UC-001-AC-06 | Cached of onleesbaar veld | Waarde uitgelezen | Status en waarschuwing/fout expliciet | Niet uitgevoerd |
| UC-001-AC-07 | Part met opslaggegevens | V0.2-extractie uitgevoerd | Interne last saved/by apart van Windows-tijden en runtimeversie | Niet uitgevoerd |
| UC-001-AC-08 | Actieve features en bodies | V0.2 geëxporteerd | Context en benaderende bounds expliciet | Niet uitgevoerd |
| UC-001-AC-09 | Niet-beschikbaar optioneel API-veld | Extractie loopt | Overige groepen blijven beschikbaar; beperking gemeld | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** [[SOLIDWORKS_JSON_POC]], lokale SolidWorks-API en [[DJF]].
- **Buiten scope:** Volledige geometrie, berekende massa, inactieve configuratiegeometrie en Document Manager-productintegratie.
- **Ontwerpbesluiten:** [[Architecture]], [[DJF]].
- **Planning:** [[ROADMAP]], volgorde nog af te stemmen.

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-001-Q-01 | Zijn alle nieuwe v0.2-calls betrouwbaar op SP0? | Nog te bepalen | Open |
| UC-001-Q-02 | Welke datumstrings zijn beschikbaar en hoe behandelen we lokalisatie? | Nog te bepalen | Open |
| UC-001-Q-03 | Welke aparte route gebruiken we later voor uitlezen zonder SolidWorks? | Nog te bepalen | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-10 | UC-001-AC-01 | Basisexport door gebruiker uitgevoerd | Geldige v0.1 JSON, hashkey, read_only=true en dirty=false; bronhash niet bewezen |
| 2026-11-15 | UC-001-AC-02 t/m AC-09 | Niet volledig uitgevoerd | Nieuwe v0.2-velden en overige scenario’s nog te verifiëren |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-15 | Concept volgens template; eerdere gebruikersinhoud behouden | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)

### UC-002

[Back to top](#inhoudsopgave)

**Titel:** Part aanmaken, reviseren en voorbereiden voor printen
> [!info] Aanvulling prototype 2
> Nieuwe registratie begint op Part version 001. CAD/STL/3MF hebben eigen letterrevisies. Eén bevestigde bestandswijzigingsactie verhoogt de Part version eenmaal (UC-011).

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
| Documentrevisie | 0.2 |
| Laatst gewijzigd | 2026-11-15 |
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
- De engineer kan het voorbereide bestand naar de printer sturen en het printresultaat via een Print Report vastleggen; statusbeleid wordt apart vastgesteld.

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
| A4 | 11 | Engineer wil de eerste print markeren | Registreert de printpoging via UC-003; niveau van de voorgestelde status printed blijft een open ontwerpvraag | Print Report beschikbaar; geen impliciete statusovergang |

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
| UC-002-AC-07 | Geprint part | Engineer registreert de eerste print | Printpoging is geregistreerd; een statuswijziging volgt pas het afzonderlijk vastgestelde statusbeleid | Niet uitgevoerd |
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

| 0.2 | 2026-11-15 | Terminologie afgestemd op documentversies, snapshots en Print Reports; bestaande scenario’s behouden | Codex |

[Back to top](#inhoudsopgave)

### UC-003

[Back to top](#inhoudsopgave)

**Titel:** Print Report van een printpoging vastleggen

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-003 |
| Titel | Print Report van een printpoging vastleggen |
| Type | CRUD-C / CRUD-R |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.2 |
| Laatst gewijzigd | 2026-11-15 |
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

- De daadwerkelijk gebruikte Part version en betrokken Parts zijn beschikbaar; de vaste bestandscombinatie is geregistreerd via [[#UC-011]].
- De gebruiker heeft meetresultaten of observaties en mag een rapport opslaan.

#### Resultaat bij succes

- Een Print Report met procesparameters, metingen en bijlagen is opgeslagen bij de gebruikte Part version en betrokken Parts.

#### Garanties bij mislukking

- Reeds opgeslagen rapporten blijven beschikbaar.
- Bij een opslagfout blijft de invoer beschikbaar om opnieuw op te slaan.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Meet het geprinte onderdeel en constateert afwijkingen | Biedt zoeken naar het part aan |
| 2 | Zoekt het part en selecteert de daadwerkelijk geprinte Part version | Toont de vastgelegde documentversies; verwijst naar UC-011 als de Part version nog niet is geregistreerd |
| 3 | Kiest Create print run bij de gebruikte Part version | Opent een Print Report met notities en meetresultaten voor één printpoging |
| 4 | Bekijkt de procesgegevens | Toont bovenaan laaghoogte, temperatuur, materiaal, walls, binnen- en buitenwandsnelheid, retractie-instellingen en first-layer speed uit het 3MF |
| 5 | Vult gemeten maten en afwijkingen ten opzichte van het 3D-model in | Neemt waarden, eenheden en notities op in het rapport |
| 6 | Kopieert screenshots uit SolidWorks en Bambu Studio en plakt met Ctrl+V | Voegt de afbeeldingen aan het rapport toe |
| 7 | Uploadt een foto van het geprinte part | Toont de foto als bijlage |
| 8 | Kiest + bij de parametertabel en zoekt een aanvullende parameter | Toont alle gevonden 3MF-parameters en filtert op de zoekopdracht |
| 9 | Selecteert de gewenste parameter | Voegt de parameter met waarde en context aan de tabel toe |
| 10 | Kiest Save print run en sluit het venster | Bewaart het Print Report bij de gebruikte Part version, met Part-, 3MF- en eventuele plaatcontext |

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

- Toevoegen of wijzigen van een Print Report verhoogt de Part version niet.

- Ieder Print Report beschrijft één daadwerkelijke printpoging en verwijst naar de gebruikte Part version; meerdere rapporten mogen dezelfde Part version gebruiken.
- De Part version blijft onveranderd als later andere documentversies beschikbaar zijn.
- Een printpoging mag succesvol, mislukt of afgebroken zijn; een Part version alleen bewijst geen succes.
- De gebruiker bevestigt de revisie wanneer de laatste opgeslagen versie afwijkt van het geprinte onderdeel.
- Parameterwaarden behouden hun naam, eenheid en beschikbare object-, materiaal- of plaatcontext.
- Metingen worden met eenheden en de referentiemaat of beschreven afwijking vastgelegd.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Print Report | Notities, metingen en afbeeldingen van één poging | Gebonden aan concrete Part version en betrokken Parts/3MF-plaat |
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
| UC-003-AC-06 | Volledig rapport | Gebruiker bewaart en heropent | Inhoud en bijlagen verwijzen naar de gebruikte Part version en daarin vastgelegde 3MF-versie | Niet uitgevoerd |
| UC-003-AC-07 | Oudere geprinte revisie | Gebruiker selecteert deze voor registratie | Rapport wordt aan die revisie gekoppeld | Niet uitgevoerd |
| UC-003-AC-08 | Opslagfout | Gebruiker kiest Save print run | Invoer blijft beschikbaar voor een nieuwe poging | Niet uitgevoerd |
| UC-003-AC-09 | Twee printpogingen met dezelfde Part version | Gebruiker maakt twee rapporten | Afzonderlijke rapport-ID’s verwijzen naar dezelfde vaste combinatie | Niet uitgevoerd |
| UC-003-AC-10 | Mislukte of afgebroken print | Gebruiker registreert resultaat | Rapport bewaart de uitkomst zonder de Part version te wijzigen of succes te suggereren | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** geregistreerde part- en 3MF-revisies, parameteruitlezing, klembord en bijlageopslag.
- **Gerelateerde use cases:** [[#UC-002]] levert bestanden; [[#UC-011]] legt de gebruikte combinatie vast.
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

| 0.2 | 2026-11-15 | Terminologie afgestemd op documentversies, Part versions en Print Reports; bestaande scenario’s behouden | Codex |

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
| Documentrevisie | 0.2 |
| Laatst gewijzigd | 2026-11-15 |
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
| 2 | Bekijkt de partdetails | Toont de gekozen Part version en exacte documentrevisies; bij ontbreken van een voorkeur vraagt het systeem selectie |
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

- De standaardselectie is nog te bepalen. Bij een gekozen Part version blijven alle documentrevisies vast; nooit stilzwijgend vervangen door latest.
- Het applicatiesymbool opent het bestand van de geselecteerde revisie.
- Een herhaalprint gebruikt het geopende 3MF-project.
- Bewaren van ontwerp- of slicerwijzigingen volgt [[#UC-005]].

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Part en revisie | Selectie in het detailoverzicht | Concrete Part version en documentrevisies zichtbaar; eerdere versies selecteerbaar |
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

| 0.2 | 2026-11-15 | Terminologie afgestemd op documentversies, snapshots en Print Reports; bestaande scenario’s behouden | Codex |

[Back to top](#inhoudsopgave)

### UC-005

[Back to top](#inhoudsopgave)

**Titel:** Wijzigingen aan een CAD-part of slicerproject als nieuwe revisie bewaren

> [!info] Aanvulling prototype 2
> Bestandswijzigingen leveren een nieuwe Part version op met alleen de gewijzigde documentrevisies verhoogd; per gewijzigd bestand zijn comments mogelijk. Ongewijzigde bestanden behouden hun revisie. Reports en attachments verhogen niets (UC-011/012).

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
| Documentrevisie | 0.2 |
| Laatst gewijzigd | 2026-11-15 |
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
| B7 | Bekijkt de nieuwe versie | Toont de volgende numerieke Part version met nieuwe 3MF-revisie, zonder CAD/STL-revisies te verhogen |

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
- Een slicerwijziging maakt alleen een nieuwe 3MF-versie; CAD- en STL-versies veranderen niet automatisch. De nieuwe bestandscombinatie wordt automatisch geregistreerd als volgende Part version via UC-011.

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
| UC-005-AC-05 | 3MF met herkenbare STL-bron | Registratie slaagt | Nieuwe 3MF-revisie is gekoppeld aan de juiste STL- en CAD-revisies en de CAD/STL-versies en bestaande snapshots blijven behouden | Niet uitgevoerd |
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
| UC-005-Q-02 | Betekent PRC part version ID bij een 3MF-save een partrevisie, projectrevisie of overkoepelende registratie? | Nog te bepalen | Besluit: PRC Part version is de numerieke overkoepelende registratie; documentrevisies blijven onafhankelijk, zie UC-011 |
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

| 0.2 | 2026-11-15 | Terminologie afgestemd op documentversies, snapshots en Print Reports; bestaande scenario’s behouden | Codex |

[Back to top](#inhoudsopgave)

### UC-006

[Back to top](#inhoudsopgave)

**Titel:** Parts visueel browsen en voorbereiden voor herhaalprint

> [!info] Aanvulling prototype 2
> Part number staat prominent en expliciet gelabeld. Elke kaart toont uitsluitend gegevens van de geselecteerde numerieke Part version; geen mix met latest of andere versies. De UI is Engels.

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-006 |
| Titel | Parts visueel browsen en voorbereiden voor herhaalprint |
| Type | CRUD-R |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-15 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

Een geschikt Part vinden, geometrie en afmetingen bekijken en de gekozen printcombinatie in Bambu Studio openen.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | Engineer / maker |
| Overige actoren | PrintChill; externe CAD-/slicerapplicatie waar genoemd |

#### Trigger

Gebruiker opent PrintChill om een Part opnieuw te printen.

#### Voorwaarden

- Geregistreerde Parts zijn beschikbaar; voor preview is een ondersteunde STL nodig.
- Voor herhaalprint is een Part version met concrete 3MF-revisie beschikbaar.

#### Resultaat bij succes

- Gebruiker vindt een Part, inspecteert de geselecteerde geometrie en opent de bedoelde 3MF in Bambu Studio.

#### Garanties bij mislukking

- Bestaande Parts, versies, snapshots en rapporten blijven behouden.
- Invoer en selectie blijven waar mogelijk beschikbaar voor herstel; gedeeltelijke resultaten worden niet als volledig gepresenteerd.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Opent PrintChill | Toont circa 20% zijbalk met zoekbalk, filters, collecties/projecten en daarnaast Part-kaarten |
| 2 | Scrollt door kaarten | Toont thumbnail, naam, nummer, geselecteerde versiecontext, beschikbare status en tags; compacte printgegevens met broncontext |
| 3 | Typt een naam | Filtert kaarten op exacte of gelijkende namen volgens UC-008 |
| 4 | Hovert of focust een kaart; opent details | Vergroot/toont details, extra properties en gekoppelde documenten; ook klikbediening beschikbaar |
| 5 | Klikt op thumbnail | Opent 3D-viewer van een expliciet benoemde STL-versie |
| 6 | Kiest kubus-met-maatlijnen | Toont bounding box met lengte, breedte, hoogte en eenheden |
| 7 | Draait het model en sluit de viewer met kruisje | Herstelt kaart, zoekopdracht en scrollpositie |
| 8 | Kiest slicersymbool en bevestigt de Part version en 3MF-revisie | Opent de concrete 3MF in Bambu Studio via UC-004 |
| 9 | Controleert instellingen en kiest Print plate in Bambu Studio | Printen gebeurt in de slicer; PrintChill claimt geen automatisch bekend resultaat |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 4 | Aanraakscherm of geen hover | Gebruiker opent dezelfde details via klik of toetsenbord | Verder bij stap 5 |
| A2 | 8 | Meerdere projecten of Part versions | Gebruiker kiest expliciet de gewenste combinatie | Verder bij stap 8 |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 5–6 | Geen bruikbare STL of afmetingen | Toont ontbrekende gegevens en beschikbare bestanden | Registratie blijft behouden |
| E2 | 8 | Slicer ontbreekt of bestand is niet bereikbaar | Toont bestand en fout; biedt opnieuw proberen | Geen versie gewijzigd |

#### Businessregels

- De tab **Part Details** vervangt de dubbele bestanden-/revisietab. Bestanden blijven in het Part-versionpaneel; STL blijft aanklikbaar voor Where used.
- Details van uitsluitend de geselecteerde Part version: materiaal, totaalgewicht (g), printtijd, layer height (mm), infill (% en type), geselecteerde filamentkleuren/-types en plaatcount.
- 3MF-bron en scope zijn zichtbaar: projectinstellingen zijn geen bewijs van effectieve object-/plaatinstellingen; geconfigureerde filamenten zijn geen AMS-inventaris en niet automatisch gebruikt. Toon modeltoewijzingen of slicinggebruik; ongebruikte geconfigureerde slots niet als geselecteerd tonen.
- Geen opgeslagen gewicht: Unknown. Printtijd heet Print time · indication; lees alle plaatvoorspellingen of ingesloten G-code-tijdcommentaar en rond af op vijf minuten. Zonder volledige tijdgegevens: Slice required; geen lengte/snelheid-heuristiek. Bij meerdere platen gelden totalen voor het volledige project, niet alleen dit Part.

- Kaartgegevens omvatten waar beschikbaar last modified, last printed, printmateriaal, hoeveelheid, kleur en printtijd.
- Printgegevens komen uitsluitend uit de documentrevisies of Print Reports van de geselecteerde Part version; geen mix met andere versies.
- Ontbrekende gegevens worden niet als nul of succesvolle print getoond.
- Een bounding box is een meshmeting; nauwkeurigheid/eenheid moet zichtbaar zijn.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Part-kaart | Selectie | Part-ID en versie-/printcontext herkenbaar |
| STL-versie | 3D-preview | Geen impliciete wissel naar latest |
| Part version / 3MF-revisie | Herhaalprint | Gebruiker ziet welke combinatie opent |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** alleen gegevens en acties tonen waarvoor de gebruiker rechten heeft; controle vindt ook server-side plaats.
- **Dataconsistentie:** concrete versies en herkomst behouden; conflicten expliciet afhandelen.
- **Gebruiksgemak en toegankelijkheid:** functies werken via toetsenbord en klik; hover is nooit de enige toegang.
- **Prestaties en grenzen:** schaal- en reactietijddoelen nog vast te stellen; geen ongefundeerde limieten.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-006-AC-01 | Parts met thumbnails | Bibliotheek opent | Kaarten en zijbalk tonen beschikbare gegevens met context | Niet uitgevoerd |
| UC-006-AC-02 | Naam in zoekbalk | Gebruiker zoekt | Matchende kaarten blijven over | Niet uitgevoerd |
| UC-006-AC-03 | Kaart met STL | Viewer en maatknop gekozen | Benoemde versie en bounding box met eenheden zijn zichtbaar | Niet uitgevoerd |
| UC-006-AC-04 | Actieve zoekopdracht | Viewer wordt gesloten | Zoekopdracht en scrollpositie blijven behouden | Niet uitgevoerd |
| UC-006-AC-05 | Gekozen Part version | Sliceractie wordt uitgevoerd | Exacte 3MF-versie opent; geen vervanging door latest | Niet uitgevoerd |
| UC-006-AC-06 | Geen hoverbediening | Gebruiker navigeert met toetsenbord | Details en viewer blijven bereikbaar | Niet uitgevoerd |

| UC-006-AC-06 | Part met geregistreerde 3MF-metadata | Part Details geopend | Alle gevraagde velden met eenheden, bron en versiecontext zichtbaar | Prototypecontrole |
| UC-006-AC-07 | Meerdere filamenten en platen | Details geopend | Kleuren/types afzonderlijk zichtbaar; plaatcount en projectscope expliciet | Prototypecontrole |
| UC-006-AC-08 | Geen slicingstatistieken of historische 3MF | Details geopend | Ontbrekende gegevens Unknown; geen data van een andere revisie | Prototypecontrole |

| UC-006-AC-09 | Vier slots, alleen extruder 4 op de modellen | Part Details geopend | Alleen geselecteerd Generic PLA #DCF478 zichtbaar; configuratie geen AMS-liveclaim | Prototypecontrole |
| UC-006-AC-10 | Complete plaatvoorspellingen | Details geopend | Ruwe tijden bewaard en totaal als grove indicatie gepresenteerd | Synthetische extractie- en modeltests |
| UC-006-AC-11 | Alleen gedeeltelijke of eerste-laagtijd | Details geopend | Geen fictieve totale tijd; Slice required met instructie | Prototypecontrole |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** [[#UC-002]], [[#UC-004]], [[#UC-008]], [[#UC-011]], [[Architecture]].
- **Buiten scope:** Printeraansturing, automatische printbevestiging en exacte CAD-maatvoering.
- **Ontwerpbesluiten:** [[Architecture]], [[DJF]].
- **Planning:** [[ROADMAP]], volgorde nog af te stemmen.

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-006-Q-01 | Welke Part version wordt standaard aangeboden op een kaart? | Nog te bepalen | Prototype: latest tot expliciete selectie; productievoorkeur nog open |
| UC-006-Q-02 | Welke printgegevens passen compact op de kaart en welke verschijnen pas in details? | Nog te bepalen | Open |
| UC-006-Q-03 | Hoe worden collecties en projecten ingericht? | Nog te bepalen | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-15 | UC-006-AC-01 t/m AC-06 | Niet uitgevoerd | Gebruikersworkflow uitgewerkt; geen app-test |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-15 | Concept volgens template; eerdere gebruikersinhoud behouden | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)


### UC-007

[Back to top](#inhoudsopgave)

**Titel:** Tags aanmaken, toekennen en gebruiken

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-007 |
| Titel | Tags aanmaken, toekennen en gebruiken |
| Type | CRUD-C / CRUD-R / CRUD-U |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-15 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

Parts individueel of in bulk vindbaar maken met herbruikbare tags.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | Engineer / maker |
| Overige actoren | PrintChill; externe CAD-/slicerapplicatie waar genoemd |

#### Trigger

Gebruiker kiest tagbewerking op een Part-kaart of meerdere geselecteerde Parts.

#### Voorwaarden

- Parts bestaan en gebruiker mag tags toekennen.

#### Resultaat bij succes

- Tags zijn zonder duplicaten gekoppeld aan de gekozen Parts.

#### Garanties bij mislukking

- Bestaande Parts, versies, snapshots en rapporten blijven behouden.
- Invoer en selectie blijven waar mogelijk beschikbaar voor herstel; gedeeltelijke resultaten worden niet als volledig gepresenteerd.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Selecteert vijf Parts met Ctrl+klik of selectievakjes | Houdt selectie zichtbaar en biedt tagactie aan |
| 2 | Kiest Create tag en typt #roboticarm | Valideert naam en toont bestaande suggesties |
| 3 | Bevestigt de nieuwe of bestaande tag | Koppelt de tag eenmaal aan ieder geselecteerd Part |
| 4 | Opent één Part en typt in de tagsectie | Toont suggesties tijdens typen; aanvullende tags zijn toe te voegen |
| 5 | Zoekt #roboticarm + PETG | Past gecombineerde zoekcriteria toe volgens UC-008 |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 1 | Eén Part | Gebruiker opent direct de tagsectie | Verder bij stap 2 |
| A2 | 2 | Naam bestaat al met andere hoofdletters | Biedt bestaande tag aan in plaats van duplicaat | Verder bij stap 3 |
| A3 | 3 | Part heeft tag al | Behoudt één koppeling | Einde |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 2 | Naam bevat spaties of # in de naam | Toont validatiefout en behoudt invoer | Geen tag aangemaakt |
| E2 | 3 | Opslag of autorisatie faalt | Slaat de bevestigde batch niet gedeeltelijk op; toont herstel | Bestaande koppelingen blijven intact |

#### Businessregels

- # is invoerprefix, geen onderdeel van de opgeslagen tagnaam.
- Geen spaties of # in een tagnaam; - en _ zijn toegestaan.
- Hoofdletters zijn toegestaan in weergave; naamuniciteit is hoofdletterongevoelig.
- Een tag mag per Part maximaal eenmaal voorkomen. Geen willekeurige productlimiet op aantal tags; technische grenzen nog bepalen.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Tag | Zoeklabel | Naam uniek zonder onderscheid in hoofdletters |
| Part–Tag | Meervoudige koppeling | Elke combinatie uniek |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** alleen gegevens en acties tonen waarvoor de gebruiker rechten heeft; controle vindt ook server-side plaats.
- **Dataconsistentie:** concrete versies en herkomst behouden; conflicten expliciet afhandelen.
- **Gebruiksgemak en toegankelijkheid:** functies werken via toetsenbord en klik; hover is nooit de enige toegang.
- **Prestaties en grenzen:** schaal- en reactietijddoelen nog vast te stellen; geen ongefundeerde limieten.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-007-AC-01 | Vijf geselecteerde Parts | Tag wordt bevestigd | Alle vijf krijgen precies één koppeling | Niet uitgevoerd |
| UC-007-AC-02 | Bestaande #robotics | Gebruiker voert #Robotics in | Bestaande tag wordt hergebruikt | Niet uitgevoerd |
| UC-007-AC-03 | Ongeldige naam | Gebruiker bevestigt | Validatiefout, geen nieuwe tag | Niet uitgevoerd |
| UC-007-AC-04 | Tag al gekoppeld | Gebruiker kent opnieuw toe | Geen dubbele koppeling | Niet uitgevoerd |
| UC-007-AC-05 | Taginvoer | Gebruiker typt prefix | Passende bestaande tags worden aangeboden | Niet uitgevoerd |
| UC-007-AC-06 | Mislukte batch | Gebruiker bevestigt | Geen stille gedeeltelijke toekenning | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** [[#UC-006]], [[#UC-008]], Partregistratie.
- **Buiten scope:** Tag verwijderen/hernoemen/samenvoegen; beleid voor overige bijzondere tekens.
- **Ontwerpbesluiten:** [[Architecture]], [[DJF]].
- **Planning:** [[ROADMAP]], volgorde nog af te stemmen.

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-007-Q-01 | Welke overige tekens, normalisatie en lengtegrenzen zijn toegestaan? | Nog te bepalen | Open |
| UC-007-Q-02 | Hoe werkt tagonderhoud en wie mag globale tags wijzigen? | Nog te bepalen | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-15 | UC-007-AC-01 t/m AC-06 | Niet uitgevoerd | Gebruikersworkflow uitgewerkt; geen app-test |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-15 | Concept volgens template; eerdere gebruikersinhoud behouden | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)


### UC-008

[Back to top](#inhoudsopgave)

**Titel:** Parts zoeken, filteren en zoekopdrachten opslaan

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-008 |
| Titel | Parts zoeken, filteren en zoekopdrachten opslaan |
| Type | CRUD-R / CRUD-C / CRUD-U |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-15 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

Via één zoekbalk en optionele geavanceerde filters de juiste Parts vinden en dezelfde zoekopdracht later herhalen.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | Engineer / maker |
| Overige actoren | PrintChill; externe CAD-/slicerapplicatie waar genoemd |

#### Trigger

Gebruiker typt in de zoekbalk of opent geavanceerde filters.

#### Voorwaarden

- Partmetadata en bekende printgegevens zijn geïndexeerd; tags zijn beschikbaar.

#### Resultaat bij succes

- Resultaten voldoen aan de criteria; opgeslagen zoekopdrachten zijn opnieuw uitvoerbaar.

#### Garanties bij mislukking

- Bestaande Parts, versies, snapshots en rapporten blijven behouden.
- Invoer en selectie blijven waar mogelijk beschikbaar voor herstel; gedeeltelijke resultaten worden niet als volledig gepresenteerd.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Typt een naam of nummer in de ene zoekbalk | Zoekt direct in partnaam en partnummer |
| 2 | Typt #roboticarm + PETG | Behandelt # als tagzoekactie en + als EN-combinatie; toont geïnterpreteerde criteria |
| 3 | Opent geavanceerde filters | Biedt alle zoekbare toegekende attributes en bestandstypen aan |
| 4 | Kiest geprint, materiaal PETG en afgelopen drie dagen | Filtert op Print Report-context; materiaal en printmoment horen bij dezelfde passende printpoging |
| 5 | Slaat de zoekopdracht op onder een naam | Bewaart criteria, waaronder de relatieve periode, geen bevroren resultaatlijst |
| 6 | Opent later de opgeslagen zoekopdracht | Evalueert de criteria opnieuw tegen actuele, toegankelijke gegevens |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 1 | Naam lijkt op invoer | Toont gelijkende matches herkenbaar | Resultaatlijst |
| A2 | 3 | Eenvoudige zoekopdracht volstaat | Gebruiker gebruikt alleen zoekbalk | Resultaatlijst |
| A3 | 5 | Geen opslag gewenst | Gebruiker voert tijdelijk de query uit | Einde |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 2–4 | Ongeldige of ambigue query | Toont fout en geïnterpreteerde criteria; laat correctie toe | Geen stille verbreding |
| E2 | 6 | Een gebruikt attribuut ontbreekt of rechten zijn gewijzigd | Toont beperking en past toegangscontrole toe | Geen ongeautoriseerde resultaten |

#### Businessregels

- Standaard zoektekst zoekt partnaam en partnummer; # schakelt tagzoeken in.
- + combineert criteria met EN. PETG moet als materiaalcriterium herkenbaar worden geïnterpreteerd of expliciet worden bevestigd.
- Alle toegekende attributes moeten via geavanceerd zoeken selecteerbaar zijn, mits de gebruiker ze mag zien.
- Relatieve datumfilters worden opnieuw geëvalueerd; definitie van drie dagen en tijdzone wordt expliciet vastgesteld.
- Onbekende materiaal- of printgegevens zijn geen match voor een bevestigde materiaal-/printvoorwaarde.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Query | Criteria en operatoren | Interpretatie zichtbaar |
| Opgeslagen zoekopdracht | Naam en criteria | Geen vaste lijst Part-ID’s |
| Print Report | Materiaal en printmoment | Zelfde printpoging voldoet aan gecombineerde voorwaarden |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** alleen gegevens en acties tonen waarvoor de gebruiker rechten heeft; controle vindt ook server-side plaats.
- **Dataconsistentie:** concrete versies en herkomst behouden; conflicten expliciet afhandelen.
- **Gebruiksgemak en toegankelijkheid:** functies werken via toetsenbord en klik; hover is nooit de enige toegang.
- **Prestaties en grenzen:** schaal- en reactietijddoelen nog vast te stellen; geen ongefundeerde limieten.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-008-AC-01 | Naam/nummer | Gebruiker typt | Resultaten actualiseren zonder aparte zoekpagina | Niet uitgevoerd |
| UC-008-AC-02 | #roboticarm + PETG | Query uitgevoerd | Tag EN materiaal worden toegepast en zichtbaar gemaakt | Niet uitgevoerd |
| UC-008-AC-03 | Zoekbare attributes en bestandstypen | Geavanceerd menu opent | Gebruiker kan deze als filters kiezen | Niet uitgevoerd |
| UC-008-AC-04 | Part met verschillende printpogingen | Geprint in drie dagen EN PETG geselecteerd | Alleen een PETG-poging binnen de periode telt als match | Niet uitgevoerd |
| UC-008-AC-05 | Opgeslagen relatieve query | Later opnieuw geopend | Periode schuift mee; actuele resultaten worden berekend | Niet uitgevoerd |
| UC-008-AC-06 | Ongeldige syntax | Gebruiker zoekt | Duidelijke fout; geen ongemerkte wijziging van querybetekenis | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** [[#UC-003]], [[#UC-006]], [[#UC-007]], metadata-index.
- **Buiten scope:** Automatisch classificeren van onbekende materialen en een uitgebreide querytaal buiten de beschreven basis.
- **Ontwerpbesluiten:** [[Architecture]], [[DJF]].
- **Planning:** [[ROADMAP]], volgorde nog af te stemmen.

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-008-Q-01 | Betekent drie dagen 72 uur of kalenderdagen en welke tijdzone geldt? | Nog te bepalen | Open |
| UC-008-Q-02 | Hoe werken quotes, letterlijke + en vrije tekst naast tags? | Nog te bepalen | Open |
| UC-008-Q-03 | Zijn opgeslagen zoekopdrachten persoonlijk of deelbaar? | Nog te bepalen | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-15 | UC-008-AC-01 t/m AC-06 | Niet uitgevoerd | Gebruikersworkflow uitgewerkt; geen app-test |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-15 | Concept volgens template; eerdere gebruikersinhoud behouden | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)


### UC-009

[Back to top](#inhoudsopgave)

**Titel:** Waar-gebruikt-relaties bekijken en volgen

> [!info] Aanvulling prototype 2
> Toon een echt relatiediagram: gekozen STL-revisie centraal, concrete gebruikers erboven en CAD-bron eronder, verbonden met lijnen. Selectie is versiegebonden; ontbrekende relaties worden niet verzonnen.

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-009 |
| Titel | Waar-gebruikt-relaties bekijken en volgen |
| Type | CRUD-R |
| Status | Concept |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-15 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

Van een concrete STL-revisie naar bovenliggende gebruikende bestanden en de onderliggende CAD-bron navigeren, met Part-versioncontext.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | Engineer / maker |
| Overige actoren | PrintChill; externe CAD-/slicerapplicatie waar genoemd |

#### Trigger

Gebruiker kiest Where used op de Part-kaart of bij een documentversie.

#### Voorwaarden

- Documentversies en bekende bron-/gebruikrelaties zijn geïndexeerd.

#### Resultaat bij succes

- Een diagram toont gebruikende revisies boven de STL en de CAD-bron eronder, met lijnen; gebruiker kan een parent selecteren.

#### Garanties bij mislukking

- Bestaande Parts, versies, snapshots en rapporten blijven behouden.
- Invoer en selectie blijven waar mogelijk beschikbaar voor herstel; gedeeltelijke resultaten worden niet als volledig gepresenteerd.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Kiest Where used | Toont beschikbare documenten en vraagt een concrete versie te selecteren |
| 2 | Selecteert een STL-versie of CAD-partversie | Zoekt bekende 3MF-gebruikers of CAD-assemblygebruikers van die versie |
| 3 | Bekijkt het diagram | Toont per parent document en revisie boven de geselecteerde STL; toont concrete CAD-herkomst eronder, verbonden met lijnen |
| 4 | Klikt op een parent | Opent de bijbehorende Part-kaart met geselecteerde documentversie |
| 5 | Navigeert terug | Herstelt de oorspronkelijke versie en diagramcontext |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 1 | Vanuit een historische Part version gestart | Gebruikt de daarin vastgelegde versie | Verder bij stap 2 |
| A2 | 2 | Meerdere Parts delen een 3MF | Toont iedere geautoriseerde associatie | Verder bij stap 3 |
| A3 | 2 | Geen bekende gebruiker | Toont expliciet geen bekende relaties | Einde |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 2 | Index onvolledig of bron ambigu | Toont onbekend/onbevestigd afzonderlijk van bewezen relaties | Geen fictieve exacte match |
| E2 | 4 | Parent is ontoegankelijk of verwijderd | Toont toegestane foutinformatie | Huidige selectie blijft behouden |

#### Businessregels

- Relaties horen bij exacte versies, niet alleen bij namen of geometriegelijkenis.
- Gelijkende geometrie en dezelfde naam zijn suggesties; geen bewijs van gebruik.
- Dezelfde STL kan in meerdere 3MF-versies voorkomen.
- Snapshots worden alleen getoond als zij werkelijk naar de betrokken versies verwijzen.
- Een niet-ondersteunde assembly-parser of onvolledige index wordt zichtbaar vermeld.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Documentversie | Beginpunt | Expliciete ID |
| Gebruikt / geëxporteerd uit | Getypeerde relaties | Bewijs en broncontext zichtbaar |
| Snapshot | Baselinecontext | Concrete versieleden |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** alleen gegevens en acties tonen waarvoor de gebruiker rechten heeft; controle vindt ook server-side plaats.
- **Dataconsistentie:** concrete versies en herkomst behouden; conflicten expliciet afhandelen.
- **Gebruiksgemak en toegankelijkheid:** functies werken via toetsenbord en klik; hover is nooit de enige toegang.
- **Prestaties en grenzen:** schaal- en reactietijddoelen nog vast te stellen; geen ongefundeerde limieten.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-009-AC-01 | STL gebruikt in twee 3MF-versies | Where used geopend | Beide parentrevisies boven de STL zichtbaar en CAD-bron eronder, verbonden met lijnen | Niet uitgevoerd |
| UC-009-AC-02 | CAD-part met bekende assemblyrelatie | Where used uitgevoerd | Bovenliggende assemblyversie verschijnt | Niet uitgevoerd |
| UC-009-AC-03 | Oudere bronversie | Nieuwere versie bestaat | Query blijft op de gekozen oudere versie | Niet uitgevoerd |
| UC-009-AC-04 | Zelfde naam zonder bewezen relatie | Index doorzocht | Geen onterechte gebruiksrelatie | Niet uitgevoerd |
| UC-009-AC-05 | Klik op parent | Parent mag worden gelezen | Juiste Part-kaart en versiecontext openen | Niet uitgevoerd |
| UC-009-AC-06 | Onvolledige index | Geen match gevonden | Onvolledigheid zichtbaar; niet als bewezen ongebruikt weergegeven | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** [[#UC-002]], [[#UC-005]], [[#UC-011]], CAD-/3MF-indexering.
- **Buiten scope:** Automatische erkenning van onbekende geometrie en het wijzigen van bronrelaties vanuit het diagram.
- **Ontwerpbesluiten:** [[Architecture]], [[DJF]].
- **Planning:** [[ROADMAP]], volgorde nog af te stemmen.

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-009-Q-01 | Welke CAD-assemblyformaten ondersteunen we eerst? | Nog te bepalen | Open |
| UC-009-Q-02 | Hoe tonen we indexdekking en welk bewijs is voldoende voor een relatie? | Nog te bepalen | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-15 | UC-009-AC-01 t/m AC-06 | Niet uitgevoerd | Gebruikersworkflow uitgewerkt; geen app-test |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-15 | Concept volgens template; eerdere gebruikersinhoud behouden | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)


### UC-010

[Back to top](#inhoudsopgave)

**Titel:** Snapshot van documentversies vastleggen en raadplegen

> [!info] Aanvulling prototype 2
> Uitgesteld: snapshot wordt een latere baseliningfunctie. Geen verplichte dagelijkse stap, geen voorwaarde voor Print Reports. Eerst Part versions uit UC-011 implementeren; baseline-scope later herzien.

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-010 |
| Titel | Snapshot van documentversies vastleggen en raadplegen |
| Type | CRUD-C / CRUD-R |
| Status | Uitgesteld |
| Prioriteit | Nog te bepalen |
| Beoogde release | Nog te bepalen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-15 |
| Goedkeuring | Nog niet goedgekeurd |

#### Doel en waarde

Een combinatie van specifieke CAD-, STL- en 3MF-versies als onveranderlijke baseline bewaren en later exact terugvinden.

#### Actoren

| Rol | Betrokkenheid |
| --- | --- |
| Primaire actor | Engineer / maker |
| Overige actoren | PrintChill; externe CAD-/slicerapplicatie waar genoemd |

#### Trigger

Latere baseline-actie; bediening en scope worden opnieuw uitgewerkt. Het hoofdscenario hieronder is het eerdere voorstel, niet de huidige UI-workflow.

#### Voorwaarden

- Betrokken documentversies zijn geregistreerd en leesbaar.
- Gebruiker kan een combinatie kiezen; ontbrekende broninformatie moet zichtbaar zijn.

#### Resultaat bij succes

- Snapshot met unieke ID, geselecteerde versies en bronrelaties is opgeslagen en opnieuw raadpleegbaar.

#### Garanties bij mislukking

- Bestaande Parts, versies, snapshots en rapporten blijven behouden.
- Invoer en selectie blijven waar mogelijk beschikbaar voor herstel; gedeeltelijke resultaten worden niet als volledig gepresenteerd.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Kiest Snapshot vastleggen | Toont betrokken Parts, documenten en afzonderlijke versies |
| 2 | Selecteert CAD C, STL C en 3MF G | Toont de herkomst CAD C → STL C → 3MF G en eventuele open relaties |
| 3 | Controleert selectie en bevestigt ontbrekende broncontext | Valideert dat de concrete bronnen overeenstemmen; onbevestigde context blijft zichtbaar |
| 4 | Geeft een herkenbare naam en bevestigt | Slaat unieke snapshot-ID en combinatie atomair op |
| 5 | Opent later de snapshot | Toont exact de vastgelegde documentversies, ongeacht nieuwere versies |
| 6 | Kiest printproject openen | Biedt de vastgelegde 3MF-versie aan volgens UC-004 |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | 2 | Part heeft alleen gedownloade STL en een 3MF | Legt de beschikbare combinatie vast zonder CAD-bron te verzinnen | Verder bij stap 3 |
| A2 | 2 | 3MF bevat meerdere Parts | Gebruiker controleert alle betrokken bronversies en Parts | Verder bij stap 3 |
| A3 | 4 | Gebruiker annuleert | Geen snapshot aanmaken | Einde |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | 3 | Geselecteerde bronversies spreken geregistreerde relaties tegen | Vraagt correctie; geen tegenstrijdige baseline opslaan | Bestaande snapshots blijven intact |
| E2 | 4 | Opslag faalt of een bestand is nog in opbouw | Toont fout en bewaart selectie voor herstel | Geen gedeeltelijke snapshot als voltooid |
| E3 | 5–6 | Historisch bestand ontbreekt of rechten ontbreken | Toont expliciet welke vaste versie niet beschikbaar is | Nooit vervangen door latest |

#### Businessregels

- Snapshot is een baseline van een combinatie, geen afzonderlijke bestandsversie of iteratie.
- CAD, STL en 3MF hebben onafhankelijke versiereeksen; gelijke labels zijn niet vereist.
- Een snapshot legt versies en bronrelaties vast, niet verwijzingen naar latest.
- Nieuwe CAD D of 3MF H verandert een bestaande snapshot niet.
- Een snapshot bewijst niet dat de combinatie succesvol geprint is; een Print Report beschrijft die uitkomst.
- Status en overgangen zijn apart te ontwerpen.
- Een nieuwe combinatie krijgt een nieuwe snapshot; vastgelegde leden worden niet stilzwijgend aangepast.

#### Gegevens en relaties

| Gegeven | Gebruik | Validatie of invariant |
| --- | --- | --- |
| Snapshot | Unieke ID, naam, tijdstip en leden | Onveranderlijke concrete combinatie |
| Versieleden | Document-ID en versie-ID | Geen latest-verwijzingen |
| Bronrelaties | Herkomst per onderdeel | Onbekend/bevestigd expliciet |
| Print Report | Hoort direct bij een Part version (UC-003) | Geen snapshot nodig |

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** alleen gegevens en acties tonen waarvoor de gebruiker rechten heeft; controle vindt ook server-side plaats.
- **Dataconsistentie:** concrete versies en herkomst behouden; conflicten expliciet afhandelen.
- **Gebruiksgemak en toegankelijkheid:** functies werken via toetsenbord en klik; hover is nooit de enige toegang.
- **Prestaties en grenzen:** schaal- en reactietijddoelen nog vast te stellen; geen ongefundeerde limieten.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-010-AC-01 | CAD C, STL C, 3MF G | Snapshot bevestigd | Alle drie exacte versies zijn onder één snapshot-ID bewaard | Niet uitgevoerd |
| UC-010-AC-02 | Nieuwe CAD D en 3MF H | Oude snapshot geopend | Blijft CAD C, STL C en 3MF G tonen | Niet uitgevoerd |
| UC-010-AC-03 | 3MF met meerdere Parts | Snapshot vastgelegd | Alle geselecteerde Part-/bronrelaties blijven herkenbaar | Niet uitgevoerd |
| UC-010-AC-04 | STL zonder bekende CAD | Combinatie vastgelegd | Geen fictieve CAD-relatie; ontbrekende herkomst zichtbaar | Niet uitgevoerd |
| UC-010-AC-05 | Opslagfout of annuleren | Gebruiker bevestigt of annuleert | Geen gedeeltelijke/ongewenste snapshot | Niet uitgevoerd |
| UC-010-AC-06 | Snapshot zonder printbewijs | Snapshot wordt getoond | Geen automatisch succes of printed-status geclaimd | Niet uitgevoerd |
| UC-010-AC-07 | Ontbrekende oude 3MF | Gebruiker opent snapshot | Fout voor die versie; geen automatische vervanging | Niet uitgevoerd |

#### Afhankelijkheden en afbakening

- **Afhankelijk van:** [[#UC-002]], [[#UC-004]], [[#UC-005]], [[Architecture]]. Print Reports via [[#UC-003]].
- **Buiten scope:** Snapshotleden wijzigen, statusworkflow en automatische bevestiging van printsucces.
- **Ontwerpbesluiten:** [[Architecture]], [[DJF]].
- **Planning:** [[ROADMAP]], volgorde nog af te stemmen.

#### Open vragen en aannames

| ID | Vraag of aanname | Eigenaar | Status en besluit |
| --- | --- | --- | --- |
| UC-010-Q-01 | Welke naamgeving en nummernotatie krijgen snapshots? | Nog te bepalen | Open |
| UC-010-Q-02 | Welke minimale documentcombinaties staan we toe naast STL + 3MF? | Nog te bepalen | Open |
| UC-010-Q-03 | Hoe worden onvolledige bronrelaties bevestigd en gemarkeerd? | Nog te bepalen | Open |

#### Verificatieresultaat

| Datum | Acceptatiecriteria | Controle en resultaat | Bewijs of beperking |
| --- | --- | --- | --- |
| 2026-11-15 | UC-010-AC-01 t/m AC-07 | Niet uitgevoerd | Gebruikersworkflow uitgewerkt; geen app-test |

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-15 | Concept volgens template; eerdere gebruikersinhoud behouden | Gebruiker, redactie Codex |

[Back to top](#inhoudsopgave)


### UC-011

[Back to top](#inhoudsopgave)

**Titel:** Part versions en logbook beheren

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-011 |
| Titel | Part versions en logbook beheren |
| Type | CRUD-C / CRUD-R |
| Status | Concept |
| Prioriteit | Must |
| Beoogde release | UI-prototype 2; productie nog te plannen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-15 |
| Goedkeuring | Feedback gebruiker; implementatieacceptatie open |

#### Doel en waarde

Een Part number houdt een chronologische historie van vaste bestandscombinaties bij, zonder snapshot als dagelijkse extra laag.

#### Actoren

Engineer / maker (primair); Printchill (systeem).

#### Trigger

Gebruiker opent het Part en kiest de betreffende tab of wijzigingsactie.

#### Voorwaarden

Een Part number en geregistreerde documentrevisies zijn beschikbaar; gebruiker heeft passende rechten.

#### Resultaat bij succes

Historie en exacte versiecontext zijn raadpleegbaar zonder oudere gegevens te overschrijven.

#### Garanties bij mislukking

Bestaande versies blijven intact; geen gedeeltelijke registratie of onterechte nummerverhoging.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Opent Part | Toont Part number en version 001 of gekozen historische versie |
| 2 | Kiest bestandswijzigingen registreren | Toont huidige revisies en commentvelden per bestand |
| 3 | Wijzigt één of meer bestanden en bevestigt | Verhoogt gewijzigde letterrevisies; maakt atomair de volgende numerieke Part version |
| 4 | Opent Logbook | Toont een git-achtige lijn met bolletjes, versienummers en eerste commentzin |
| 5 | Klikt versiebolletje | Vouwt een ballon met exacte bestanden, revisies en comments uit |
| 6 | Selecteert historische versie | Kaart, viewer, reports en attachments tonen die versiecontext |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | Opslaan | Gebruiker annuleert | Geen mutatie | Oorspronkelijke context blijft |
| A2 | Selectie | Historische Part version gekozen | Toont exact die context | Geen vervanging door latest |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | Opslaan | Ongeldige invoer of opslagfout | Toon reden en behoud invoer | Geen gedeeltelijke versie |
| E2 | Openen | Bestand ontbreekt / geen rechten | Toon onbeschikbaarheid | Geen stille vervanging |

#### Businessregels

- Nummer begint bij 001; één bevestigde wijzigingsactie verhoogt eenmaal, ook bij meerdere bestanden.
- CAD, STL en 3MF hebben onafhankelijke letterrevisies; revisieletters bewijzen geen bronrelatie.
- Bestandsinhoud ongewijzigd: geen nieuwe Part version. Toevoegen/vervangen/verwijderen van beheerde ontwerpbestanden geldt als wijziging.
- Report, attachment of Git-verwijzing toevoegen/wijzigen verhoogt de Part version niet.
- Geen history rewrite of vertakking in deze eerste proef; nieuwe wijzigingen baseren op de actuele versie.
- Comments zijn per gewijzigd bestand mogelijk. Zonder comment verschijnt een feitelijke wijzigingssamenvatting.
- UI is Engels; Part number krijgt een prominent label.

#### Gegevens en relaties

Part number → Part version → exacte documentrevisies. Reports en attachments refereren de onveranderlijke Part version-ID. Logbook bewaart auteur, tijdstip en comments per gewijzigd bestand.

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** productiecontrole ook server-side; UI-demo heeft geen accounts.
- **Dataconsistentie:** versie-ID’s gebruiken; historische context blijft vast.
- **Gebruiksgemak en toegankelijkheid:** toetsenbord en klik; geen hover-afhankelijkheid.
- **Prestaties en grenzen:** prototypegrenzen expliciet, productiegrenzen nog te bepalen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-011-AC-01 | Nieuw Part | Registratie voltooid | Version 001 zichtbaar | Prototypecontrole |
| UC-011-AC-02 | Version 003 | Alleen 3MF G verandert | Version 004 bevat 3MF H en ongewijzigde CAD/STL | Prototypecontrole |
| UC-011-AC-03 | Actuele versie | CAD en STL samen wijzigen | Eén nieuwe Part version bij hetzelfde Part number, beide file-comments zichtbaar | Prototypecontrole |
| UC-011-AC-04 | Oude versie | Nieuwere versie bestaat | Oude bestanden en kaartgegevens blijven exact gelijk | Prototypecontrole |
| UC-011-AC-05 | Geen bestandswijziging | Bevestigen | Geen versieverhoging | Prototypecontrole |
| UC-011-AC-06 | Logbook | Bolletje via klik/toetsenbord geopend | Ballon toont exacte revisies en comments | Prototypecontrole |

#### Afhankelijkheden en afbakening

Afhankelijk van UC-002/005 en [[Architecture]]. UI-demo gebruikt geheugenopslag; productieopslag, connectors en automatische detectie vallen buiten deze proef.

#### Open vragen en aannames

- Gedrag na 999 en letterrevisie Z nog uit te werken; prototype blokkeert ongedefinieerde overloop.
- Werkelijke inhoudsdetectie/hashbeleid en gelijktijdige wijzigingen: productieontwerp open.

#### Verificatieresultaat

Prototypecontroles worden vastgelegd in [design-qa](../prototype/design-qa.md); volledige productieacceptatie is niet uitgevoerd.

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-15 | Gebruikersfeedback verwerkt | Codex |

[Back to top](#inhoudsopgave)

### UC-012

[Back to top](#inhoudsopgave)

**Titel:** Attachments en softwareverwijzingen per Part version beheren

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-012 |
| Titel | Attachments en softwareverwijzingen per Part version beheren |
| Type | CRUD-C / CRUD-R |
| Status | Concept |
| Prioriteit | Must |
| Beoogde release | UI-prototype 2; productie nog te plannen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-15 |
| Goedkeuring | Feedback gebruiker; implementatieacceptatie open |

#### Doel en waarde

Instructies, schema’s en een vastgelegde softwareversie direct bij de juiste ontwerpversie terugvinden.

#### Actoren

Engineer / maker (primair); Printchill (systeem).

#### Trigger

Gebruiker opent het Part en kiest de betreffende tab of wijzigingsactie.

#### Voorwaarden

Een Part number en geregistreerde documentrevisies zijn beschikbaar; gebruiker heeft passende rechten.

#### Resultaat bij succes

Historie en exacte versiecontext zijn raadpleegbaar zonder oudere gegevens te overschrijven.

#### Garanties bij mislukking

Bestaande versies blijven intact; geen gedeeltelijke registratie of onterechte nummerverhoging.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Kiest Part version en Attachments | Toont alleen bijlagen van deze versie |
| 2 | Uploadt instructie of schema | Valideert bestand en koppelt aan de gekozen versie |
| 3 | Voegt Git-repository-URL en softwareversie toe | Valideert URL en bewaart repository plus commit/ref |
| 4 | Bevestigt | Bijlage beschikbaar; Part version en Logbook veranderen niet |
| 5 | Opent andere Part version | Toont alleen haar eigen attachments |

#### Alternatieve scenario’s

| ID | Aftakking vanaf stap | Voorwaarde | Verloop | Eindtoestand of hervatting |
| --- | --- | --- | --- | --- |
| A1 | Opslaan | Gebruiker annuleert | Geen mutatie | Oorspronkelijke context blijft |
| A2 | Selectie | Historische Part version gekozen | Toont exact die context | Geen vervanging door latest |

#### Fouten en uitzonderingen

| ID | Vanaf stap | Foutconditie | Systeemreactie en herstel | Gevolg voor gegevens |
| --- | --- | --- | --- | --- |
| E1 | Opslaan | Ongeldige invoer of opslagfout | Toon reden en behoud invoer | Geen gedeeltelijke versie |
| E2 | Openen | Bestand ontbreekt / geen rechten | Toon onbeschikbaarheid | Geen stille vervanging |

#### Businessregels

- Bijlagen en Git-verwijzingen zijn ondersteunende data, geen beheerde ontwerpbestanden voor versietriggers.
- Uploads en links worden aan de geselecteerde Part version gekoppeld, ook aan een historische versie.
- Geen stilzwijgende overerving van bijlagen naar een nieuwe versie in de proef.
- Git-URL alleen http(s). Commit-SHA legt een exacte softwareversie vast; branch/tag wordt als veranderlijk gemarkeerd.
- Downloads behouden bestandsnaam; bestanden worden niet automatisch uitgevoerd.
- Toevoegen of wijzigen veroorzaakt geen nieuwe Part version.

#### Gegevens en relaties

Part number → Part version → exacte documentrevisies. Reports en attachments refereren de onveranderlijke Part version-ID. Logbook bewaart auteur, tijdstip en comments per gewijzigd bestand.

#### Rechten en kwaliteitsvoorwaarden

- **Toegang:** productiecontrole ook server-side; UI-demo heeft geen accounts.
- **Dataconsistentie:** versie-ID’s gebruiken; historische context blijft vast.
- **Gebruiksgemak en toegankelijkheid:** toetsenbord en klik; geen hover-afhankelijkheid.
- **Prestaties en grenzen:** prototypegrenzen expliciet, productiegrenzen nog te bepalen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-012-AC-01 | Version 003 | Bestand toegevoegd | Downloadbaar bij 003, geen nieuwe Part version | Prototypecontrole |
| UC-012-AC-02 | Bijlage bij 003 | 002 geselecteerd | Bijlage niet zichtbaar | Prototypecontrole |
| UC-012-AC-03 | Repo + commit-SHA | Link toegevoegd | Repo, commit en versiecontext terugleesbaar; nummer gelijk | Prototypecontrole |
| UC-012-AC-04 | Ongeldige URL | Link toevoegen | Fout en geen registratie | Prototypecontrole |

#### Afhankelijkheden en afbakening

Afhankelijk van UC-002/005 en [[Architecture]]. UI-demo gebruikt geheugenopslag; productieopslag, connectors en automatische detectie vallen buiten deze proef.

#### Open vragen en aannames

- Overerving, verwijderen, bijlagewijzigingshistorie, productieviruscontrole en limieten later uitwerken.

#### Verificatieresultaat

Prototypecontroles worden vastgelegd in [design-qa](../prototype/design-qa.md); volledige productieacceptatie is niet uitgevoerd.

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-15 | Gebruikersfeedback verwerkt | Codex |

[Back to top](#inhoudsopgave)


## UC#13 - Part Compare

1;engineer heeft een part gevonden
2; opent de card. en krijg standaard de latest version te zien.
3; engineer gaat naar logbook om historie te bekijken.
4; wil weten wat verschil is tussen de 2 laatste versies. (note; dit kan ook met meerdere versie bijvoorbeeld van de 12 versies, 1e de 3e en de 10e en laatste)
5; klikt checkbox aan voor de versie en klikt op compare
6; een nieuw scherm opent met;
	a; links de oude , rechts de laatste versie
	b; 2 3D modellen (STL's) over elkaar heen geprojecteerd, de oude versie is transparant gemaakt , de laatste niet. hierdoor zie je duidelijk de verschillen in design.
	c; een overzicht met de related files (STL, 3MF, CAD) revisies deltas (als ze er zijn)
	c; daaronder 1 tabel met 1st colom alle part attributes, kolom 2; attribute waarde oud part , kolom 3 attributes laatste versie. de cellen die anders zijn , zijn ge-high light.


## UC#14 - omgang met samenstellingen (assy's)

assy's bestaan in de CAD, en zijn erg dominant in klassieke PDM systemen.
echter in PRC gaat hem op de parts, die print je immers en wil je daarom managen. de samenstelling zou hier als volgt in kunnen passen.
je hebt een part die aan de CAD assy is gekoppeld. op dit nivea kan een overkoepelend 3MF file met alle plates die alle assy parts bevat gemaakt zijn en gekoppeld.
dan krijg je:


1234-5678 robotic upper arm assy
	gekoppelde aan part version:
	- 3MF met 6 platen en heel veel parts (alle child parts)
	- 1234-5678 upper arm .asm file is wel op deze assy card gekoppeld
	- een STL op assy niveau kan er ook zijn, maar dat is zelden nuttig.
	
	verdere info op dit assembly part te vinden:
	- alle STL's die zijn weer aan de 3MF gekoppeld maar zie je niet op deze part card terug, wel op part card van de child components via de where used een link naar deze 3MF file.
	- de (child) parts in die assembly zijn weer op de part structure tab terug te vinden
	
	


### UC-013

[Back to top](#inhoudsopgave)

**Titel:** Samplebestanden en assemblycomponenten inspecteren

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-013 |
| Titel | Samplebestanden en assemblycomponenten inspecteren |
| Type | CRUD-C / CRUD-R |
| Status | In uitvoering — UI-prototype |
| Prioriteit | Must |
| Beoogde release | Prototype v4; productie nog te plannen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-17 |
| Goedkeuring | Gebruikersopdracht; productieacceptatie open |

#### Doel en waarde

Bestanden, revisies en verklaarde bronrelaties uit samples raadplegen; onbewezen CAD-relaties blijven onzeker.

#### Actoren

Engineer / maker (primair); Printchill; voor native assembly-extractie SolidWorks 2026 op Windows.

#### Trigger

Gebruiker selecteert een part/project/assembly.

#### Voorwaarden

Samples of geregistreerde Parts zijn beschikbaar; gebruiker heeft toegang tot de lokale bestanden.

#### Resultaat bij succes

Toont de opgegeven hiërarchie, configuraties en suppressed/unresolved-componenten; meldt de extractiescope en bronverificatie.

#### Garanties bij mislukking

Geen overschrijven van bronbestanden of bestaande historische versies; fout en onvolledigheid expliciet.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Selecteert een Part/project/assembly | Toont bronbestanden, hashes, 3MF-objecten met platen en filamenten; koppelt aanwezige lokale bestanden op expliciete naam met onzekerheidslabel. |
| 2 | Importeert een SolidWorks-assemblymanifest | Toont de opgegeven hiërarchie, configuraties en suppressed/unresolved-componenten; meldt de extractiescope en bronverificatie. |
| 3 | Raadpleegt historische context | Behoudt concrete bronbestanden en revisies |

#### Alternatieve scenario’s

- A1: annuleert; geen ongewenste mutatie, bestaande conceptinvoer blijft beschikbaar.
- A2: bron ontbreekt of relatie onzeker; toont beperking en beschikbare gedeeltelijke informatie.

#### Fouten en uitzonderingen

- E1: ongeldige invoer of manifest; geen gedeeltelijke publicatie, fout met herstelactie.
- E2: lokale opslag niet beschikbaar; meldt dat gegevens nog niet veilig bewaard zijn en biedt export/herhalen.

#### Businessregels

- SLDASM zonder ondersteunde extractor blijft structure unavailable; geen kindcomponenten verzinnen. FreeCAD Group/Link is geen SolidWorks-bewijs.
- A/B-bestanden houden hun eigen geometrie; CAD/STL-naamovereenkomst is geen bewezen exportrelatie.
- Engels als UI-basistaal. Toetsenbordbediening, zichtbare labels, voldoende contrast en aanvullende hover-/focustooltips.

#### Gegevens en relaties

Part number → Part version → exacte documentrevisies; bronnen en zekerheid bij relaties blijven afzonderlijk vastgelegd.

#### Rechten en kwaliteitsvoorwaarden

Read-only bronanalyse; lokale prototypeopslag zonder serveraccounts. Geen volledige CAD-engine of rechtenmodel claimen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-013-AC-01 | Geldige broncontext | Hoofdscenario doorlopen | Verwacht resultaat met juiste versiecontext | Prototype-/browsertests |
| UC-013-AC-02 | Onbekende bron of fout | Actie uitgevoerd | Geen verzonnen of gedeeltelijk als volledig gepresenteerde data | Prototype-/browsertests |
| UC-013-AC-03 | Bestaande historie | Nieuwe aanvullende actie | Historische bestanden blijven onveranderd | Prototype-/browsertests |

#### Afhankelijkheden en afbakening

[[Architecture]], [[UI_DESIGN_REVIEW]], UC-006/009/011/012. Geen automatische CAD-rebuild, slicing, geometrische tolerantieberekening of cloudsync in deze proef.

#### Open vragen en aannames

Productieopslag, multi-userconflicten, licentie-/extractorcapabilities en volledige toegankelijke CAD-interactie blijven vervolgwerk.

#### Verificatieresultaat

Zie prototype/design-qa.md; native SolidWorks-macro kan alleen op Windows/SolidWorks worden geverifieerd.

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-17 | Sampleanalyse en UI-reviewverwerking beschreven | Codex |

[Back to top](#inhoudsopgave)

### UC-014

[Back to top](#inhoudsopgave)

**Titel:** Part versions vergelijken en efficiënt doorzoeken

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-014 |
| Titel | Part versions vergelijken en efficiënt doorzoeken |
| Type | CRUD-C / CRUD-R |
| Status | In uitvoering — UI-prototype |
| Prioriteit | Must |
| Beoogde release | Prototype v4; productie nog te plannen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-17 |
| Goedkeuring | Gebruikersopdracht; productieacceptatie open |

#### Doel en waarde

Veel Parts in een sorteerbare tabel bekijken en twee vaste versies naast elkaar beoordelen.

#### Actoren

Engineer / maker (primair); Printchill; voor native assembly-extractie SolidWorks 2026 op Windows.

#### Trigger

Gebruiker kiest raster of tabel, sortering en filters.

#### Voorwaarden

Samples of geregistreerde Parts zijn beschikbaar; gebruiker heeft toegang tot de lokale bestanden.

#### Resultaat bij succes

Toont toegevoegde/gewijzigde bestanden en 3MF-parameters, plus beschikbare echte STL-previews.

#### Garanties bij mislukking

Geen overschrijven van bronbestanden of bestaande historische versies; fout en onvolledigheid expliciet.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Kiest raster of tabel, sortering en filters | Behoudt geselecteerde versiecontext en toont kolommen/zoekcriteria. |
| 2 | Kiest Compare en twee versies | Toont toegevoegde/gewijzigde bestanden en 3MF-parameters, plus beschikbare echte STL-previews. |
| 3 | Raadpleegt historische context | Behoudt concrete bronbestanden en revisies |

#### Alternatieve scenario’s

- A1: annuleert; geen ongewenste mutatie, bestaande conceptinvoer blijft beschikbaar.
- A2: bron ontbreekt of relatie onzeker; toont beperking en beschikbare gedeeltelijke informatie.

#### Fouten en uitzonderingen

- E1: ongeldige invoer of manifest; geen gedeeltelijke publicatie, fout met herstelactie.
- E2: lokale opslag niet beschikbaar; meldt dat gegevens nog niet veilig bewaard zijn en biedt export/herhalen.

#### Businessregels

- Ontbrekende historische geometrie blijft expliciet onbekend; geen mesh-afwijkingsanalyse claimen.
- Een vergelijking verandert geen document of Part version.
- Engels als UI-basistaal. Toetsenbordbediening, zichtbare labels, voldoende contrast en aanvullende hover-/focustooltips.

#### Gegevens en relaties

Part number → Part version → exacte documentrevisies; bronnen en zekerheid bij relaties blijven afzonderlijk vastgelegd.

#### Rechten en kwaliteitsvoorwaarden

Read-only bronanalyse; lokale prototypeopslag zonder serveraccounts. Geen volledige CAD-engine of rechtenmodel claimen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-014-AC-01 | Geldige broncontext | Hoofdscenario doorlopen | Verwacht resultaat met juiste versiecontext | Prototype-/browsertests |
| UC-014-AC-02 | Onbekende bron of fout | Actie uitgevoerd | Geen verzonnen of gedeeltelijk als volledig gepresenteerde data | Prototype-/browsertests |
| UC-014-AC-03 | Bestaande historie | Nieuwe aanvullende actie | Historische bestanden blijven onveranderd | Prototype-/browsertests |

#### Afhankelijkheden en afbakening

[[Architecture]], [[UI_DESIGN_REVIEW]], UC-006/009/011/012. Geen automatische CAD-rebuild, slicing, geometrische tolerantieberekening of cloudsync in deze proef.

#### Open vragen en aannames

Productieopslag, multi-userconflicten, licentie-/extractorcapabilities en volledige toegankelijke CAD-interactie blijven vervolgwerk.

#### Verificatieresultaat

Zie prototype/design-qa.md; native SolidWorks-macro kan alleen op Windows/SolidWorks worden geverifieerd.

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-17 | Sampleanalyse en UI-reviewverwerking beschreven | Codex |

[Back to top](#inhoudsopgave)

### UC-015

[Back to top](#inhoudsopgave)

**Titel:** Werk en rapportconcepten lokaal bewaren en herstellen

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-015 |
| Titel | Werk en rapportconcepten lokaal bewaren en herstellen |
| Type | CRUD-C / CRUD-R |
| Status | In uitvoering — UI-prototype |
| Prioriteit | Must |
| Beoogde release | Prototype v4; productie nog te plannen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-17 |
| Goedkeuring | Gebruikersopdracht; productieacceptatie open |

#### Doel en waarde

Browserherladen en sluiten van een dialoog veroorzaken geen stil verlies van geregistreerde data of concepts.

#### Actoren

Engineer / maker (primair); Printchill; voor native assembly-extractie SolidWorks 2026 op Windows.

#### Trigger

Gebruiker wijzigt workspace of vult rapportconcept in.

#### Voorwaarden

Samples of geregistreerde Parts zijn beschikbaar; gebruiker heeft toegang tot de lokale bestanden.

#### Resultaat bij succes

Herstelt Part versions, rapporten, attachments, zoekopdrachten en concepts; biedt export als reservekopie.

#### Garanties bij mislukking

Geen overschrijven van bronbestanden of bestaande historische versies; fout en onvolledigheid expliciet.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Wijzigt workspace of vult rapportconcept in | Bewaart lokaal met expliciete opslagstatus en behandelt schrijffouten. |
| 2 | Herlaadt of opent de dialoog opnieuw | Herstelt Part versions, rapporten, attachments, zoekopdrachten en concepts; biedt export als reservekopie. |
| 3 | Raadpleegt historische context | Behoudt concrete bronbestanden en revisies |

#### Alternatieve scenario’s

- A1: annuleert; geen ongewenste mutatie, bestaande conceptinvoer blijft beschikbaar.
- A2: bron ontbreekt of relatie onzeker; toont beperking en beschikbare gedeeltelijke informatie.

#### Fouten en uitzonderingen

- E1: ongeldige invoer of manifest; geen gedeeltelijke publicatie, fout met herstelactie.
- E2: lokale opslag niet beschikbaar; meldt dat gegevens nog niet veilig bewaard zijn en biedt export/herhalen.

#### Businessregels

- Lokaal is niet serveropslag; opslagquota en privébrowser kunnen behoud beperken. Geen succesmelding na mislukte opslag.
- Concepten en attachments wijzigen geen Part version. Reset vereist bevestiging.
- Engels als UI-basistaal. Toetsenbordbediening, zichtbare labels, voldoende contrast en aanvullende hover-/focustooltips.

#### Gegevens en relaties

Part number → Part version → exacte documentrevisies; bronnen en zekerheid bij relaties blijven afzonderlijk vastgelegd.

#### Rechten en kwaliteitsvoorwaarden

Read-only bronanalyse; lokale prototypeopslag zonder serveraccounts. Geen volledige CAD-engine of rechtenmodel claimen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-015-AC-01 | Geldige broncontext | Hoofdscenario doorlopen | Verwacht resultaat met juiste versiecontext | Prototype-/browsertests |
| UC-015-AC-02 | Onbekende bron of fout | Actie uitgevoerd | Geen verzonnen of gedeeltelijk als volledig gepresenteerde data | Prototype-/browsertests |
| UC-015-AC-03 | Bestaande historie | Nieuwe aanvullende actie | Historische bestanden blijven onveranderd | Prototype-/browsertests |

#### Afhankelijkheden en afbakening

[[Architecture]], [[UI_DESIGN_REVIEW]], UC-006/009/011/012. Geen automatische CAD-rebuild, slicing, geometrische tolerantieberekening of cloudsync in deze proef.

#### Open vragen en aannames

Productieopslag, multi-userconflicten, licentie-/extractorcapabilities en volledige toegankelijke CAD-interactie blijven vervolgwerk.

#### Verificatieresultaat

Zie prototype/design-qa.md; native SolidWorks-macro kan alleen op Windows/SolidWorks worden geverifieerd.

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-17 | Sampleanalyse en UI-reviewverwerking beschreven | Codex |

[Back to top](#inhoudsopgave)

### UC-016

[Back to top](#inhoudsopgave)

**Titel:** Design state en maturity toepassen

#### Metadata

| Veld | Waarde |
| --- | --- |
| ID | UC-016 |
| Titel | Design state en maturity toepassen |
| Type | CRUD-C / CRUD-R |
| Status | In uitvoering — UI-prototype |
| Prioriteit | Must |
| Beoogde release | Prototype v4; productie nog te plannen |
| Eigenaar | Nog te bepalen |
| Documentrevisie | 0.1 |
| Laatst gewijzigd | 2026-11-17 |
| Goedkeuring | Gebruikersopdracht; productieacceptatie open |

#### Doel en waarde

Het bestaande statusbeleid herkenbaar maken zonder het versiebeleid te veranderen.

#### Actoren

Engineer / maker (primair); Printchill; voor native assembly-extractie SolidWorks 2026 op Windows.

#### Trigger

Gebruiker opent lifecycle bij een part.

#### Voorwaarden

Samples of geregistreerde Parts zijn beschikbaar; gebruiker heeft toegang tot de lokale bestanden.

#### Resultaat bij succes

Valideert de architectuurmapping; Released vraagt bevestiging; Obsolete/End of life blokkeert wijzigen en biedt kopiëren naar nieuw Part number.

#### Garanties bij mislukking

Geen overschrijven van bronbestanden of bestaande historische versies; fout en onvolledigheid expliciet.

#### Hoofdscenario

| Stap | Actoractie | Systeemgedrag |
| --- | --- | --- |
| 1 | Opent Lifecycle bij een Part | Toont aparte design state en maturity met herkomst: lokaal toegekend, geen CAD-extractie. |
| 2 | Bevestigt een toegestane overgang of een bestandswijziging | Valideert de architectuurmapping; Released vraagt bevestiging; Obsolete/End of life blokkeert wijzigen en biedt kopiëren naar nieuw Part number. |
| 3 | Raadpleegt historische context | Behoudt concrete bronbestanden en revisies |

#### Alternatieve scenario’s

- A1: annuleert; geen ongewenste mutatie, bestaande conceptinvoer blijft beschikbaar.
- A2: bron ontbreekt of relatie onzeker; toont beperking en beschikbare gedeeltelijke informatie.

#### Fouten en uitzonderingen

- E1: ongeldige invoer of manifest; geen gedeeltelijke publicatie, fout met herstelactie.
- E2: lokale opslag niet beschikbaar; meldt dat gegevens nog niet veilig bewaard zijn en biedt export/herhalen.

#### Businessregels

- Statusmetadata veroorzaakt geen bestandsversieverhoging; historische bestandsreferenties blijven vast.
- Statusbeleid volgt Architecture. Ontbrekende leveranciersstatussen worden niet uit bestandsnamen verzonnen.
- Engels als UI-basistaal. Toetsenbordbediening, zichtbare labels, voldoende contrast en aanvullende hover-/focustooltips.

#### Gegevens en relaties

Part number → Part version → exacte documentrevisies; bronnen en zekerheid bij relaties blijven afzonderlijk vastgelegd.

#### Rechten en kwaliteitsvoorwaarden

Read-only bronanalyse; lokale prototypeopslag zonder serveraccounts. Geen volledige CAD-engine of rechtenmodel claimen.

#### Acceptatiecriteria

| ID | Gegeven | Wanneer | Dan | Verificatie |
| --- | --- | --- | --- | --- |
| UC-016-AC-01 | Geldige broncontext | Hoofdscenario doorlopen | Verwacht resultaat met juiste versiecontext | Prototype-/browsertests |
| UC-016-AC-02 | Onbekende bron of fout | Actie uitgevoerd | Geen verzonnen of gedeeltelijk als volledig gepresenteerde data | Prototype-/browsertests |
| UC-016-AC-03 | Bestaande historie | Nieuwe aanvullende actie | Historische bestanden blijven onveranderd | Prototype-/browsertests |

#### Afhankelijkheden en afbakening

[[Architecture]], [[UI_DESIGN_REVIEW]], UC-006/009/011/012. Geen automatische CAD-rebuild, slicing, geometrische tolerantieberekening of cloudsync in deze proef.

#### Open vragen en aannames

Productieopslag, multi-userconflicten, licentie-/extractorcapabilities en volledige toegankelijke CAD-interactie blijven vervolgwerk.

#### Verificatieresultaat

Zie prototype/design-qa.md; native SolidWorks-macro kan alleen op Windows/SolidWorks worden geverifieerd.

#### Wijzigingshistorie

| Documentrevisie | Datum | Wijziging | Auteur |
| --- | --- | --- | --- |
| 0.1 | 2026-11-17 | Sampleanalyse en UI-reviewverwerking beschreven | Codex |

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


## Doel en scope

Begrippen en datamodel: [[Architecture]]. **Part version** is de numerieke vaste bestandscombinatie (001…). **Documentrevisie** is een letter voor één bestand. **Snapshot** is uitgesteld als latere baseliningfunctie. **Print Report** beschrijft één printpoging bij een exacte Part version zonder versieverhoging.


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
