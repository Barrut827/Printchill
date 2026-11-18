# UI-controle — prototype 4

De gecontroleerde prototypeflows slagen. Deze iteratie verwerkt de UI-review en het nieuwe POC-materiaal; productieacceptatie blijft open.

## Materiaal en relaties

- 67 originele bestanden, 36 groepen, 23 echte STL-previews en 12 uitgelezen 3MF-projecten. Bronnen zijn ongewijzigd; hashes en verliesvrije previewkopieën worden gecontroleerd.
- Beschikbare A/B-revisies gebruiken elk hun eigen geometrie. Simulaties zijn expliciet als simulatie gemarkeerd.
- 3MF-componenten, platen, geselecteerde filamenten en bronbestandsnamen worden uitgelezen. Een naamovereenkomst bewijst geen CAD-exportrelatie.
- Native SolidWorks-assemblychildren zijn niet betrouwbaar uitgelezen. De Windows-macro en manifestimport zijn voorbereid; de macro is nog niet in SolidWorks 2026 uitgevoerd of gecompileerd. De browsertest gebruikt een synthetisch manifest.

## Verwerkt en gecontroleerd

- Compacte Part Details met kerngegevens boven de vouw bij 1366×768; prominent Part number en expliciete historische versiecontext.
- Sorteerbare engineeringtabel, kolomkeuze, filters, opgeslagen zoekopdrachten en versievergelijking met echte STL-previews. Geen geometrische afwijkingsberekening.
- Leesbaarder contrast, grotere bediening, gekoppelde dialoogtitels, toetsenbordtabs en toegankelijke tooltips met focus, hover en Escape.
- Lokale IndexedDB-opslag, reportdrafts, foto's, attachments, Git-links en backup/herstel. Dit is browseropslag, geen serverbackup.
- Lifecyclebewaking en bevestiging bij wijziging van Released; reports en attachments verhogen de Part version niet.
- Deep links, versiegebonden Where used en expliciete bronzekerheid.

## Verificatie

- 12 JavaScript-tests en 9 Python-tests geslaagd.
- Productiebuild geslaagd; Vite meldt de bekende bundelgrootte.
- Volledige browserflow geslaagd via Vite én zelfstandig `file://`-HTML: imports, historie, drafts na reload, reports/foto's, attachments, lifecycle, backup/herstel, foutieve backup, manifestimport en toetsenbordbediening; geen JavaScript-pageerrors.
- Mobiel 320 px zonder horizontale paginaoverflow; gerichte contrastcontrole van hulptekst en tabs minimaal 4.5:1.
- Visueel bekeken: [Part](screenshots/v4/part.png), [vergelijking](screenshots/v4/compare.png) en [3MF-details](screenshots/v4/print-details.png). De laatste opname bevat een verwachte fouttoast uit de negatieve backup-test.
- Aanvullend bewijs: [tabel](screenshots/v4/table.png), [3MF-componenten](screenshots/v4/project-components.png) en [native assembly-beperking](screenshots/v4/native-assembly.png).

## Grenzen

Geen volledige WCAG-/screenreaderaudit, cross-browsermatrix, server, rechtenbeheer, slicerberekening of native CAD-reader. Geen complete native BOM bewezen. Ontbrekende printtijd blijft Slice required; filamentslots zijn geen live AMS-inventaris. Een lokale opslagfout is niet met fault injection getest. Zie README en de materiaalanalyse voor de volledige scope.
