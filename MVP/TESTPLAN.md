# Functionele acceptatie 0.2.6

Open de repository in VS Code. Start via F5 (**PRC: Start met browser**) en gebruik een aparte testworkspace. De bestaande voorbeeldbestanden kun je via Import Part registreren. UC-018 blijft door de gebruiker geaccepteerd.

| Proef | Handeling | Verwacht resultaat |
| --- | --- | --- |
| Plaatbeelden | Open een geregistreerde 3MF met meerdere platen; selecteer ook een oudere Part version. | Genummerde PNG’s horen bij precies die gekozen revisie. Het zijn de opgeslagen plaatbeelden. |
| UC-015-preview | Kies Settings → Restore backup en een voltooide back-upmap. | Vóór bevestiging staan naam, datum indien bekend, omvang, Part-aantal en toe te voegen/vervangen nummers in beeld. |
| UC-015-merge | Gebruik Parts A/B lokaal en B/C in de back-up; annuleer eerst, bevestig daarna. | Annuleren wijzigt de workspace niet. Na bevestiging is A behouden, B inclusief reports vervangen en C toegevoegd. |
| UC-015-reportbewijs | Bewaar een report met foto, meting en parameter. Maak back-up en herstel. | Dezelfde foto, meting, parameterwaarde en Part-versionkoppeling zijn beschikbaar. |
| UC-008 zoeken | Zoek naam en nummer, voeg #tag toe en combineer met + PLA of het aanwezige materiaal. | Direct passende resultaten en herkenbare EN-criteria. Een query met een afsluitende + geeft een fout. |
| UC-008 parameters | Kies een bestandstype en een aanwezige projectparameter, bijvoorbeeld layer_height, met waarde 0.2. | Alleen Parts waarvan de actuele combinatie aan beide criteria voldoet verschijnen. |
| UC-008 printpoging | Maak een recente PLA-poging en een oudere PETG-poging. Zoek PETG binnen drie dagen. | De Part verschijnt alleen als dezelfde PETG-poging ook binnen de periode valt. |
| UC-008 bewaarde query | Bewaar een combinatie met relatieve periode, herstart PRC en kies die query. | De criteria worden hersteld en opnieuw uitgevoerd; de periode blijft relatief. |
| UC-003 procescontext | Selecteer de werkelijk geprinte Part version en Add print report. | Part, versie en 3MF-bron zijn zichtbaar. Bekende proceswaarden zijn beschikbaar; ontbrekende waarden zijn Unknown. |
| UC-003 meting/parameter | Vul verwachte en gemeten maat, eenheid en afwijking in; zoek een extra parameter en voeg die toe. | Het report bewaart het meetverslag en precies de geselecteerde parameterwaarden. |
| UC-003 afbeeldingen | Upload een foto en plak een screenshot met Ctrl+V. Sluit de dialoog en open opnieuw. | De invoer en afbeeldingen zijn terug. Na Save report blijven ze bij dezelfde versie, ook na herstart. |
| UC-003 resultaat | Bewaar twee pogingen op dezelfde versie, waaronder Failed of Aborted. | Twee afzonderlijke rapporten; de Part version blijft gelijk. Opnieuw versturen van dezelfde opslagactie dupliceert het rapport niet. |

De geautomatiseerde tests gebruiken tijdelijke workspaces. **PRC: Test functionaliteit** controleert opslag, migratie, querylogica en merge. **PRC: Test browserflow** gebruikt lokale Chrome en echte STL/3MF-samples voor plaatbeelden, rapportconcept, upload, filters en herstelpreview. Handmatig klembordplakken en uitzonderingen zoals volle schijf blijven praktijkcontroles.

Metingen zijn in deze versie vrije tekst met expliciete eenheden; automatische afwijkingsberekening is UI-vervolgwerk. De reportlimieten staan in de README. Reportconcepten staan in lokale browseropslag, definitief opgeslagen reports in de workspace.
