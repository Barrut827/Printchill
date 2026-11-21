
# To-do — Codex Agent

## Afgewerkt op 2026-11-21

- [x] [[AGENT]] opnieuw lezen en implementatie-/documentatieaanpak bepalen.
- [x] Huidig werk eerst committen en naar `origin/main` pushen: checkpoint `6256ca2` (MVP 0.3.5); 15 regressietests geslaagd.
- [x] [[Architecture]] herindelen met een inhoudsopgave, geïnspireerd op het officiële [arc42-template](https://arc42.org/overview/). Huidige keuzes, plannen en prototypehistorie apart; bestaande gebruikersnotities behouden.
- [x] [[SOLIDWORKS_INTEGRATION_PLAN]] maken voor CAD openen, nieuw CAD opslaan, wijzigen en koppeling aan PRC-Part numbers/versions. Inclusief fasen, fouten, verificatie en grens met assemblies.
- [x] [[ROADMAP]] opruimen met stroomdiagram, actuele stand, afhankelijkheden en oplevercriteria. Toekomstscope opgenomen: Fusion 360/FreeCAD; PrusaSlicer/OrcaSlicer/Cura; BlockNote-tekstverwerking, LaTeX en PDF; STL-metingen met nominale/gemeten waarde; report-PDF; AI-printanalyse.
- [x] [[USECASES]] en [[DJF]] laten aansluiten: wiki-formules, geplande STL-metingen, UC-022 PDF-export en UC-023 analyseadvies. Deze functies zijn gepland, niet door deze documentatietaak geïmplementeerd.

## Open onderzoek

### ISS-001

**STL met gewijzigde naam herladen in Bambu Studio** · Open sinds 2026-11-12 · relatie UC-005-A3/AC-08. Overgenomen uit de verwijderde issuelijst zodat bestaande UC-links weer een doel hebben. Niet onderdeel van de hierboven afgeronde documentatieopdrachten.

Onderzoek op een controlekopie of Reload from disk een STL met een nieuwe bestandsnaam kan vervangen. Vergelijk met hetzelfde bronpad en controleer behoud van positionering, supports, painting en printinstellingen. Leg Bambu-versie, begin-/eindbestanden, stappen en foutmeldingen vast; koppel CAD/STL-bronrevisies expliciet. Sluit pas na reproduceerbaar testbewijs en een bijgewerkte UC-005-workflow.
