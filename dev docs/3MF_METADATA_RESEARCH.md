# PrintChill — Onderzoek identificatie in 3MF

## Inhoudsopgave

- [Conclusie](#conclusie)
- [Bewijs en beperkingen](#bewijs-en-beperkingen)
- [Kandidaten](#kandidaten)
- [Eigen metadata volgens de standaard](#eigen-metadata-volgens-de-standaard)
- [Vergelijking slicers](#vergelijking-slicers)
- [Betekenis van de identifiers](#betekenis-van-de-identifiers)
- [Detectie van opnieuw opslaan](#detectie-van-opnieuw-opslaan)
- [Vervolgproef](#vervolgproef)
- [Bronnen](#bronnen)

## Conclusie

Een eigen metadata-element met een geldige namespace en `preserve="true"` is de beste standaardgebaseerde kandidaat voor Printchill-identificatie. Het is geen garantie voor behoud in iedere slicer. In de onderzochte broncode zijn duidelijke verschillen tussen slicers zichtbaar.

Gebruik interne object-UUID’s en platformvelden niet als vervanging van een Printchill-revisie-ID. Een bewaarde ID bewijst bovendien niet dat de inhoud sinds het toekennen ongewijzigd is.

## Bewijs en beperkingen

- Aanleiding: POC-R01 in [[POC]]. De export-ID in de STL-header is in het onderzochte Bambu-project niet teruggevonden. `source_file` en een interne part-UUID zijn wel aanwezig.
- Dit onderzoek gebruikt de 3MF Core-specificatie en openbare broncode: Bambu Studio `master`, OrcaSlicer `main`, Cura `main`, libSavitar `main` en PrusaSlicer `version_2.9.4`.
- Ontwikkelbranches zijn niet noodzakelijk gelijk aan de geïnstalleerde releases. De bevindingen zijn geen garantie voor Bambu Studio 02.08.02.61 uit POC-R01.
- In deze werkplek zijn geen uitvoerbare Bambu Studio-, OrcaSlicer-, PrusaSlicer- of Cura-programma’s aangetroffen op het commandopad. Het originele 3MF van POC-R01 staat niet in de repository.
- Geen slicer-roundtrip uitgevoerd. De hieronder beschreven compatibiliteit is onderbouwd vanuit specificatie en code-inspectie; werkelijk openen, slicen en opnieuw opslaan blijven afzonderlijke tests.
- Dit is POC-onderzoek, geen implementatiebesluit. Architectuur volgt na afronding van de POC.

## Kandidaten

| Kandidaat | Bruikbaarheid | Beperking / advies |
| --- | --- | --- |
| Eigen modelmetadata, bijvoorbeeld `prcl:project_id` | Identiteit van een heel printproject | Eerste kandidaat; namespace en behoud na opslaan testen |
| Eigen `prcl:revision_id` en bronrelaties | Verwijzing naar een geregistreerde projectrevisie en gebruikte STL-revisies | Alleen bij gecontroleerde registratie actualiseren; niet bij iedere slicer-save automatisch correct |
| Core `object/@partnumber` | Standaard attribuut voor herkenning van onderdelen door een toolchain | Kan onderdeelidentiteit dragen, maar geen betrouwbare immutable revisie: de standaard voorziet behoud bij wijzigen en duplicatie bij splitsen |
| Core `item/@partnumber` | Herkenning van een build-item | PrusaSlicer 2.9.4 negeert dit expliciet in de onderzochte importer |
| Production Extension `p:UUID` | Identificatie van objecten/items in een 3MF-structuur | Geen bewezen Printchill-herkomst; slicers kunnen structuren opnieuw genereren. Bestaande IDs niet vervangen |
| Bambu part-`uuid` | Interne identificatie van een volume/part | Bambu gebruikt de part-GUID ook voor assemblyfunctionaliteit; niet overnemen of wijzigen als eigen veld |
| `source_file` | Verwijzing naar een bronbestand; export-ID in de bestandsnaam is een kandidaat | Pad/naam kan veranderen en wordt door slicers beheerd; geen bewijs van inhoudsidentiteit |
| `model_id` en vergelijkbare platformvelden | Bestaande model-/platformidentiteit | Kans op conflict met MakerWorld- of andere platformkoppelingen; niet gebruiken voor Printchill |
| `Title` / `Description` | Menselijk leesbare verwijzing als hulpmiddel | Kan door gebruiker of slicer worden gewijzigd; PrusaSlicer schrijft zelf deze velden |
| Eigen JSON-bestand als OPC-part | Uitgebreide bronrelaties zonder lange XML-waarden | Content type en relaties correct toevoegen; onbekende archiefdelen kunnen bij opslaan verdwijnen |

## Eigen metadata volgens de standaard

Voeg metadata toe aan het bestaande primaire modeldeel, vóór `resources`. Bepaal de locatie via de OPC-relatie naar het startmodel; ga niet voor alle bestanden blind uit van hetzelfde pad.

Illustratief fragment; voeg dit in de bestaande structuur in, vervang niet de bestaande modelroot of resources:

```xml
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
       xmlns:prcl="urn:printchill:metadata:1"
       unit="millimeter" xml:lang="en-US">
  <metadata name="prcl:project_id" preserve="true">PROJECT-UUID</metadata>
  <metadata name="prcl:revision_id" preserve="true">REVISION-UUID</metadata>
  <metadata name="prcl:source_revision_ids" preserve="true">["STL-REVISION-UUID"]</metadata>
  <!-- Bestaande resources en build blijven ongewijzigd. -->
</model>
```

- Core §3.4.1 staat vendor-metadata toe. De naam is een QName; de prefix moet op `model` naar een namespace verwijzen. Geen ongedefinieerde namen in de standaardnamespace toevoegen.
- Gebruik elk metadatanaamveld maximaal één keer. Meerdere bronrevisies kunnen als één gedocumenteerde JSON-lijst worden opgeslagen.
- Onbekende metadata hoort volgens de specificatie genegeerd te worden. `preserve="true"` vraagt om behoud, maar is een **SHOULD**, geen afdwingbare garantie.
- Maak onze namespace niet verplicht via `requiredextensions`: daarmee zou software die Printchill niet kent het model juist moeten weigeren.
- Per-objectmetadata kan via `metadatagroup` op ondersteunde object-/itemlocaties. Dat moet apart worden getest: behoud van projectmetadata bewijst geen behoud van onderdeelrelaties.
- Een onbekend attribuut op een willekeurige plek toevoegen is niet hetzelfde als een geldige extensie. Gebruik de toegestane extensiepunten en controleer het schema.

### Extra JSON in het archief

Een bestand zoals `Metadata/printchill.json` kan complexe relaties bevatten. Voeg een toepasselijk OPC-content type toe en een package-rootrelatie van het type:

```text
http://schemas.openxmlformats.org/package/2006/relationships/mustpreserve
```

Core §2.1.5 vraagt daarmee om behoud van het betreffende archiefdeel. Ook dit is geen aangetoond gedrag in alle slicers. Alleen een los JSON-bestand in de ZIP plaatsen is onvoldoende voor interoperabiliteit.

## Vergelijking slicers

| Slicer / onderzochte code | Bevinding | Gevolg voor proef |
| --- | --- | --- |
| Bambu Studio, `bbs_3mf.cpp` op `master` | De importer zet modelmetadata in `model_info.metadata_items`. De exporter neemt die map over en schrijft de namen/waarden terug | Kansrijke route voor eigen modelmetadata. `preserve` en de eigen namespace worden in het onderzochte schrijfpad niet generiek meegekopieerd; niet als gegarandeerd geldige roundtrip behandelen |
| OrcaSlicer, `bbs_3mf.cpp` op `main` | Vergelijkbare overdracht via `metadata_items`. Er zijn verschillende exportmodi die bepaalde applicatievelden verwijderen of aanpassen | Project opslaan en andere exportmodi apart testen. Ook hier ontbreekt generiek behoud van de oorspronkelijke namespace en `preserve` in het onderzochte schrijfpad |
| PrusaSlicer 2.9.4, `3mf.cpp` | `_handle_end_metadata` verwerkt specifieke bekende namen, zonder generieke opslag van onbekende modelmetadata. Export schrijft een eigen set metadata. Build-item-`partnumber` wordt expliciet genegeerd | Eigen metadata kan bij openen genegeerd en bij opslaan verloren worden. Geen behoud claimen; nieuwere releases afzonderlijk onderzoeken |
| UltiMaker Cura, `ThreeMFReader.py` / `ThreeMFWriter.py` | Modelmetadata gaat via de scene van reader naar writer | Kansrijk voor waarden; normale projectopening versus geometrie-import en een nieuw project apart testen |
| Cura-dependency libSavitar, `Scene.cpp` | Leest en schrijft metadata inclusief type/preserve. `toXmlNode` declareert expliciet core en Cura, zonder zichtbaar generiek kopiëren van eigen namespaces | Zelfs behoud van een waarde kan een ongebonden prefix opleveren. De volledige keten inclusief Cura moet worden getest, niet alleen libSavitar |

**Belangrijk:** Bambu en Orca bouwen XML opnieuw op. Een waarde `prcl:project_id` kan dus in de output blijven terwijl `xmlns:prcl` verdwijnt. Het XML-document kan nog well-formed zijn, maar de metadatanaam voldoet dan niet meer aan de 3MF-regel voor geldige QNames. Controleer beide.

Creality Print en andere slicers zijn aanvullende testkandidaten; gedrag mag niet uit een gedeelde codebasis worden afgeleid. Voor gesloten slicers is een bestandsproef nodig voordat compatibiliteit wordt geclaimd.

Het openen van geometrie tussen slicers is bovendien geen bewijs dat supports, profielen, painting en overige projectspecifieke instellingen worden overgenomen.

## Betekenis van de identifiers

- `project_id`: blijft gelijk voor de revisiereeks van een printproject.
- `revision_id`: verwijst naar een concrete, geregistreerde snapshot. Een gebruiker die doorwerkt en opslaat kan onbedoeld dezelfde waarde behouden; inhoudscontrole en nieuwe registratie zijn nodig.
- Bronrelaties: benoemen specifieke STL-revisies en bij meerdere objecten ook de toewijzing per onderdeel. Een losse project-ID is daarvoor onvoldoende.
- Een parent-revisie van een printproject is iets anders dan de STL-revisie waaruit het project is opgebouwd.
- De bestands-SHA-256 wordt berekend **na** het toevoegen van metadata en extern geregistreerd. Een hash van het hele bestand in datzelfde bestand opslaan creëert een zelfreferentieprobleem.
- Ingebedde metadata is een transport- en herkenningsmiddel, geen bewijs van authenticiteit of ongewijzigde inhoud.

## Detectie van opnieuw opslaan

**Onderzoeksvraag:** verandert bij elke save een attribuut dat als wijzigingssignaal kan dienen?

**Conclusie:** geen universeel, betrouwbaar save-attribuut aangetroffen. Een save, een bytewijziging en een inhoudelijke wijziging zijn verschillende gebeurtenissen. De onderstaande bevindingen komen uit code-inspectie, niet uit een uitgevoerde save-proef.

| Kandidaat | Waarneming | Bruikbaar voor iedere save? |
| --- | --- | --- |
| Bambu `ModificationDate` | Exporter maakt UTC-tijd en kapt deze met `substr(0, 10)` af tot `YYYY-MM-DD`. In POC-R01 staat `2026-11-08` | Nee: meerdere saves op dezelfde UTC-dag kunnen dezelfde waarde houden |
| Bambu `CreationDate` | In hetzelfde schrijfpad eveneens op de huidige UTC-datum gezet | Nee; in dit pad zelfs geen betrouwbare oorspronkelijke aanmaakdatum |
| PrusaSlicer 2.9.4 `ModificationDate` / `CreationDate` | Beide geschreven met alleen de datum, ook via `substr(0, 10)` | Nee: geen onderscheid tussen saves op dezelfde dag |
| OrcaSlicer `CreationDate` / `ModificationDate` | De onderzochte ontwikkelbranch schrijft lege waarden met de expliciete comment dat datums om privacyredenen niet worden opgeslagen | Nee; releaseversie apart testen |
| Cura `ModificationDate` | Writer probeert lokale datum en tijd tot op seconden te zetten (`%Y-%m-%d %H:%M:%S`) | Kandidaat, geen garantie: saves binnen dezelfde seconde kunnen gelijk zijn. Bovendien kopieert Cura bestaande metadata eerst; de onderzochte libSavitar-setter gebruikt `emplace`, dat bestaande sleutels niet overschrijft. Of de datum daadwerkelijk ververst wordt moet in de concrete Cura/dependencyversie worden getest |
| `Application` / formaatversie | Beschrijven software- en bestandsformaatversie | Nee; blijven doorgaans gelijk bij gebruik van dezelfde software |
| Bambu/Orca `p:UUID` | De onderzochte code bouwt verschillende waarden uit object-/item-ID’s en vaste suffixen. De build-UUID is zelfs een constante | Nee; deze UUID’s zijn geen save-teller of unieke bestandsrevisie |
| Bambu part-`uuid` | Identiteit van het part; bewaren daarvan is juist nuttig voor interne relaties | Niet aangetoond; geen save-ID van maken |
| Bestandstijd van `.3mf` op schijf | Normale herschrijving actualiseert meestal de wijzigingstijd | Goed als signaal, niet als zekerheid: geen wijziging als Save niets schrijft; tijden kunnen worden behouden, hersteld of beperkte resolutie hebben |
| ZIP-entrydatums en CRC’s | Containeronderdelen kunnen bij herschrijven nieuwe tijden krijgen; CRC verandert bij gewijzigde uitgepakte bytes | Geen savegarantie. Tijden zijn writerafhankelijk, CRC is geen unieke inhoudsidentificatie en kan gelijk blijven bij een no-op save |

### Gevolg voor Printchill

1. Gebruik bestandstijd en grootte als snelle aanleiding om een bestand opnieuw te controleren. Leg hun betekenis niet vast als unieke revisie-identiteit.
2. Bereken bij registratie of vermoedelijke wijziging een SHA-256 van het complete bestand. Die geeft aan of de opgeslagen bytes verschillen; een andere ZIP-tijd of preview kan al voldoende zijn. Hiermee detecteer je geen save die identieke bytes oplevert.
3. Als we alleen betekenisvolle wijzigingen willen signaleren, vergelijk dan ook de uitgepakte onderdelen. Begin met rapporteren welke model-, instellingen-, supports- of overige onderdelen verschillen. Negeer niet vooraf willekeurige velden: dat kan echte wijzigingen verbergen.
4. Definieer later expliciet of iedere gewijzigde snapshot een revisie wordt of alleen een gebruikersbevestigde inhoudelijke wijziging. Een save hoeft niet automatisch een nieuwe vrijgegeven revisie te betekenen.
5. Voor een gegarandeerde eigen save-teller of `saved_at` moet een integratie die iedere relevante save waarneemt het veld actualiseren. Een vooraf toegevoegd metadata-attribuut verandert niet vanzelf als de slicer het alleen bewaart.

### Benodigde praktijktest

Bewaar na iedere handeling een externe kopie zodat de uitgangstoestand niet verloren gaat. Registreer softwareversie, bestandstijd, grootte, complete hash, ZIP-entrytijden, hashes van uitgepakte onderdelen, metadata en UUID’s.

- Twee keer Save zonder bewerking: vaststellen of de slicer werkelijk opnieuw schrijft.
- Een printinstelling wijzigen en Save, binnen dezelfde dag.
- Een object verplaatsen en Save.
- Sluiten, openen en Save zonder bewerking.
- Save As onder een andere naam.
- Waar praktisch mogelijk twee snelle saves; secondenresolutie apart beoordelen.

Rapporteer verschillen per geval; één veranderde datum of UUID is geen bewijs dat die bij iedere save verandert. Deze praktijktests zijn **Niet uitgevoerd**.

## Vervolgproef

Gebruik kopieën van een origineel project dat in iedere betreffende slicer zelf correct opent. Test in twee fasen: eerst binnen dezelfde slicer, daarna uitwisseling tussen slicers. Vergelijk tegen een ongemodificeerde controlekopie om bestaande incompatibiliteit niet aan onze metadata toe te schrijven.

| Variant | Toevoeging | Wat toetsen? |
| --- | --- | --- |
| A | Alleen namespaced modelmetadata met `preserve="true"` | Eerste keuze voor project-ID en bronrevisies |
| B | `object/@partnumber` met een unieke test-ID | Behoud bij verplaatsen, dupliceren, splitsen en vervangen |
| C | Eigen metadata per object in `metadatagroup` | Of individuele onderdelen hun bronrelaties behouden |
| D | Eigen JSON-part inclusief content type en MustPreserve-relatie | Behoud van uitgebreide gegevens en package-integriteit |

Per variant en slicerversie:

1. Controleer ZIP/OPC-structuur, XML, namespaces en relevante 3MF-schema’s vóór openen. Houd bestaande vendor-extensies afzonderlijk bij.
2. Open als project waar ondersteund; noteer fouten, waarschuwingen en keuze voor alleen geometrie.
3. Controleer model, afmetingen, oriëntatie, supports, painting en instellingen tegen de controlekopie.
4. Slice met hetzelfde profiel en controleer op nieuwe fouten of onverwachte verschillen.
5. Bewaar onder een nieuwe naam, sluit en heropen het resultaat.
6. Controleer ID, waarde, namespace, `preserve`, objecttoewijzing en eventuele JSON-part. Aanwezigheid en standaardenconformiteit afzonderlijk rapporteren.
7. Herhaal na een instellingenwijziging, tweede opslagcyclus, objectverwijdering, duplicatie en geometrievervanging.
8. Registreer per controle **Geslaagd**, **Gefaald**, **Geblokkeerd** of **Niet uitgevoerd** met originele en resulterende bestanden.

**Huidige uitslag:** alle slicer-opening-, slicing- en roundtriptests van deze metadata-varianten zijn **Niet uitgevoerd**. Geen uitspraak dat willekeurige slicers hiermee probleemloos werken.

## Bronnen

- [3MF Core — metadata, §3.4.1](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md#341-metadata)
- [3MF Core — MustPreserve, §2.1.5](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md#215-mustpreserve-relationship)
- [3MF Core — object en partnumber, §4.1](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md)
- [Bambu Studio — 3MF importer/exporter](https://github.com/bambulab/BambuStudio/blob/master/src/libslic3r/Format/bbs_3mf.cpp): `_handle_end_metadata`, `metadata_item_map`, `PART_GUID_KEY`.
- [OrcaSlicer — 3MF importer/exporter](https://github.com/SoftFever/OrcaSlicer/blob/main/src/libslic3r/Format/bbs_3mf.cpp): `_handle_end_metadata` en `metadata_item_map`.
- [PrusaSlicer 2.9.4 — 3MF importer/exporter](https://github.com/prusa3d/PrusaSlicer/blob/version_2.9.4/src/libslic3r/Format/3mf.cpp): `_handle_start_item`, `_handle_end_metadata` en metadata-export.
- [Cura — 3MF reader](https://github.com/Ultimaker/Cura/blob/main/plugins/3MFReader/ThreeMFReader.py)
- [Cura — 3MF writer](https://github.com/Ultimaker/Cura/blob/main/plugins/3MFWriter/ThreeMFWriter.py)
- [libSavitar — Scene.cpp](https://github.com/Ultimaker/libSavitar/blob/main/src/Scene.cpp): `fillByXMLNode`, `toXmlNode` en metadata-opslag.

[Back to top](#inhoudsopgave)
