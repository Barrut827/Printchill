# Acceptatietestplan PrintChill MVP — builds 0.3.0 t/m 0.3.5

Voer de tests uit op build **0.3.5**, gestart via F5 in VS Code of `start.cmd`, met een aparte testworkspace en de samplebestanden. Vul **Test result** in met Pass of Fail en noteer afwijkingen bij **Comment**; lege resultaten wachten op gebruikersacceptatie. Automatische regressietests vervangen deze acceptatie niet. UC-018 is eerder door de gebruiker geaccepteerd en hoeft alleen bij een regressie opnieuw.

| ID / UC | Acceptatietest | Verwacht resultaat | Test result | Comment |
| --- | --- | --- | --- | --- |
| T01 · UC-015 | Start PRC, kies een workspace, herstart en open deze opnieuw. | Build 0.3.5 is zichtbaar; dezelfde gegevens en instellingen keren terug. | | |
| T02 · UC-015 | Open een oudere workspace met geregistreerde Parts en reports. | Migratieback-up aanwezig; Parts, versies, reports en bestanden blijven behouden. | | |
| T03 · UC-002 | Create new part → Empty Part; registreer later de eerste bestanden. | Direct een Part number; versie 001 ontstaat pas bij bestandsregistratie. | | |
| T04 · UC-017 | Kies STL, daarna CAD uit een andere map; sleep 3MF op het eigen veld. | Drie aparte velden; eerdere keuzes blijven staan; één gezamenlijke registratie. Eén bestand volstaat ook. | | |
| T05 · UC-017 | Annuleer een bestandskiezer; probeer een verkeerde rol en een onderbroken upload. | Eerdere keuzes blijven bruikbaar; duidelijke fout; geen gedeeltelijke Part-registratie. | | |
| T06 · UC-021 | Registreer STL-only; voeg CAD/3MF later toe via Edit related objects. | Zelfde Part number, volgende Part version; oude versie blijft STL-only. | | |
| T07 · UC-021 | Vervang alleen STL via Edit related objects. | Eén nieuwe versie met volgende STL-revisie; CAD/3MF en oude reports blijven gelijk. | | |
| T08 · UC-021 | Annuleer een wijziging; bied identieke bytes aan; probeer een verouderde basis of ongeldige 3MF. | Annuleren/identieke bytes maken geen versie; fouten/conflicten geven geen gedeeltelijke registratie. | | |
| T09 · UC-006 | Bekijk kaarten/tabel op laptop en breed scherm; open een Part en ga terug. | Leesbare, even hoge kaarten; circa 20% zijbalk; details/viewer uitgelijnd; zoekcontext en scrollpositie behouden. | | |
| T10 · UC-006 | Draai STL, gebruik oriëntatie-iconen en toon afmetingen; bekijk een oudere versie. | Juiste STL-revisie; maatvoering herkenbaar per as/zijde met eenheden; iconen werken. | | |
| T11 · UC-006 | Bekijk plaatbeelden en printgegevens bij meerdere Part versions. | PNG's, materiaal, tijd en gewicht horen bij de gekozen 3MF; bron/berekenstatus zichtbaar; ontbrekende gegevens niet verzonnen. | | |
| T12 · UC-007/008 | Zoek naam/nummer, combineer #tag + materiaal; probeer een afsluitende +. | EN-criteria worden toegepast; tagfilter werkt; ongeldige syntax geeft een melding zonder stille verbreding. | | |
| T13 · UC-008 | Combineer bestandstype met projectparameter, bijvoorbeeld layer_height = 0.2. | Alleen passende Parts; niet-bestaande waarde geeft geen resultaat. | | |
| T14 · UC-008 | Gebruik een recente PLA-poging en oudere PETG-poging; zoek PETG binnen drie dagen. | Alleen een PETG-poging binnen dezelfde periode telt; verschillende pogingen worden niet gecombineerd. | | |
| T15 · UC-008 | Bewaar zoekcriteria, herstart en open de zoekopdracht opnieuw. | Criteria worden hersteld en opnieuw uitgevoerd; relatieve perioden schuiven mee. | | |
| T16 · UC-007 | Voeg tags toe, wijzig ze en filter via de zijbalk. | Tags blijven na herstart behouden en veranderen geen Part version. | | |
| T17 · UC-019 | Maak twee collecties; wijs een Part aan beide toe via Collected by. | Beide collectiefilters vinden hetzelfde Part; geen extra Part version. | | |
| T18 · UC-019 | Hernoem en verwijder een collectie; herstart en herstel een back-up met gelijke collectienamen. | Relaties volgen hernoemen; verwijderen behoudt Parts; herstel bewaart indeling en merge combineert gelijke namen. | | |
| T19 · UC-011 | Kies een historische versie, maak Save as / derive en volg beide History-links. | Exacte bestanden per versie; nieuw Part met 001; bron- en afgeleide verwijzen na herstart naar elkaar. | | |
| T20 · UC-012 | Bewaar een Git-link bij een historische versie en bekijk een andere versie. | Link blijft bij de gekozen versie; geen verhoging van Part version. | | |
| T21 · UC-003 | Open een report bij een gekozen, ook historische, Part version. | Juiste broncontext; printer en geselecteerd materiaal uit die 3MF vooraf ingevuld en aanpasbaar. | | |
| T22 · UC-003 | Nieuw report: voeg foto's/notitie toe; Add parameter → Support Z offset → Add; Suggestion = 0.15. | Eerst geen parameters; daarna echte bronwaarde met eenheid en apart voorstel; beide blijven na opslaan behouden. 3MF verandert niet. | | |
| T23 · UC-003 | Zoek/toon parameters met null, lege waarden, nul, false en profielarrays. | Lege waarden ontbreken; 0/false blijven zichtbaar; oorspronkelijke slotnummers herkenbaar. | | |
| T24 · UC-003 | Vul M1/M2 met positie, nominale en gemeten waarde; probeer lege en half ingevulde regels. | Automatische unieke nummers; waarden met eenheden blijven behouden; lege regels overgeslagen; onvolledige regels geweigerd. | | |
| T25 · UC-003 | Plak screenshots met Ctrl+V vanuit plakvak, Notes en meetvelden; voeg ook een fotobestand toe. | Directe previews; één paste voegt één afbeelding toe, ook na heropenen; foto's blijven na opslaan/herstart behouden. | | |
| T26 · UC-003 | Probeer Paste from clipboard, geweigerde toegang, gewone tekst en afbeeldingslimieten. | Duidelijke fout bij blokkade of limiet (8 beelden, 2 MB/beeld, 5 MB/report); invoer blijft staan; tekst plakt normaal in Notes. | | |
| T27 · UC-003/015 | Sluit en heropen een reportconcept met afbeeldingen, meetregels en suggesties; bekijk een oud report. | Concept blijft beschikbaar; oude meetnotities en regels zonder nominale waarde blijven leesbaar. | | |
| T28 · UC-003 | Bewaar twee printpogingen op dezelfde versie, inclusief Failed/Aborted; herhaal dezelfde opslagactie. | Afzonderlijke pogingen met correct resultaat; geen dubbele opslag of nieuwe Part version. | | |
| T29 · UC-003 | Druk Enter in parameterzoeker/-lijst, Suggestion, overige tekstvelden en Notes. | Geen onbedoelde save/sluiting; parameterselectie werkt; Notes krijgt nieuwe regels; expliciete Save bewaart. | | |
| T30 · UC-003 | Kies Edit vanuit Part-reports en algemeen overzicht; wijzig notities, foto's, metingen en suggesties. | Save changes werkt hetzelfde report bij; ID, printdatum en bronversie behouden; geen extra printpoging. | | |
| T31 · UC-003 | Bewerk hetzelfde report in twee vensters; annuleer een edit en heropen het concept. | Geen stil overschrijven bij conflict; herladen mogelijk; annuleren verandert het opgeslagen report niet. | | |
| T32 · UC-015 | Maak een back-up buiten de workspace met historische bestanden, reports en collecties. | Voltooide back-up bevat database en alle geregistreerde bestandsobjecten. | | |
| T33 · UC-015 | Settings → Restore backup; selecteer een voltooide back-up via Browse. | Windows-kiezer opent op de voorgrond; preview toont naam, datum indien bekend, MB, Part-aantal en toe te voegen/vervangen nummers. | | |
| T34 · UC-015 | Merge lokaal A/B met back-up B/C; annuleer eerst, bevestig daarna; probeer openstaande gewijzigde werkkopieën. | Annuleren wijzigt niets; A behouden, B inclusief reports vervangen, C toegevoegd; conflicterend open werk eerst oplossen. | | |
| T35 · UC-015 | Herstel apart naar een gevulde doelmap; haal historische 3MF en reports terug. | Nieuwe submap; exacte historische bytes, afbeeldingen, metingen, nominale waarden, parameters, suggesties en relaties hersteld. | | |
| T36 · UC-015 | Probeer een ongeldige of beschadigde back-up. | Begrijpelijke fout; bestaande workspace en geregistreerde gegevens blijven intact. | | |
| T37 · UC-018 | Bambu-werkkopie herhaald opslaan, één keer bevestigen en eerdere print via oud report terughalen. | Eén voorstel en één nieuwe versie; oude combinatie reproduceerbaar, ook na herstart/herstel. | Pass (eerder) | Eerder door gebruiker geaccepteerd; alleen herhalen bij regressie. |
