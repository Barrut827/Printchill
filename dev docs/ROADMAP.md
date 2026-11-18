# PrintChill — Roadmap

Voorstel voor volgorde; geen vastgestelde deadlines of releaseprioriteiten.

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
