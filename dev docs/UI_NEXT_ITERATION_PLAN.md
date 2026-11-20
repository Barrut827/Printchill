# UI-plan na functionele uitbouw 0.2.6

Beoordelingsdatum 20 november 2026. Eerst de nieuwe zoek-, herstel- en reportfuncties accepteren; daarna deze visuele herinrichting uitvoeren.

## Bronnen en volgorde

| Volgorde | Bron | Gebruik |
| --- | --- | --- |
| 1 | Laatste opmerkingen van gebruiker bij UC-006 en de huidige MVP | Harde randvoorwaarden voor 20% zijbalk, leesbare kaarten, compacte printgegevens, tagbadges en bemating |
| 2 | Nieuw vastgelegde MVP-schermen in images/mvp-0.2.6 | Functionele ruimtebehoefte van platen, filters, reports en herstel |
| 3 | prototype/screenshots/v4, bestanden van 18 november 2026 | Meest recente prototype-indeling; alle acht beelden bekeken |
| 4 | prototype/screenshots, bestanden van 17 november 2026 | Acht oudere beelden, inclusief report-/attachmentcontext, vergeleken met v4 |
| 5 | UI_DESIGN_REVIEW en images/ui-audit-2026-11-17 | Negen auditbeelden plus de vastgelegde contrast-, focus-, draft- en versieproblemen |

De bestandsdatums geven de volgorde van de aanwezige opnames, geen afzonderlijk bewijs van gebruikersacceptatie. De standalone Printchill-demo.html en de module-UI vertegenwoordigen dezelfde prototypefamilie. De historische interacties zijn bij deze vergelijking niet opnieuw uitgevoerd. De nieuwe MVP-browsertest heeft wel de huidige taken met echte bestanden doorlopen.

## Bevindingen uit de beelden

1. **Bibliotheek.** V3 en v4 hebben herkenbare navigatie, een stabiele identiteit op kaarten en een aparte actie voor inspectie. V3 gebruikt veel verticale ruimte voor uitleg en een lege toevoegkaart. V4 heeft een bruikbare engineeringtabel. De huidige MVP heeft de gewenste compacte kaartwaarden en circa 20% zoekkolom, maar de zijbalk verdwijnt bij inspectie. Neem v4 als basis voor de algemene navigatie en de laatste gebruikersfeedback voor de kaarten.
2. **Part-inspectie.** V3 toont een grote viewer boven alle details. Daardoor staan de eerste waarden onder de vouw op laptops, zoals de review van 17 november aantoonde. V4 plaatst details links en een compact bestands-/viewerblok rechts. Gebruik die ruimteverdeling met de huidige echte revisies en bemate box.
3. **Platen.** V4 kent een plaatselectie bij de preview. De nieuwe MVP toont alle opgeslagen PNG’s om de ruimtebehoefte zichtbaar te maken. Een selector met één grote preview en een compacte thumbnailstrook is de volgende stap. Nummer en 3MF-revisie blijven bij het beeld staan.
4. **Reports.** Het auditbeeld van 17 november heeft een begrijpelijk formulier, maar procesparameters en duurzaam herstel waren beperkt. De functionele MVP heeft meer invoer, waardoor een smalle dialoog lang wordt. Een ruime reportpagina met broncontext en gegroepeerde invoer is geschikter.
5. **Logbook en versiecontext.** Het v3-logbook maakt gewijzigde bestanden herkenbaar. V4 houdt de geselecteerde versie bij de kop. Combineer een vaste versieheader met compacte historische regels; een wijzigingsvoorstel noemt zijn eigen werkkopiebasis.
6. **Herstel.** In meerdere v4-schermen ligt een fouttoast over andere acties. Een bevestiging met conflicten en gevolgen hoort in een eigen scherm. De nieuwe previewgegevens en bevestiging zijn hiervoor het functionele uitgangspunt.
7. **Mobiel.** De beelden van 17 en 18 november tonen lange inspectiepagina’s en horizontale tabrijen. Prioriteit is Windows-laptop/desktop; op smalle schermen worden navigatie en panelen inklapbaar. Alle kernacties blijven via toetsenbord of touch bereikbaar.
8. **Vergelijking, assemblies en relaties.** De v4-beelden tonen passende toekomstige tabbladen, maar ook zeer lange componentlijsten en onbevestigde assemblybronnen. Reserveer een uitbreidbare tabstructuur. Toon deze functies pas wanneer de bijbehorende functionele UC is geïmplementeerd.

## Uitvoerbare ontwerpvolgorde

De nieuwe schermen zijn bekeken als [bibliotheek](images/mvp-0.2.6/01-library.png), [inspectie met platen](images/mvp-0.2.6/02-part-with-plates.png), [reportdialoog](images/mvp-0.2.6/03-report-draft.png), [filters](images/mvp-0.2.6/04-search-filters.png) en [back-upreview](images/mvp-0.2.6/05-backup-preview.png). De bibliotheekopname bevat een scrolltest met negentien sample-registraties; thumbnails buiten de viewport worden pas bij scrollen geladen. De reportopname toont alleen het zichtbare deel van de scrollbare dialoog en maakt de ruimtebeperking concreet.

| Stap | Werk | Gereed wanneer |
| --- | --- | --- |
| 1. Appstructuur | Behoud links circa 20% voor Library, zoeken, tags, bewaarde queries en Settings. De zijbalk blijft bestaan tijdens inspectie; desktopondergrens circa 220 px. | Bij 1366×768 en 1920×1080 is steeds duidelijk waar de gebruiker is en hoe de selectie wordt hersteld. |
| 2. Bibliotheek | Flexibele kaarten met vaste previewverhouding, naam/nummer/versie, tags en tijd/gewicht. Materiaal- en bronuitleg in details. Tabel krijgt echte kolommen voor revisies en printgegevens. | Lange namen, meerdere tags en ontbrekende gegevens blijven leesbaar bij 200% zoom; hover en focus geven dezelfde extra informatie. |
| 3. Inspectie | V4-verdeling met compacte versieheader, details links, bestanden en optionele viewer rechts. Tabs voor Details, Platen, Logbook en Reports. | Tijd, gewicht, gekozen revisie en Bambu-actie staan op een laptop direct in beeld. De juiste geometrie en PNG volgen de gekozen revisie. |
| 4. Reports | Twee hoofdgroepen voor printcontext/resultaat en metingen/bewijs; procesparameters inklapbaar. Meetregels met expliciete eenheden en afwijking. Conceptstatus en opslaan zichtbaar. | Report met foto, geplakte screenshot en meting kan zonder onduidelijke bron- of versiekeuze worden bewaard en heropend. |
| 5. Herstel | Previewkaart met brongegevens en twee lijsten voor toevoegen/vervangen. Bevestiging noemt verlies van lokale versies/reports. | Annuleren, foutafhandeling en succes tonen steeds de actieve workspace. Conflicten zijn vóór bevestigen leesbaar. |
| 6. Consistente bediening | Gedeelde componenten voor labels, badges, tabellen, dialogs, meldingen en iconen; hover/focus/Escape en terugkeer herstellen. | Screenshot- en interactiecontrole op 1366, 1920 en 390 px; toetsenbordtest en contrastmeting. |

## Eerst functioneel accepteren

- UC-006-aanvulling: PNG’s per plaat bij de gekozen 3MF-revisie.
- UC-015: preview, toevoegen/vervangen, annuleren, reportbijlagen terughalen en foutieve back-up.
- UC-008: alle zes criteria, waaronder hetzelfde printpogingfilter en heropenen van criteria na PRC-herstart.
- UC-003: procesparameters, extra parameter, meting, upload/plakken, concept terughalen en exact dezelfde opgeslagen versie.
- UC-018 blijft door de gebruiker geaccepteerd. SolidWorks-integratie krijgt later eigen verificatie.

## Grenzen van de huidige functieversie

Metingen zijn nu een vrij meetverslag; automatische berekening van afwijkingen volgt bij de reportinterface. Parameterarrays geven profielwaarden weer, geen berekende objectinstellingen. Reportconcepten staan op deze pc in browseropslag, definitieve reports en hun begrensde afbeeldingen staan in de workspace. De plaatbeelden zijn opgeslagen previews en worden bij openen niet opnieuw gerenderd.

De volgende UI-implementatie verandert de presentatie rond de geaccepteerde opslag- en revisiehandelingen. Review eerst bibliotheek en inspectie met de werkelijke sample-workspace; gebruik daarna dezelfde componenten voor report en herstel.
