# Printchill UI-prototype — v3

Klikbare HTML-opzet voor ontwerpvalidatie. Engelstalige UI; documentatie in het Nederlands.

## Direct openen

Download [Printchill-demo.html](Printchill-demo.html) en dubbelklik het bestand in Chrome of Edge. Geen installatie of webserver nodig. Dit bestand bevat de code, iconen en twee STL-modellen.

## Ontwikkelen

Vereist Node.js 20.19+ of 22.12+.

```sh
cd prototype
npm ci
npm run dev
```

Open de lokale URL uit de terminal. De bron-`index.html` heeft wel de Vite-webserver nodig.

## Proberen

- **Library:** prominente Part numbers, echte STL-previews, zoeken met `#workshop + PETG`, filters, tags en opgeslagen zoekopdrachten. Kies op elke kaart een Part version; alleen haar bestandsrevisies en printgegevens verschijnen.
- **Part Details:** materiaal, totaalgewicht, printtijd, layer height, infillpercentage/-type, geselecteerde filamentkleuren/-types en plaatcount voor de gekozen 3MF-revisie. De mount in 003 toont vooraf uitgelezen metadata uit het aangeleverde 3MF; ontbrekend gewicht blijft Unknown; zonder volledige tijdgegevens verschijnt Slice required.
- **Part version:** numeriek vanaf 001. De voorbeeld-mount heeft 001 t/m 003, met CAD C / STL C / 3MF G in 003.
- **Register file changes:** selecteer gewijzigde bestanden en geef per bestand commentaar. Eén bevestiging maakt één volgende Part version; alleen gekozen bestandsrevisies worden verhoogd. Dit simuleert wijzigingen, zonder echte bronbestanden te bewerken.
- **Where used:** klik een STL in het Part-versionvenster. Gebruikers staan erboven, de CAD-bron eronder, met lijnen. Relaties verwijzen naar exacte documentrevisies.
- **Logbook:** git-achtige historie per Part number. Klik een bolletje om alle bestanden/revisies, wijzigingen en file-comments uit te klappen. De titel gebruikt de eerste commentzin.
- **Print Reports:** verslag met foto’s/plakken, gekoppeld aan de gekozen Part version; geen versieverhoging.
- **Attachments:** upload een instructie/schema of koppel een Git-repository met commit-SHA of ref aan de gekozen versie; geen versieverhoging. Bestanden kunnen weer gedownload worden. Geen automatische overerving naar een volgende versie.
- **Import:** voeg een eigen STL toe als Part version 001 of bekijk custom properties uit de POC-JSON.

## Grenzen

Alle wijzigingen verdwijnen bij vernieuwen. Bestanden blijven in browsergeheugen. Historische revisies, relaties, datums en printgegevens zijn voorbeelden; elke Part gebruikt één echte aangeleverde STL voor alle historische previews. Oudere kaartprofielen zijn demo’s. In Part Details zijn alleen geregistreerde 3MF-waarden zichtbaar. De aangeleverde 3MF is expliciet aan demo G (Part version 003) gekoppeld; revisieherkenning is niet automatisch. Bij een gesimuleerde nieuwe 3MF-revisie wordt de extractie niet gekopieerd.

Geen file-watcher, inhoudsdetectie, echte revisie-import, serveropslag, accounts, CAD/slicerconnector of printerverbinding. Bestandswijzigingen worden expliciet gesimuleerd; alleen opmerkingen of attachments vormen geen nieuwe Part version. Een registratie wordt altijd op de actuele versie gebaseerd, ook wanneer je een historische versie bekijkt. Dit is een lineaire historie, geen branching.

Nummering na 999 of bestandsrevisie Z is nog onbeslist; de proef blokkeert deze overloop. Wijzigingen van dependent files zijn expliciet: CAD aanpassen verhoogt niet automatisch STL/3MF. Git-links worden niet online gecontroleerd; een branch/tag is als veranderlijk gemarkeerd.

Snapshots zijn gereserveerd voor latere baselining en maken geen deel uit van deze dagelijkse UI. Nog open: meerdere modellen/assemblies demonstreren, ontwerpbestand toevoegen/verwijderen/vervangen, volledige printparametertabel, precieze meettools en vertalingen. Geen use case is als volledig productie-gereed gemarkeerd.

## Techniek en verificatie

Vite voor server/build, Three.js voor STL, Phosphor voor iconen. Versieregels staan in `model.js`; overige UI is een kleine module zonder framework/backend.

```sh
npm test
npm run build
python scripts/extract_3mf_details.py  # reproduceer metadata uit het voorbeeld
npm run build:portable
# Python Playwright, met Vite op poort 4173:
python -m playwright install chromium
python smoke_test.py
```

[Visuele controle en screenshots](design-qa.md). De twee voorbeeldmodellen komen uit `POC material` in deze repository.

## Geconsolideerde filamentselectie en tijdindicatie

De sample toont alleen geselecteerd projectfilament 4: Generic PLA, #DCF478. Geen live AMS-inventaris. Waar beschikbaar gebruikt extractie opgeslagen slicinggebruik; anders modeltoewijzingen. Geverfde kleuren en andere complexe overrides zijn niet volledig opgelost.

Print time · indication: complete plaatvoorspellingen uit slice_info, fallback op tijdcommentaar in ingesloten tekst-G-code. Grove weergave op vijf minuten, bron en ruwe seconden blijven bewaard. Geen complete data: Slice required; geen fictieve tijd uit eerste-laagtijd of filamentlengte × printsnelheid. De huidige sample heeft geen complete voorspellingen. Geen automatische slicing of nieuwe 3MF-browserimport.

Extractietests: `python -m unittest discover -s scripts -p '*_test.py'`. Onderzoek en online bronnen: [3MF print details](../dev%20docs/3MF_PRINT_DETAILS_RESEARCH.md).
