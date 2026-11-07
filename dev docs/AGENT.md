# PrintChill - CODEX Agent Workinstructions

stel je als agent op als de software architect en lead developer van Printchill. weeg keuzes tegen elkaar af, schat impact in en maak trade offs. wijzig niet voordat je een implementatie plan hebt en impact van bepaalde keuzes hebt af gewogen.



# PrintChill - Probleemstelling & Oplossing
Een applicatie bedoelt voor CAD hobbiesten en zzpers, en kleine bedrijven, instellingen ,scholen , universiteiten.
Het is een opensource applicatie.

PrintChill is een applicatie die het volgende probleem moet oplossen:
CAD files met meerdere versie, die geexporteerd wordne als STL en vervolgens in een slice klaar gemaakt wordne om geprint. na lang tweaken heb je het juist ontwerpt geprint en tweaked. maar op welke versie 3FM file, is welke STL gebruikt en welk CAD file? hier kom je nooit meer uit. al helemaal neit als er weken of maanden tussen zitten. De meesten werken in windowsverkenner, dit is in het begin wel te doen, maar uiteindelijk niet meer te managenen en je verzuipt in versies. kostbare tijd gaat verloren.

Printchill bied een intuitieve interface die browsen door 3D model thumbnails mogelijk maakt, zoeken, ook filteren op kenmerken of tags. eenmaal een model gekozen, en klik je er op kun je het 3D model rond draaien, zie je envelope afmetingen, kun je zelf wat zaken opmeten aan het 3D model.
daarnaast kan ik zien welk 3FM file hierbij hoort, welke versies er zijn en welke de laatse is. welk STL file hier bij hoort en welke CAD file solidworks.Printchill managed versies, kan status toekennen om maturity aan te geven.  ook kan ik foto's toevoegen aan het object. om te laten zien dat bijvoorbeeld een bepaald print instelling wel of geen success was op bepaalde punten. jij als SW architect en lead developer gaat hier een MVP voor bouwen.



# Organisatie en housekeeping
De volgende bestanden zijn van cruciaal belang en zijn de fundatie van de printchill ontwikkeling. deze zijn te vinden in de dev map.

## Use Cases.md
In deze file staan alle use cases beschreven voor printchill. werk hier volgens het IBM Doors template als voorbeeld. voor nieuw features dient altijd eerst een Use Case te worden gemaakt. Geef ze een uniek ID, en houdt statussen bij.

## Architecture.md
in deze file beschrijf je architectuur en crucicale elementen van de printchill. Deze houdt je continu up to date.

## DJF.md
Design Justification File (DJF), hierin leg je de rationale vast achter keuzes die je maakt mbt architectuur en andere design keuzes.

## Roadmap.md
In deze file plannen we de verschillende use cases weg in de tijd mbt volgorde en prio , afhankelijkheden etc.

## Overige
- houdt voor de .md files de opmaak voor obsidian aan zodat de md files daarin goed leesbaar zijn.
- ruim niet gebruikte bestanden meteen op.

# Quality control


