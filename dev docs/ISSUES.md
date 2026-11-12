# PrintChill — Issuelijst

## Inhoudsopgave

- [ISS-001 — STL met gewijzigde naam herladen in Bambu Studio](#iss-001)

## ISS-001

**Titel:** STL met gewijzigde naam herladen in Bambu Studio

| Veld | Waarde |
| --- | --- |
| Status | Open, te onderzoeken |
| Gemeld | 2026-11-12 |
| Eigenaar | Nog te bepalen |
| Prioriteit | Nog te bepalen |
| Relatie | [[USECASES#UC-005]], alternatief A3 en UC-005-AC-08 |

De gebruiker meldt dat Reload from disk in Bambu Studio niet meer werkt wanneer een opnieuw geëxporteerde STL een andere bestandsnaam krijgt. Dit raakt de revisiebestandsnaam partnummer-naam-revisie.STL en het verder werken in een bestaand slicerproject.

### Te onderzoeken

1. Leg de gebruikte Bambu Studio-versie vast en maak een controlekopie van een project met een gekoppelde STL.
2. Exporteer een gewijzigde CAD-revisie als STL onder een nieuwe naam en probeer Reload from disk op het bestaande object.
3. Vergelijk het gedrag met herladen vanaf hetzelfde bestandspad en onderzoek beschikbare acties voor het kiezen of vervangen van de bron.
4. Controleer behoud van positionering, supports, painting en printinstellingen en de herleidbaarheid naar de nieuwe STL- en CAD-revisies.
5. Bewaar begin- en eindbestanden, stappen en foutmeldingen en leg de gekozen vervolgaanpak vast.

### Afronding

Het issue kan worden afgerond zodra reproduceerbaar testbewijs en een bruikbare workflow voor een gewijzigde STL-bestandsnaam beschikbaar zijn en UC-005 daarop is bijgewerkt. De praktijktest is nog niet uitgevoerd.

[Back to top](#inhoudsopgave)
