# Document Manager zonder sleutel

Voer uit vanuit de repository, met SolidWorks gesloten:

```powershell
powershell.exe -NoProfile -File .\scripts\Test-DocumentManager.ps1
```

Gebruik 64-bit Windows PowerShell bij een 64-bit Document Manager-installatie. Een andere testmap kan met `-InputFolder 'C:\Tests'`. Het script installeert of registreert niets en gebruikt uitsluitend `SwDocumentMgr.SwDMClassFactory`, met een lege sleutel. CAD-bestanden worden read-only geopend als de application beschikbaar komt. Er wordt geen SolidWorks-automatisering gestart.

Een uniek JSON-rapport verschijnt in `POC material`. Het bevat bronhashes, document-openresultaten en de documentproperties uit de bestaande macro-export als referentie. Het script exporteert zelf nog geen Document Manager-properties: deze proef toetst eerst toegang zonder sleutel.

| Resultaat | Betekenis |
| --- | --- |
| `failed`, stap `create_factory` | COM-component niet toegankelijk; bijvoorbeeld installatie, registratie of bitness. De sleutelvereiste is hiermee niet getest. |
| `empty_key_rejected`, of `failed` bij `get_application_empty_key` | Geen application met lege sleutel; de eventuele fout staat in het rapport. |
| `document_open_failed` | Application beschikbaar, maar minstens één bestand kon niet read-only geopend worden. |
| `opened_without_key` | Alle gevonden CAD-bestanden lokaal geopend met lege sleutel. Dit bewijst nog geen volledige metadata-extractie of distributierechten. |
| `blocked_solidworks_running` | Sluit SolidWorks en herhaal de proef. |
| `inconclusive_solidworks_started` | Na afloop draait SolidWorks; herhaal onder gecontroleerde omstandigheden. |
| `source_integrity_check_failed` | Bronhash gewijzigd of niet controleerbaar; inspecteer het rapport. |

Officieel vereist `GetApplication` een Document Manager-licentiesleutel. Verwacht daarom geen ondersteunde sleutelvrije route. Deze proef registreert het lokale gedrag; een ontbrekende component bewijst geen licentieweigering.

Bron: [SOLIDWORKS 2026 Getting Started](https://help.solidworks.com/2026/english/api/swdocmgrapi/GettingStarted-swdocmgrapi.html). Een Document Manager-key is volgens [API Support](https://www.solidworks.com/sw/support/api-support.htm) gratis voor klanten met een actief abonnement.
