# PrintChill — SolidWorks metadata-POC

**Doelinstallatie: SolidWorks Design Premium 2026 SP0, 64-bit Windows.**

Dit is VBA-broncode, geen kant-en-klaar `.swp`-bestand. De bron is nog niet gecompileerd of uitgevoerd in SolidWorks. De API-majorcontrole verwacht 34 (SolidWorks 2026); de exacte editie en SP0 moet je zelf controleren onder Help → About. Nieuwere servicepacks binnen 2026 worden niet automatisch geweigerd, maar zijn geen bewezen testplatform.

## Installatie

1. Download [ExportProperties.bas](ExportProperties.bas) via GitHub of haal de repository op met `git pull`.
2. Start SolidWorks Design Premium 2026 SP0.
3. Kies **Tools / Extra → Macro → New / Nieuw**. Bewaar bijvoorbeeld `PrintchillExportProperties.swp` op een lokale locatie.
4. In de VBA-editor: verwijder de automatisch aangemaakte lege standaardmodule via rechtsklik → Remove (exporteren is niet nodig voor die lege module). Laat eventuele andere modules van bestaande macro’s ongemoeid; gebruik voor deze proef een nieuwe macro.
5. Kies **File → Import File** en importeer `ExportProperties.bas`. De regel `Attribute VB_Name` wordt door de importer verwerkt; plak die regel niet rechtstreeks in de code-editor.
6. Controleer **Tools → References**: de lokale **SOLIDWORKS 2026 Type Library** en **SOLIDWORKS 2026 Constant Type Library** moeten aangevinkt zijn. Herstel eventuele `MISSING`-verwijzingen. ADODB en FileSystemObject worden late-bound gebruikt; geen Office-reference vereist.
7. Kies **Debug → Compile**. Meld een compileerfout met de exacte tekst en gemarkeerde regel; deze stap kan hier niet worden uitgevoerd.
8. Bewaar het `.swp`-bestand. Voer `PrintchillExportProperties.main` uit via de editor of **Tools → Macro → Run**.

De `PtrSafe`-declaraties zijn bedoeld voor de 64-bit VBA-omgeving. Er worden geen macrobeveiligingsinstellingen gewijzigd; volg je lokale beveiligingsbeleid.

## Eerste test

1. Gebruik een kopie van `7382-4916 - makita blower wall mount.SLDPRT` waarin de property `test123_printchill` is opgeslagen. Begin met een zelfstandig part zonder externe referenties.
2. Sluit dit part vóór je de macro uitvoert. Ook een ander geopend part met dezelfde bestandsnaam wordt geweigerd. Andere documenten mogen openblijven.
3. Bij het starten verschijnt een Windows-bestandskiezer met een `.sldprt`-filter. Selecteer het gesloten part en klik op **Openen**. De macro valideert het bestand en opent het daarna expliciet read-only. Annuleren stopt zonder export.
4. Kies bij de tweede prompt een volledig pad naar een **nieuw** `.json`-bestand in een bestaande schrijfbare map. Annuleren stopt de run. Bestaande uitvoer wordt niet overschreven.
5. Controleer de melding en de velden `status`, `warnings` en `errors` in de JSON. `partial` kan een bruikbare export betekenen, met bijvoorbeeld gecachete/onopgeloste properties. De melding onderscheidt dit van `complete`.

De macro exporteert nu **schema 0.2**. De oorspronkelijke basisexport is door de gebruiker succesvol uitgevoerd; de nieuwe extractors moeten nog in SolidWorks Design Premium 2026 SP0 worden getest. Er wordt geen STL gemaakt en niets naar een server gestuurd.

## Uitgebreide gegevens in schema 0.2

| JSON-groep | Gegevens |
| --- | --- |
| `summary` | Titel, onderwerp, auteur, keywords, opmerkingen, laatst opgeslagen door, interne aanmaak- en opslagdatums in beide API-weergaven |
| `filesystem` | Grootte, Windows-aanmaak-/wijzigings-/toegangstijd en attributenbitmasker |
| `document_properties` | Alle documentproperties met type, raw/resolved waarde en status |
| `configurations` | Alle configuratieproperties, beschrijving, alternatieve naam, commentaar, derived-status en partmateriaal/database |
| `document_data` | Documenttitel/type, eenheidinstellingen, vergelijkingen, opgeslagen SolidWorks-releasehistorie en directe referenties inclusief gebroken/geïmporteerde verwijzingen waar beschikbaar |
| `features` | Features en subfeatures: naam, type, ID, padindicatie en bestaande cut-list-properties, in de actieve configuratie |
| `bodies` | Beschikbare bodies inclusief verborgen bodies: naam, type, aantallen vlakken/randen en benaderende bounding box in meters, in de actieve configuratie |

### Interpretatie en grenzen

- Interne `last_saved_date_raw`/`last_saved_date_display` komen uit SolidWorks SummaryInfo. `filesystem.modified_local` is een Windows-bestandsdatum. Geen van beide is een unieke revisie-ID. De datumteksten uit SolidWorks worden niet als UTC geïnterpreteerd.
- `saved_version_history.entries_raw` bevat SolidWorks-saveversiecodes, niet iedere save of een Printchill-revisiereeks. De runtimeversie staat nog steeds apart in `source.solidworks_version`.
- Optionele velden hebben `status: available/unavailable` en een waarde. Een niet ondersteunde API-aanroep geeft een waarschuwing; dit stopt niet de gehele export. Groepsfouten staan expliciet in `errors` of `warnings`; bij `partial` altijd die collecties controleren.
- Configuratiegeometrie wordt niet geactiveerd. Bodies en cut-lists gelden uitsluitend voor de reeds actieve configuratie; cut-lists worden niet bijgewerkt. Materiaal op partniveau kan afwijken van overrides op bodies.
- Bounding boxes zijn volgens de API benaderingen; niet gebruiken als unieke fingerprint of precisiemeting.
- Featuretraversal wordt begrensd op 10000 entries en 64 niveaus, met waarschuwing bij begrenzing. Paden en feature-ID’s zijn herkenningspunten, geen gegarandeerde externe revisiesleutels.
- Er worden geen rebuild, configuratiewissel of massa-evaluatie aangevraagd. De extractor leest geladen modeldata; dat is geen bewijs dat alle data actueel berekend is.
- Volledige topologie/mesh, iedere interne attribuutparameter, alle dimensies en geometrie van inactieve configuraties zijn geen onderdeel van deze versie. SHA-256 blijft een afzonderlijke controle.
- Referentiepaden, materiaaldatabasepaden en auteurgegevens kunnen gevoelig zijn. Controleer het rapport voordat je het deelt.

Controleer bij de volgende proef vooral de interne opslagdatums en `last_saved_by` tegen **File → Properties** in SolidWorks. Doe twee exports rond een echte save om te onderzoeken wat verandert, naast de bestaande tests voor bronhash, configuratie, Unicode en annuleren.

De gebruikersproef meldde dat `IsOpenedReadOnly()` na `OpenDoc6` onwaar was, ondanks de gevraagde read-only-optie. De oorzaak is nog niet vastgesteld. De macro probeert daarom uitsluitend voor het zelf geopende document de officieel ondersteunde `SetReadOnlyState(True)` en controleert zowel het resultaat als `IsOpenedReadOnly()` opnieuw, vóór metadata-extractie. Bij succes staat een waarschuwing in de JSON; bij mislukking stopt de macro. Dit verandert de toegangsstatus in de SolidWorks-sessie, niet de CAD-properties of bestandsrechten op schijf. De werking van deze vervolgstap moet nog in SP0 worden getest.

Correctie na een volgende gebruikersproef: de foutmelding liet `SetReadOnlyState=True` én `IsOpenedReadOnly=True` zien. De oorspronkelijke `Not`-controle kan dus een waar resultaat onjuist hebben afgewezen; de eerdere conclusie dat OpenDoc6 geen read-only sessie leverde is daarmee niet bewezen. Vergelijkingen gebruiken nu expliciet `= False`, zodat een COM-waarwaarde van 1 niet door bitwise `Not` wordt misgeclassificeerd. De exacte numerieke COM-retourwaarde is niet gemeten; de gecorrigeerde controle moet opnieuw worden getest.

## JSON controleren

Op een pc met Python:

```powershell
python -m json.tool "C:\Test\part.SLDPRT.printchill.json"
```

Of met de ingebouwde PowerShell-parser:

```powershell
$report = Get-Content -Raw -Encoding UTF8 -LiteralPath 'C:\Test\part.SLDPRT.printchill.json' | ConvertFrom-Json
$report.status
$report.document_properties | Where-Object name -eq 'test123_printchill'
$report.configurations | ForEach-Object {
    $_.name
    $_.properties | Where-Object name -eq 'test123_printchill'
}
$report.warnings
$report.errors
```

Controleer de gevonden naam, scope en raw/resolved waarde naast de SolidWorks Property-dialog. Een lege collection is anders dan `null`: `null` met een fout betekent dat een groep niet volledig kon worden gelezen.

## Read-only onafhankelijk controleren

Bereken in PowerShell de bronhash vóór en na de run:

```powershell
$partPath = 'C:\Test\part.SLDPRT'
$before = (Get-FileHash -LiteralPath $partPath -Algorithm SHA256).Hash
# Voer nu de macro in SolidWorks uit.
$after = (Get-FileHash -LiteralPath $partPath -Algorithm SHA256).Hash
$before -eq $after
```

Verwacht `True`. De macro controleert zelf alleen bronbestandsgrootte en wijzigingstijd vóór en na uitlezen; die controle vervangt geen hash. Ze roept geen saves, rebuilds, propertysetters of configuratieactivaties aan. Lezen gebeurt met `Get6(..., True, ...)`: berekende waarden kunnen uit cache komen en zijn niet gegarandeerd actueel. Add-ins en externe processen vallen buiten de controle van deze macro.

## Terug te leveren voor de POC

Bij een runtimefout toont de macro de stap, foutcode en foutbron. Stuur die melding mee. Voor de exacte regel kun je in de VBA-editor tijdelijk **Tools → Options → General → Error Trapping → Break on All Errors** kiezen. Bij een fout stopt VBA dan op de regel; stuur een screenshot voordat je verdergaat. Zet de oorspronkelijke instelling daarna terug. Als je de uitvoering met Reset afbreekt, kan het door de macro read-only geopende testpart nog openstaan; sluit dit zonder opslaan voordat je opnieuw test.

- Gegenereerde JSON, na controle op auteurgegevens en overige gevoelige metadata.
- Exacte SolidWorks-editie/SP en eventuele meldingen.
- Of de bronhash gelijk bleef en het part na afloop gesloten was.
- Of een vooraf geopend ander document behouden bleef.

Voer ook tests uit met een leeg propertyveld, dubbele namen op document-/configuratieniveau en tekst met quotes, backslashes, regeleinden en Unicode. Zie [het volledige POC-plan](../dev%20docs/SOLIDWORKS_JSON_POC.md).
