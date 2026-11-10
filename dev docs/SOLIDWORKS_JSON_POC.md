# PrintChill — Read-only SolidWorks naar JSON

## Doel en status

Onderzoeks- en implementatieplan voor een kleine VBA-testmacro in SolidWorks 2026. De macro opent een gekozen `.sldprt` read-only en exporteert beschikbare metadata naar een JSON-bestand voor een latere tool.

**Status:** VBA-bron beschikbaar in [macros/ExportProperties.bas](../macros/ExportProperties.bas), met [installatie- en testinstructies](../macros/README.md). Doelinstallatie: **SolidWorks Design Premium 2026 SP0, 64-bit**. Nog niet in SolidWorks gecompileerd of uitgevoerd. De eerste versie implementeert document-/configuratieproperties en vijf summaryvelden; cut-lists en configuratiebeschrijvingen zijn nog niet geïmplementeerd. Zie [[USECASES#UC-001]] en [[DJF]]. Dit is een vervolg op [[POC]], geen definitieve architectuur.

## Wat betekent ‘alle attributes’?

> [!info] Implementatie-update — schema 0.2
> De basisexport is inmiddels door de gebruiker uitgevoerd op een part: geldige JSON, property `hashkey`, read-only gerapporteerd en geen dirty-flag of fouten. De bronhash is niet onafhankelijk bevestigd. De macro is daarna uitgebreid met alle SummaryInfo-velden (inclusief last saved/by), Windows-bestandsgegevens, configuratiedetails/materialen, releasehistorie, referenties, vergelijkingen, actieve feature/cut-list-inventaris en bodies met benaderende bounds. Deze nieuwe extractors zijn nog niet in SolidWorks getest. De oorspronkelijke tabel en het v0.1-contract hieronder beschrijven de eerste proef; de actuele v0.2-scope en beperkingen staan in [macros/README.md](../macros/README.md).

SolidWorks heeft geen enkele API-aanroep die alle documentgegevens als JSON teruggeeft. Custom properties en SolidWorks API Attributes zijn bovendien verschillende mechanismen.

| Gegevensgroep | Eerste proef | Afbakening |
| --- | --- | --- |
| Documentbrede custom properties | Ja | Alle namen die de propertymanager retourneert |
| Configuratiespecifieke custom properties | Ja | Iedere configuratie apart, zonder gelijknamige documentproperties te overschrijven |
| Summary information | Ja | Beschikbare vaste velden zoals titel, onderwerp, auteur, keywords en comments; geen garantie dat deze zijn ingevuld |
| Documentcontext | Ja | Bestandsnaam, documenttype, SolidWorks-versie, actieve configuratie, read-only- en dirty-status |
| Configuratiecontext | Ja | Configuratienaam en beschikbare beschrijving; actieve configuratie herkennen |
| Cut-list custom properties | Beperkt | Bestaande folders van de actieve configuratie uitlezen zonder update; niet claimen dat dit alle configuraties afdekt |
| API Attributes (`IAttribute`) | Vervolgonderzoek | Speciale attributen op features, bodies of andere entiteiten; niet hetzelfde als een custom property |
| Materiaal, massa, afmetingen, featureparameters | Later | Configuratie-, resolutie- en geometrieafhankelijk; aparte extractors en afspraken nodig |
| Volledige interne bestandsinhoud | Nee | Geen generieke, ondersteunde dump van alle interne streams of verborgen gegevens |

De property `test123_printchill` moet in de custom-propertycollectie terechtkomen als deze via de normale document- of configuratieproperties is toegevoegd. Niet uitsluitend op deze naam filteren.

## Read-only-contract

1. De gebruiker kiest een bestaand part en een JSON-uitvoerlocatie buiten het CAD-bestand.
2. Als hetzelfde document al in SolidWorks openstaat, stopt de eerste macroversie met uitleg. Zo voorkomen we export van niet-opgeslagen sessiewijzigingen en onbedoeld sluiten van een gebruikersdocument. Een geavanceerde sessiemodus kan later apart worden ontworpen.
3. Open met `ISldWorks.OpenDoc6`, documenttype part, `swOpenDocOptions_ReadOnly` en eventueel `swOpenDocOptions_Silent`. Controleer het geretourneerde document en de load-error/warningcodes; ‘silent’ betekent niet automatisch ‘geslaagd’.
4. Controleer de read-only-toestand met `IModelDoc2.IsOpenedReadOnly()`. De oorspronkelijke aanroep `GetReadOnlyState` veroorzaakte in de gebruikersproef fout 438 en is vervangen. Een volgende proef leverde `False` op ondanks de OpenDoc6-optie; oorzaak onbekend. De macro mag alleen het zelf geopende document via `SetReadOnlyState(True)` expliciet read-only maken. Controleer vervolgens het setterresultaat én `IsOpenedReadOnly()` opnieuw vóór extractie. Registreer deze fallback als waarschuwing; bij onjuiste of onbekende toestand stoppen. Geen broninhoud of bestandsrechten op schijf aanpassen. De fallback is nog niet in de doelinstallatie geverifieerd.
5. Roep geen Save, SaveAs, Set-property, rebuild, cut-list-update of configuratieactivatie aan. Niets aan exportinstellingen of custom properties wijzigen.
6. Sluit alleen het document dat de macro zelf heeft geopend, ook bij een fout, zonder opslaan.
7. Schrijf JSON eerst naar een nieuw tijdelijk bestand en publiceer het pas na succesvolle serialisatie. Bestaande JSON nooit stilzwijgend overschrijven.

Read-only beschermt tegen opslaan door deze macro; het bewijst niet dat andere processen het bestand niet kunnen wijzigen. Andere add-ins kunnen bovendien reageren op het openen van documenten. Voor een strengere proef: werk met een bronkopie, geen externe referenties en controleer de bronhash vóór en na de run met een afzonderlijke tool.

## API-aanpak

| Stap | API | Aandachtspunt |
| --- | --- | --- |
| Bestandsproperties | `model.Extension.CustomPropertyManager("")` | Lege configuratienaam betekent documentniveau |
| Configuraties enumereren | `model.GetConfigurationNames()` | Lege/ontbrekende retourwaarden opvangen |
| Configuratieproperties | `model.Extension.CustomPropertyManager(configurationName)` | Lezen zonder de configuratie expliciet te activeren |
| Propertynamen | `ICustomPropertyManager.GetNames()` | Ook lege collecties als lege arrays exporteren |
| Propertytype | `ICustomPropertyManager.GetType2(name)` | Enumcode en leesbaar label bewaren |
| Waarden | `ICustomPropertyManager.Get6(name, True, raw, resolved, wasResolved, linked)` | Cached mode; retourstatus en flags bewaren, geen vers berekende waarde beloven |
| Summary information | `IModelDoc2.SummaryInfo` met `swSummInfoField_e` | Vaste, expliciete lijst velden; schrijfbare API alleen lezen |
| Cut-list | Bestaande features/subfeatures met type `CutListFolder`; `feature.CustomPropertyManager` | Alleen actieve-configuratiecontext, geen `UpdateCutList` of rebuild |
| Documentstatus | `IsOpenedReadOnly()`, `GetSaveFlag`, actieve configuratie | Begin- en eindstatus vastleggen; onverwachte dirty-status als waarschuwing behandelen |

Cachegebruik kan betekenen dat een berekende waarde ontbreekt of verouderd is. `wasResolved` en de Get6-retourcode zijn API-observaties, geen bewijs dat massa of materiaal zojuist opnieuw is berekend. Bewaar beide; maak er geen vereenvoudigd ‘actueel=true’ van.

Een later expliciet gekozen evaluated-modus mag configuraties activeren en berekeningen uitvoeren in een tijdelijke sessie, maar heeft andere garanties. Die modus hoort niet stilzwijgend bij deze eerste proef.

## JSON-contract — voorstel v0.1

Eigenschappen worden arrays met een expliciete scope. Zo blijven gelijke propertynamen op verschillende niveaus behouden. Raw en resolved blijven strings: een lokale waarde `12,5` of een expressie mag niet stilzwijgend als JSON-getal worden geïnterpreteerd.

```json
{
  "schema_version": "0.1",
  "export_id": "EXAMPLE-EXPORT-ID",
  "exported_at_utc": "2026-11-10T12:00:00Z",
  "status": "partial",
  "source": {
    "file_name": "example.SLDPRT",
    "document_type": "part",
    "solidworks_version": "record actual version",
    "active_configuration": "Default",
    "opened_by_extractor": true,
    "read_only": true,
    "dirty_before": false,
    "dirty_after": false
  },
  "extraction": {
    "mode": "cached",
    "rebuild_requested": false,
    "configuration_activation_requested": false,
    "scope": ["document_properties", "configuration_properties", "summary", "active_cut_lists"]
  },
  "summary": {"title": "", "author": "", "comments": ""},
  "document_properties": [
    {
      "name": "test123_printchill",
      "type_code": null,
      "type_label": "text",
      "raw_value": "example-value",
      "resolved_value": "example-value",
      "read_status_code": null,
      "read_status": "record actual Get6 result",
      "was_resolved": true,
      "linked_to_property": false,
      "error": null
    }
  ],
  "configurations": [
    {"name": "Default", "is_active": true, "properties": []}
  ],
  "cut_lists": [],
  "unsupported_groups": ["api_attributes", "geometry", "computed_mass"],
  "warnings": ["Illustrative JSON; not a real extraction"],
  "errors": []
}
```

Dit is een illustratie, geen resultaat van het aangeleverde SolidWorks-bestand. Werkelijke enumcodes en waarden moeten door de macro worden ingevuld.

### Contractregels voor de volgende tool

- `status`: `complete`, `partial` of `failed`, steeds ten opzichte van de gedeclareerde scope. Ontbrekende groups buiten scope zijn geen geslaagde extractie van ‘alles’.
- Geen properties aanwezig: `[]`. Niet uitleesbaar: fout met scope en propertynaam; niet vervangen door een schijnbaar lege collectie.
- `null` betekent onbekend/niet beschikbaar; `""` is een werkelijk lege tekstwaarde.
- Gelijke namen op document- en configuratieniveau afzonderlijk bewaren. Een eventuele effectieve waarde pas in de volgende tool bepalen, met herkomst erbij.
- UTF-8-uitvoer; JSON-escaping voor quotes, backslashes, tabs, regeleinden en control characters. Unicode correct behouden. Geen simpel samenvoegen van ongeëscapeerde VBA-strings.
- Geen extra JSON-parserdependency nodig voor alleen schrijven; een kleine geteste serializer volstaat. Bij een externe library eerst licentie en distributie afwegen.
- Geen automatisch uitvoeren van gevonden expressies, links of commando’s door de volgende tool.
- Absolute werkplekpaden en auteurgegevens alleen exporteren als nodig; de JSON kan gevoelige metadata bevatten.
- Een export-ID identificeert de uitleesactie, niet de CAD-revisie. Een bronhash kan een afzonderlijke tool aan de JSON toevoegen; geen revisies uit bestandsnamen raden.

## Testplan

| Test | Verwacht bewijs |
| --- | --- |
| Aangeleverd part met `test123_printchill` | Naam, scope en waarde komen overeen met SolidWorks Property-dialog; geen aannames over de waarde |
| Dezelfde naam documentbreed en in twee configuraties | Alle drie apart teruggevonden |
| Lege properties en lege configuratiecollecties | Geldige JSON en lege arrays waar terecht |
| Quotes, backslashes, Unicode, tabs en regeleinden | JSON-parser leest exact dezelfde strings terug |
| Formuleproperty en nooit geactiveerde configuratie | Raw expressie, eventuele cached waarde, retourcode en waarschuwing zichtbaar |
| Al geopend document met niet-opgeslagen wijzigingen | Eerste macroversie stopt zonder sessie te wijzigen of document te sluiten |
| Leesfout of ongeldig document | Geen succesmelding; duidelijke loadcodes en fout |
| JSON-uitvoer niet schrijfbaar of al bestaand | Geen overschrijving en geen half geschreven eindbestand |
| Cut-list in actieve en andere configuratie | Alleen aanwezige actieve context claimen; beperkingen expliciet |
| Bronbestand vóór en na de run | Identieke SHA-256; geen save/rebuild aangevraagd; alleen eigen document gesloten |

**Nog niet uitgevoerd:** alle SolidWorks-runtimecontroles. Een Windows-pc met SolidWorks 2026 is nodig. De cloudomgeving kan de COM-macro niet betrouwbaar uitvoeren. JSON-validiteit alleen bewijst niet dat de SolidWorks-API goed is aangeroepen.

## Aanbevolen volgende stap

Bouw eerst de minimale macro voor document- en configuratieproperties plus summary information. Test deze op het aangeleverde part en controleer de JSON met een normale parser. Voeg pas daarna cut-list-extractie en aanvullende metadata toe. Zo isoleren we API- en serialisatiefouten voordat STL-export en 3MF-relaties worden toegevoegd.

## Later: uitlezen zonder SolidWorks te openen

De VBA-testmacro vereist een draaiende SolidWorks-sessie. Voor de latere Printchill-tool onderzoeken we **SolidWorks Document Manager** als afzonderlijke uitleesroute. Deze Windows/COM-component kan opgeslagen custom properties, configuratiegegevens, bestandsreferenties en beschikbare previews lezen zonder de volledige SolidWorks-applicatie te starten of te installeren. De Document Manager-component en bijbehorende prerequisites moeten wel worden geïnstalleerd.

| Route | Vereisten | Geschiktheid en beperkingen |
| --- | --- | --- |
| VBA-testmacro | Geïnstalleerde en draaiende SolidWorks-applicatie | Eerste proef, metadata controleren en later export via de CAD-engine |
| Document Manager-worker | Windows, Document Manager-component en geschikte licentiesleutel | Metadata op de achtergrond uitlezen; geen volledige CAD-engine of rebuild |
| SolidWorks-automatisering | Geschikte SolidWorks-installatie en licentie; een SolidWorks-proces draait | Rebuilds, actuele berekeningen en STL-export; meer sessiebeheer en risico op blokkerende dialoogvensters |

Voorgestelde vervolgrichting, nog geen vastgesteld architectuurbesluit:

```text
Printchill → uitleesopdracht → Windows-worker met Document Manager
                                      ↓
                          JSON volgens hetzelfde contract
                                      ↓
                                  Printchill
```

### Voorwaarden en open punten

- Document Manager vereist een aparte sleutel. De officiële SolidWorks-supportpagina vermeldt een gratis sleutel voor klanten met een actief abonnement. Controleer vóór implementatie de actuele voorwaarden, beschikbare functionaliteiten, versiecompatibiliteit en rechten voor gebruik/distributie binnen een open-sourceproduct. Neem geen sleutel op in code, repository of voorbeeldconfiguratie.
- Document Manager leest opgeslagen gegevens; het bouwt het model niet opnieuw op. Berekende properties kunnen ontbreken of verouderd zijn. Geen algemene nieuwe STL-export of actuele massa beloven via deze route.
- Behoud het JSON-contract als grens naar de verwerkingstool, maar vermeld de extractor en capabilities. Document Manager hoeft niet dezelfde gegevens en statusinformatie te leveren als de macro. Niet-beschikbare velden expliciet markeren; geen gelijkwaardigheid aannemen zonder vergelijking.
- Voeg bij een worker onder meer foutafhandeling, geschikte COM-initialisatie, gecontroleerde bestandsverwerking en beveiliging van opdrachten toe. De uitvoeringsvorm wordt pas na de POC bepaald; niet aannemen dat iedere COM-component probleemloos als Windows-service werkt.
- Gebruik ‘SolidWorks verborgen starten’ niet als standaardroute voor eenvoudige metadata-extractie. Dat blijft een volledige CAD-sessie met licentie-, sessie- en dialoogafhankelijkheden.

### Vervolgverificatie

Na de macroproef: controleer sleuteltoegang en SDK-voorwaarden, lees hetzelfde testpart via Document Manager en vergelijk namen, scopes, raw/resolved waarden en ontbrekende gegevens met de macro-uitvoer. Rapporteer verschillen expliciet voordat een backgroundprocessor wordt gekozen.

**Status:** Document Manager-route nog niet geïmplementeerd, gelicentieerd of getest in dit project.

## Bronnen

- [SolidWorks 2026 SummaryInfo](https://help.solidworks.com/2026/english/api/sldworksapi/SolidWorks.Interop.sldworks~SolidWorks.Interop.sldworks.IModelDoc2~SummaryInfo.html) en [alle summaryvelden](https://help.solidworks.com/2026/english/api/swconst/SolidWorks.Interop.swconst~SolidWorks.Interop.swconst.swSummInfoField_e.html)
- [VersionHistory: opgeslagen releases, geen per-save historie](https://help.solidworks.com/2026/english/api/sldworksapi/SolidWorks.Interop.sldworks~SolidWorks.Interop.sldworks.ISldWorks~VersionHistory.html)
- [GetDependencies](https://help.solidworks.com/2026/english/api/sldworksapi/SolidWorks.Interop.sldworks~SolidWorks.Interop.sldworks.IModelDocExtension~GetDependencies.html)
- [Configuratiemateriaal](https://help.solidworks.com/2026/english/api/sldworksapi/SolidWorks.Interop.sldworks~SolidWorks.Interop.sldworks.IPartDoc~GetMaterialPropertyName2.html)

- [SOLIDWORKS API-support en officiële documentatie](https://www.solidworks.com/sw/support/api-support.htm)
- [Document Manager: functionaliteiten en beperkingen](https://www.codestack.net/solidworks-document-manager-api/)
- [Custom properties op document-, configuratie- en cut-listniveau](https://www.codestack.net/solidworks-api/data-storage/custom-properties/)
- [Concreet uitleesvoorbeeld met GetNames, Get6, cache, retourstatus en linked-state](https://www.codestack.net/solidworks-api/data-storage/custom-properties/read-all-properties/)
- [Verschil met SolidWorks API Attributes](https://www.codestack.net/solidworks-api/data-storage/attributes/)

De technische voorbeelden zijn secundaire bronnen. Exacte signatures en enumwaarden bij bouw verifiëren tegen de SolidWorks 2026 API/typebibliotheek; geen webvoorbeeld blind als geteste macro beschouwen.
