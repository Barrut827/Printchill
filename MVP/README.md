# PrintChill voor Windows · MVP 0.3.5

**Report bewerken:** kies Edit bij een opgeslagen Print Report en bewaar met Save changes. Rapportnummer, printdatum en gebruikte Part version blijven behouden. Je kunt notities, resultaat, metingen, foto's en parameters/suggesties aanpassen. Een afzonderlijk editconcept blijft na sluiten beschikbaar. Enter in de parameterkiezer voegt een selectie toe en slaat het report niet op; in Notes maakt Enter een nieuwe regel. Bewaren gebeurt via de Save-knop.

**Importeren:** Create new part → Import existing files toont aparte velden voor CAD, STL en 3MF. Kies per veld Add file of sleep een bestand naar het juiste veld. Je kunt achtereenvolgens bestanden uit verschillende mappen toevoegen; één bestand volstaat. Annuleren van een bestandskiezer laat eerdere keuzes staan. Een drop wordt tijdelijk naar de backend geüpload; maximaal 256 MB per bestand.

**Later aanvullen of vervangen:** kies Edit related objects onder de bestanden bij de viewer van de nieuwste Part version. Kies alleen de ontbrekende of te vervangen bestanden. Save new version bewaart één nieuwe combinatie; andere rollen blijven behouden. Identieke bytes maken geen nieuwe versie. Historische bestanden en hun reports blijven ongewijzigd.

**Reports:** printer en materiaal komen uit de gekozen 3MF en blijven aanpasbaar. Parameters zijn standaard leeg. Kies Add parameter, zoek bijvoorbeeld Support Z offset, selecteer de gevonden parameter en kies Add. Naast de geregistreerde 3MF-waarde staat Suggestion voor je voorstel. Het voorstel verandert geen slicerbestand. Metingen bevatten M1/M2/…, positie, nominale modelwaarde en gemeten waarde. + Add measurement voegt een regel toe. Concept, report en back-up behouden meetregels, afbeeldingen en gekozen parameters met suggesties.

**Screenshots in Print Reports:** kopieer een afbeelding of maak een Windows-schermafdruk met **Win+Shift+S**, open het report en druk **Ctrl+V**. Dit werkt ook vanuit Notes of Measurements. Bovenaan staat een zichtbaar plakvak met **Paste from clipboard** als alternatief; de browser kan hiervoor klembordtoegang vragen. Een bestandskiezer blijft onder **Add image files** beschikbaar. Een preview en teller bevestigen het toevoegen. Ondersteund: maximaal acht PNG/JPEG/WebP-afbeeldingen, 2 MB per afbeelding en de bestaande totale reportlimiet. Fouten verschijnen direct bij het plakvak. Save wacht tot het toevoegen gereed is.

Deze versie gebruikt de goedgekeurde v5-UI. De linkerzijbalk bevat navigatie, zoeken, filters, collecties, tags en bewaarde zoekopdrachten. Part details, platen, History en Print reports hebben eigen tabbladen. Wiki en de SolidWorks-connector zijn nog roadmapfuncties.

**Collecties:** maak met **+** naast **Collections** een verzameling aan. Kies in Part details onder Tags bij **Collected by: → Edit collections** één of meer collecties. Klik op een collectie in de zijbalk om de bibliotheek te filteren. **All parts** heft dit filter op. **Manage collection** biedt hernoemen en verwijderen; verwijderen laat Parts en bestanden intact. De indeling blijft na herstart en back-up/herstel behouden.

**History:** **Save as / derive** maakt een nieuw Part number met de gekozen bestandscombinatie als versie 001. De grafiek toont een klikbare vertakking naar het nieuwe Part en een verwijzing terug naar de bron. Een Git-link onder Part details hoort bij de gekozen Part version.

Met deze handleiding installeer je de pilot en beheer je de lokale werkmap (workspace). De knopnamen hieronder komen overeen met de Engelstalige interface.

## Eerste start

1. Pak de volledige pilot-ZIP uit op een Windows x64-pc. Dubbelklik op `start.cmd`. PrintChill opent in je standaardbrowser. Voor een snelkoppeling in het startmenu gebruik je `install.cmd`. De ZIP bevat de benodigde Node-runtime en de bijbehorende licentie.
2. Open **Settings**. Kies met **Browse** een lege lokale map voor een nieuwe workspace of wijs een bestaande PRC-workspace aan. Kies een locatie buiten netwerkschijven en synchronisatiemappen. Klik op **Connect workspace**.
3. Staat Bambu Studio op een afwijkende locatie? Selecteer dan in **Settings** het bestand `bambu-studio.exe`. Laat de lokale PRC-backend draaien tijdens het werken in Bambu Studio.

Met **Create new part** kies je een lege Part of importeer je een STL, 3MF of CAD-bestand (SLDPRT of STEP). Een lege Part krijgt direct een nummer; met **Import files** ontstaat de eerste versie 001. PRC bewaart eigen kopieën. In de bibliotheek vind je een Part op naam of nummer.

De volledige ontwerpworkflow en de acceptatiecriteria staan in de projectdocumentatie bij [UC-018 — Een printontwerp aanpassen en de eerdere print reproduceren](../dev%20docs/USECASES.md#uc-018-een-printontwerp-aanpassen-en-de-eerdere-print-reproduceren). Deze verwijzing is bedoeld voor de bronrepository.

## Back-up en herstel

- **Back-up maken:** kies **Settings → Create backup** en selecteer een lege map buiten de workspace. De back-up bevat de geregistreerde versies, bestanden en printrapporten. Bevestig openstaande wijzigingen vooraf als je ze wilt meenemen.
- **Samenvoegen:** kies **Settings → Restore backup → Merge into current workspace**. Selecteer de map met `backup.json` en bekijk naam, aanmaakdatum, grootte, Parts en conflicten. Bevestigen vervangt voor overlappende nummers de lokale versies, tags en rapporten door de back-upinhoud. Andere lokale Parts blijven beschikbaar. Bevestig eerst eventuele wijzigingen in werkkopieën voor de conflicterende Parts. Bij oudere back-ups kan de aanmaakdatum onbekend zijn.
- **Apart openen:** kies **Open as separate workspace** voor een zelfstandige kopie van de volledige back-up, inclusief opgeslagen zoekopdrachten. Een gevulde doelmap krijgt hiervoor een nieuwe submap.

## Bibliotheek en zoeken

De Part-kaart toont de STL van de nieuwste geregistreerde combinatie. **Print plates** toont opgeslagen PNG's uit de gekozen 3MF. Filters doorzoeken ook beschikbare projectparameters. Een profielarray behoudt zijn waarden; dit is geen berekening van de effectieve instelling per object.

**Print Reports:** kies de geprinte Part version en **Add print report**. Controleer printer en materiaal uit de 3MF, kies resultaat en voeg metingen toe met **+ Add measurement**. Vul per regel de gemeten positie en waarde met eenheid in. Zoek extra ingevulde procesparameters en kies **+ Add parameter**. Upload foto’s of plak een screenshot met Ctrl+V. Het concept bewaart ook de meetregels, afbeeldingen en parameterselectie na sluiten. Bewaar het report voor opname in de workspace en back-up. Limieten zijn acht afbeeldingen, 2 MB per afbeelding en 5 MB per report.

Wissel tussen kaarten met STL-thumbnail en de tabel. Kies een Part en Part version voor de bijbehorende geometrie, afmetingen, projectinstellingen en 3MF. **Library** brengt je terug naar je zoekresultaten. Via **Edit tags** geef je Parts labels. Combineer termen met **+**, bijvoorbeeld `#roboticarm + PETG`. Het materiaalfilter onder **Filters & saved searches** gebruikt het werkelijk opgegeven materiaal in een Print Report. In combinatie met een periode moeten beide bij dezelfde printpoging horen. **Save search** bewaart de criteria in de workspace.

De workspace gebruikt SQLite voor de registraties en bewaart de bijbehorende bestanden lokaal. Bepaal met de Windows-maprechten wie toegang heeft tot de workspace en de back-ups.

## Bijwerken naar een nieuwe pilotversie

**Printschatting.** Zonder volledige opgeslagen slicertotalen berekent PRC een indicatie uit horizontale doorsneden van de geplaatste 3MF-geometrie, wand- en laaginstellingen, infill, snelheden en filamentprofiel. Bij Print details toont **How PRC estimated this print** per plaat de gebruikte profielwaarden en beperkingen. Een opgeslagen Bambu-waarde krijgt per grootheid voorrang. Opwarmtijd, support, brim en materiaalwissels vallen buiten de benadering; de werkelijke print kan meer tijd en materiaal vragen.

Maak eerst een back-up. Stop de oude backend met Ctrl+C als je hem vanuit een terminal hebt gestart. Draait hij op de achtergrond, meld je dan af en weer aan bij Windows. Pak het nieuwe pakket uit, start het met `start.cmd` en selecteer zo nodig je bestaande workspace.

## Voor ontwikkelaars

MVP 0.3.0 gebruikt schema 4. Vóór migratie van een bestaande workspace maakt PRC een volledige back-up naast die workspace. Test met een aparte workspace via F5. Onder Run Task staan **PRC: Test functionaliteit** en **PRC: Test browserflow**. Deze laatste gebruikt een tijdelijke workspace en lokale Chrome.

Open de repositorymap **Printchill** in VS Code. Kies bij **Run and Debug** de configuratie **PRC: Start met browser**. Met **F5** start de bronversie en opent de browser. **Shift+F5** stopt deze debugsessie.

Via **Terminal → Run Task…** kun je ook **PRC: Bouw en installeer Windows-pilot**, **PRC: Start vanuit broncode** of **PRC: Stop backend** kiezen. Starten en installeren stoppen eerst de herkende PRC-backend op poort 47831. Rond een lopende import of herstelactie vooraf af. De installatietaak bouwt de ZIP en zet de pilot met snelkoppeling in het Windows-startmenu. Voor bouwen is Node 24 x64 nodig en mogelijk internet voor de runtime-licentie.

Voer de volgende opdrachten uit vanuit de map `MVP` op Windows x64 met Node 24. De tests gebruiken de voorbeeldbestanden uit de repository.

| Doel | Opdracht |
| --- | --- |
| Starten vanuit de broncode | `.\start.cmd` |
| Opslag, lokale API, collecties, reports, zoeken en back-upmerge testen | `node --test store.test.mjs server.test.mjs release.test.mjs collections.test.mjs report-data.test.mjs related-files.test.mjs` |
| UI, import en echt klembordplakken met tijdelijke workspaces en lokale Chrome testen | `npm ci` en daarna `node --test --test-concurrency=1 ui.test.mjs reports.test.mjs import.test.mjs` |
| Pilot-ZIP bouwen | `.\build.ps1` |

Bij het openen van een workspace met schema 1, 2 of 3 maakt PRC naast de workspace eerst een back-up en migreert naar schema 4. Voor het vernieuwen van de offline viewer- en metadatabundels gebruik je in deze bronmap `npm ci` en `node bundle.mjs`.
