# PrintChill — Roadmap

## MVP 0.2.0 — bibliotheek, zoeken en herstel

- UC-006: kaarten en sorteerbare tabel op workspacegegevens, versiegebonden STL-inspectie met afmetingen en printdetails uit de geselecteerde 3MF.
- UC-008: naam, nummer, tags en materiaal combineren, filters op bestandstype en printpoging, zoekcriteria lokaal bewaren en opnieuw uitvoeren.
- UC-015: back-up beoordelen en Part-nummers na bevestiging samenvoegen; apart openen blijft beschikbaar. Een eerste opening van schema 1 maakt een migratieback-up.
- Pilotcontrole: open een workspace uit 0.1.1, vind een Part via kaart én zoekopdracht, controleer een historische revisie in Bambu en herstel een back-up met overlappende nummers. Gebruik een testworkspace bij het beoordelen van vervanging.

## Windows-MVP — van eerste import tot reproduceerbare print

Voorstel voor één gebruiker per lokale workspace. UC-018 is de acceptatieproef voor de release. Elke fase levert een testbaar onderdeel via de bestaande web-UI.

| Volgorde | Scope | Klaar wanneer |
| --- | --- | --- |
| 1. Installeren en starten | Lokale backend, gebundelde UI, SQLite, Settings en workspace openen/aanmaken (basis UC-015). | Een standaardgebruiker start PRC op een schone Windows-pc, kiest een map en opent die na herstart opnieuw. |
| 2. Registreren en terugvinden | UC-017, Part-aanmaak uit UC-002, kaart en bibliotheek uit UC-006, versie 001 uit UC-011. | Een echte STL en 3MF verschijnen op één kaart. Ook STL-only import werkt. Na verplaatsing van de bronmap zijn de beheerde bestanden beschikbaar. |
| 3. Dagelijks reviseren | Bambu-pad uit UC-004, bevestiging uit UC-005, logbook uit UC-011 en detectie uit UC-018. | Start Bambu Studio met de gekozen werkkopie; test herhaalde saves, vervangen van het bestand, dubbel bevestigen, herstart en een verouderde basisversie. |
| 4. Printbewijs en herstel | Minimaal Print Report uit UC-003 (poging, datum, uitkomst, notitie, exacte Part version); back-up/herstel uit UC-015. | Het rapport op 001 opent na registratie van 002 én na herstel op een andere installatie byte-identiek de oorspronkelijke 3MF. |
| 5. Pilot opleveren | Alle voorgaande fasen samen, getest met een echte printerworkflow en lokaal geïnstalleerde Bambu Studio. | UC-018 doorlopen, volle schijf of afgebroken registratie herstellen, upgrade met behoud van een bestaande workspace testen. |

**Deploymentvoorstel.** Lever een versiegebonden Windows x64-installer voor de huidige gebruiker. Bundel UI, backend en benodigde runtime. Een snelkoppeling start één lokale backend en opent de UI in de standaardbrowser. Bind uitsluitend op loopback, valideer de UI-origin en beperk bestandsacties tot de gekozen workspace en expliciete import/export. Detecteer Bambu Studio of laat de gebruiker het uitvoerbare bestand eenmalig kiezen in Settings. Installeer de applicatie apart van de gebruikersdata. Publiceer eerst een pilot-installer als GitHub Release met installatie-, upgrade- en herstelinstructies. Maak vóór een schemamigratie een herstelbare back-up.

**Na de MVP.** SolidWorks-integratie en macro’s (UC-001), assemblywerkkopieën en componentinspectie (UC-013), tags en uitgebreide zoekopdrachten (UC-007/008), Where used (UC-009), snapshots (UC-010), attachments (UC-012), vergelijken (UC-014) en lifecycle (UC-016). Onderstaande fasen geven de bredere product- en prototypehistorie.

| Fase | Use cases | Afhankelijkheid / resultaat |
| --- | --- | --- |
| POC | UC-001 | Metadata-extractie; basisproef uitgevoerd, uitgebreide controles nog open |
| Documentbeheer | UC-002, UC-004, UC-005 | Part-identiteit, onafhankelijke documentversies, openen en bronrelaties; [[ISSUES#ISS-001]] onderzoeken |
| Versiehistorie en feedback | UC-011, UC-003, UC-012 | Part versions, Logbook, Print Reports en attachments per versie |
| Latere baselines | UC-010 | Snapshotfunctie later opnieuw uitwerken |
| Bibliotheek | UC-006, UC-007, UC-008 | Visueel browsen, tags en zoeken; werken met reeds beschikbare data |
| Gebruiksoverzicht | UC-009 | Betrouwbare, versiegebonden relatie-index en Part-versioncontext |

Definities: [[Architecture]]. Detail en acceptatiecriteria: [[USECASES]]. Statusbeleid wordt afzonderlijk uitgewerkt.

Eerste [HTML UI-prototype](../prototype/README.md) beschikbaar om bibliotheek, Part versions, documentrevisies en Print Reports te beoordelen. Dit is ontwerpvalidatie; de bovenstaande implementatiefasen en UC-acceptatie blijven open.

Prototype 2 verwerkt feedback over Part versions, Engels, prominente Part numbers, Where used-diagram, versiegebonden kaarten, Logbook en Attachments. Volledige productieacceptatie blijft open.

Part Details (UC-006): 3MF-projectmetadata in de UI-proef. Automatische import, effectieve object-/plaatinstellingen en volledige slicingtotalen blijven vervolgstappen.

Geconsolideerd: geselecteerde filamenten en Print time · indication. Vervolg: echte geslicete 3MF-fixture vergelijken met Bambu Studio, veilige import van slicingresultaten en later een lokale/background slicerconnector.

## Prototype v4

UC-013 t/m UC-016: samplecatalogus/componenten, echte A/B-previews, engineeringtabel/vergelijking, lokale opslag/concepts en bestaand lifecyclebeleid. UI-reviewpunten worden expliciet nagelopen in prototype/design-qa.md.

Nog open voor native CAD: assemblymacro op SolidWorks 2026 SP0 compileren en uitvoeren, tree/configuraties controleren, bronhashes vergelijken; daarna desgewenst gelicentieerde Document Manager-worker. Productieauth, gelijktijdig werken, echte CAD/slicerconnectors, slicing en geometrische afwijkingsanalyse blijven afzonderlijke stappen.

## Toekomstige uitbreiding — FreeCAD

- FreeCAD-integratie staat op de backlog, zonder geplande release of deadline; SolidWorks blijft de eerste CAD-integratie.
- Onderzoek: metadata en custom properties uit `.FCStd`, assembly-childrelaties en het koppelen van CAD-revisies aan STL-exporten en Part versions.
- Afhankelijkheden: stabiele CAD-import en relatieopslag; vóór implementatie een eigen use case en compatibiliteitsproef met FreeCAD-versies en assemblystructuren uitwerken. De huidige sample-inspectie is nog geen volledige integratie.

## Feature backlog:
- solidworks macro addin
- Part Wiki
- part compare tussen versie
- parameter analysis 3MF icm feedback print report.
