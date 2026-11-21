# PrintChill UI-proef v5

Open **prototype/Printchill-demo-v5.html** rechtstreeks in Chrome of Edge. Alle geometrie, plaatbeelden, scripts en stijlen zitten in die ene HTML. Er is geen server nodig.

De proef gebruikt een alleen-lezen momentopname van de vijf Parts en zeven versies uit de huidige MVP-workspace. De bouwstap haalt bronbestanden en versies op, plus bestaande slicertotalen. Opgeslagen productie-reports worden niet meegenomen. Nieuwe demo-reports, drafts en zoekopdrachten worden uitsluitend in browseropslag bewaard.

Probeer achtereenvolgens de bibliotheek, de Zadel Buis Klem, de historische versie, de bemate STL, Print plates, een nieuw Print Report en Backup & restore. De linkerzijbalk blijft steeds beschikbaar. Parameters en combinaties van zoekfilters zijn klikbaar. Reportfoto’s ondersteunen in deze proef één afbeelding tot 2 MB.

Reviewupdate: **History** toont versies als verbonden nodes met uitgelijnde bestands- en revisiekolommen. **Save as / derive** maakt een afgeleid demo-Part met een nieuw nummer; de afsplitsing in History is aanklikbaar en de afgeleide heeft een teruglink naar zijn bronversie. Deze relaties worden alleen binnen de browserproef opgeslagen. **Create new part** biedt leeg starten of bestaande bestanden kiezen. **Backup & restore** staat onder **Settings**.

Part details toont nu registratie-/wijzigingsdatums, tags, **Collected by:** en een bewerkbare Git-verwijzing boven de printinstellingen. Collecties maak je in de linkerzijbalk aan en wijs je bij Part details toe; dezelfde Part kan in meerdere collecties staan. Deze proef bewaart dat alleen in de browser. Wiki reserveert ruimte voor een roadmapfunctie. De Bambu- en SolidWorks-knoppen gebruiken ingebedde applicatie-iconen uit de lokale installaties. De SolidWorks-knop toont een handoff-preview; de productie-integratie is vervolgwerk.

Import, de Bambu-handoff en het bevestigen van herstel zijn UI-demonstraties. MVP 0.3.0 neemt deze UI over voor native bestandsregistratie, slicen, collecties, blijvende History-vertakkingen, reports en werkelijk herstel. De prototypeback-up bevat alleen demo-records. Het originele v4-prototype staat in Printchill-demo.html.

Herbouwen met dezelfde workspacegegevens kan vanuit de repository met `node prototype/v5/build.mjs`. Dat vereist de ontwikkeldependencies van MVP en de lokale workspaceconfiguratie. Verifiëren met `node prototype/v5/check.mjs` gebruikt lokale Chrome en bewaart negen screenshots onder prototype/screenshots/v5.
