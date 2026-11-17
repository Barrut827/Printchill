# UI-controle — prototype 3

**Resultaat: geslaagd voor de gecontroleerde prototypeflows.** Volledige productieacceptatie blijft open.

Gebruikersfeedback is de basis voor deze iteratie; de lichte PRC-vormgeving en de echte modelviewer blijven behouden.

## Gecontroleerd

- Desktop 1440 px: [Library](screenshots/library.png), [Part](screenshots/part.png), [Where used](screenshots/where-used.png), [Logbook](screenshots/logbook.png), [Attachments](screenshots/attachments.png).
- Part number heeft een prominent label; Part version 001… staat los van letterrevisies.
- Where used toont 3MF-gebruikers boven de STL en de CAD-bron eronder, verbonden door lijnen. Onbekende CAD-bron levert geen verzonnen node op.
- Logbook heeft versiebolletjes met uitklapbare bestandscombinatie en comments per gewijzigd bestand.
- Browserregressie: versiegebonden kaarten, registreren van wijzigingen, geen update zonder geselecteerde file, oude versiecontext, report/foto, HTML-escaping, attachments/download, ongeldige Git-URL en Git-SHA, STL-import en mobiele overflow.
- Modeltests: één registratie met meerdere files verhoogt eenmaal; alleen expliciete wijzigingen/dependencies gaan mee; oude inhoud en profiel blijven vast; fouten/duplicaten/overloop leveren geen gedeeltelijke registratie.
- [Mobiel 390 px](screenshots/mobile.png): responsieve kaartindeling en navigatie; diagram schuift binnen eigen paneel.
- De browserregressie is ook tegen het zelfstandige `file://`-HTML-bestand uitgevoerd.
- Geen JavaScript-fouten in de browsercontrole. Productiebuild slaagt. Vite meldt nog de omvang van de Three.js-bundel.

## Grenzen

Geen volledige schermlezer-/toegankelijkheidsaudit of cross-browsermatrix. Bestandsrevisionering en historische geometrie zijn gesimuleerd; data blijft in browsergeheugen. Git-doelen worden niet geverifieerd. Snapshots zijn bewust uitgesteld. Zie README voor de volledige prototypescope.

## Part Details-iteratie

Bestandentab vervangen door Part Details; bestandsselectie blijft in het Part-versionpaneel. [Opname](screenshots/part-details.png). De 3MF-extractie bewaart vier geconfigureerde slots, maar de UI toont uitsluitend geselecteerd slot 4: Generic PLA, #DCF478. Verder 0.2 mm, 15% grid en twee platen. Modeltoewijzing is geen gemeten verbruik of live AMS-inventaris. Gewicht: Unknown; Print time · indication: Slice required.

Browsercontrole omvat versiecontext, ontbrekende historische metadata, meerdere kleuren/types, behoud van Where used en het wissen van extractiedata bij een nieuwe gesimuleerde 3MF-revisie. Modeltests testen ook behoud bij ongewijzigde 3MF en ontbrekende versus nulwaarden.

Consolidatie geverifieerd: browser toont slechts geselecteerd filament en werkende uitleg bij ontbrekende tijd. Zeven JS-tests en vijf Python-extractietests dekken o.a. selectie, complete/partiële plaattijden, tekst-G-code-fallback, ontbrekende gegevens en grove tijdronding. De saved-slice-scenario’s zijn synthetische fixtures; geen echte geslicete sample geverifieerd.
