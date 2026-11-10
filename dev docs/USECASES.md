# PrintChill — Use cases

## Inhoudsopgave

- [Doel en scope](#doel-en-scope)
- [Werkwijze](#werkwijze)
- [Identificatie en traceerbaarheid](#identificatie-en-traceerbaarheid)
- [Status en prioriteit](#status-en-prioriteit)
- [Use-caseregister](#use-caseregister)
- [UC-001 — SolidWorks-metadata read-only naar JSON exporteren](#uc-001)
- [Volledig use-casetemplate](#volledig-use-casetemplate)
  - [UC-XXX — Template: werkwoord + gebruikersdoel](#uc-xxx)
- [Controle vóór implementatie](#controle-vóór-implementatie)

Nieuwe use cases worden hier met hun eigen ID en titel toegevoegd zodra ze zijn uitgewerkt.

Dit document bevat de use cases van PrintChill en vormt de basis voor scope, ontwerp, implementatie en verificatie.

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

| Prioriteit | Betekenis |
| --- | --- |
| Must | Nodig voor het afgesproken doel van de betreffende release |
| Should | Belangrijk, maar de release kan zonder functioneren |
| Could | Wenselijk als tijd en ruimte beschikbaar zijn |
| Won’t deze release | Bewust buiten de betreffende release gehouden |
| Nog te bepalen | Nog niet geprioriteerd |

## Use-caseregister

Voeg hier bij elke nieuwe use case een rij toe en gebruik hetzelfde ID in de detailbeschrijving.

| ID | Titel | Primaire actor | Status | Prioriteit | Release | Afhankelijkheden |
| --- | --- | --- | --- | --- | --- | --- |
| UC-001 | SolidWorks-metadata read-only naar JSON exporteren | CAD-gebruiker | In uitvoering | Must | Metadata-POC | SolidWorks Design Premium 2026 SP0, Windows 64-bit |

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

## Controle vóór implementatie

- Het doel, de actoren, trigger en voorwaarden zijn duidelijk.
- Het succespad, relevante alternatieven en fouten zijn beschreven.
- Gegevensrelaties, revisiegedrag en toegangsrechten zijn expliciet waar van toepassing.
- Acceptatiecriteria zijn toetsbaar en hebben unieke ID’s.
- Blokkerende vragen zijn opgelost; resterende aannames zijn zichtbaar.
- Prioriteit, afhankelijkheden, status en planning zijn consistent met het register en de roadmap.
- Er is een implementatieplan met een afweging van impact en ontwerpkeuzes, conform [[AGENT]].
