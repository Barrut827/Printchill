# PrintChill voor Windows · MVP 0.1.1

Met deze handleiding installeer je de pilot en beheer je de lokale werkmap (workspace). De knopnamen hieronder komen overeen met de Engelstalige interface.

## Eerste start

1. Pak de volledige pilot-ZIP uit op een Windows x64-pc. Dubbelklik op `start.cmd`. PrintChill opent in je standaardbrowser. Voor een snelkoppeling in het startmenu gebruik je `install.cmd`. De ZIP bevat de benodigde Node-runtime en de bijbehorende licentie.
2. Open **Settings**. Kies met **Browse** een lege lokale map voor een nieuwe workspace of wijs een bestaande PRC-workspace aan. Kies een locatie buiten netwerkschijven en synchronisatiemappen. Klik op **Connect workspace**.
3. Staat Bambu Studio op een afwijkende locatie? Selecteer dan in **Settings** het bestand `bambu-studio.exe`. Laat de lokale PRC-backend draaien tijdens het werken in Bambu Studio.

Met **Import Part** registreer je een STL, 3MF of CAD-bestand (SLDPRT of STEP). PRC bewaart eigen kopieën. In de bibliotheek vind je een Part op naam of nummer.

De volledige ontwerpworkflow en de acceptatiecriteria staan in de projectdocumentatie bij [UC-018 — Een printontwerp aanpassen en de eerdere print reproduceren](../dev%20docs/USECASES.md#uc-018-een-printontwerp-aanpassen-en-de-eerdere-print-reproduceren). Deze verwijzing is bedoeld voor de bronrepository.

## Back-up en herstel

- **Back-up maken:** kies **Settings → Create backup** en selecteer een lege map buiten de workspace. De back-up bevat de geregistreerde versies, bestanden en printrapporten. Bevestig openstaande wijzigingen vooraf als je ze wilt meenemen.
- **Herstellen:** kies **Settings → Restore backup**. Selecteer als bron de back-upmap met `backup.json`. Kies vervolgens de bestemming en klik op **Restore and open**. Bij een lege doelmap herstelt PRC rechtstreeks in die map. Bevat de doelmap al bestanden, dan maakt PRC daarin een submap `PRC-restored-…` en opent die als workspace.

De workspace gebruikt SQLite voor de registraties en bewaart de bijbehorende bestanden lokaal. Bepaal met de Windows-maprechten wie toegang heeft tot de workspace en de back-ups.

## Bijwerken naar een nieuwe pilotversie

Maak eerst een back-up. Stop de oude backend met Ctrl+C als je hem vanuit een terminal hebt gestart. Draait hij op de achtergrond, meld je dan af en weer aan bij Windows. Pak het nieuwe pakket uit, start het met `start.cmd` en selecteer zo nodig je bestaande workspace.

## Voor ontwikkelaars

Voer de volgende opdrachten uit vanuit de map `MVP` op Windows x64 met Node 24. De tests gebruiken de voorbeeldbestanden uit de repository.

| Doel | Opdracht |
| --- | --- |
| Starten vanuit de broncode | `.\start.cmd` |
| Opslag en lokale API testen | `node --test store.test.mjs server.test.mjs` |
| Pilot-ZIP bouwen | `.\build.ps1` |

Deze versie ondersteunt databaseschema 1. Controleer bij een nieuwe distributie ook de installatie op een schoon Windows-account en de upgrade met een bestaande workspace.
