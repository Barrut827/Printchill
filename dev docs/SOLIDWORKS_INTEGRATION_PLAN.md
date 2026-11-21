# SolidWorks connector — implementatieplan

Status: **ontwerp, nog niet gebouwd** · 2026-11-21 · basis MVP 0.3.5. Scope: UC-002, UC-004, UC-005, UC-011 en UC-021. UC-001 blijft een afzonderlijke read-only metadata-POC; UC-018 is voor Bambu eerder geaccepteerd.

## Keuze en afbakening

Begin met zelfstandige `.SLDPRT`-bestanden in SolidWorks 2026 SP0, één expliciete configuratie en één bewerkbare sessie per document. Assemblies, tekeningen, externe referenties en multi-configuratie-export volgen later. Weiger voorlopig een part met noodzakelijke externe referenties in plaats van een onvolledige werkkopie te presenteren.

Een lokale Windows-helper stuurt via COM SolidWorks aan; een VBA-macro voert expliciete PRC-opdrachten binnen SolidWorks uit. De helper draait in de interactieve Windows-gebruikerssessie. De Node-backend blijft eigenaar van identiteit, opslag en commits. Dit benut de bestaande VBA-ervaring en vermijdt voor de eerste proef een geregistreerde add-in. Een C#-add-in is een latere optie voor doorlopende events en bediening. De eerste technische proef bepaalt hoe COM-verbinding, macrostart en commandocontext betrouwbaar werken; falen hiervan blokkeert de connector, niet bestaande Bambu-functies.

## Eigenaarschap en contract

| Gegeven | Eigenaar / regel |
| --- | --- |
| Part number, Part version, documentrevisie | Alleen PRC kent ze toe; macro kan geen nummer reserveren of een SQL-rij schrijven. |
| Werkkopie | `work/<job-id>/`; alleen dit bestand mag de macro wijzigen. `objects/` wordt nooit geopend voor bewerking. |
| Opdracht | Versieerbaar manifest: command-ID, workspace-ID, job-ID, bewerking, Part number, basisversie, configuratie en toegestane relatieve invoer-/uitvoerpaden. |
| Antwoord | Zelfde command-ID, status, daadwerkelijk pad/configuratie, Save-/exporterrors en warnings; tijdelijk bestand atomair publiceren. Backend controleert en hasht zelf de output. |
| Authenticatie | Helper krijgt een sessiegebonden, jobgebonden opdracht; geen browsertoken in CAD-properties of log. Geen macro-HTTP-route die de bestaande origincontrole omzeilt. |
| CAD-properties | Hoogstens `PRC_PartNumber`, `PRC_BaseVersion`, `PRC_DocumentId` en `PRC_WorkspaceId` als context. Gekopieerde properties bewijzen geen identiteit. |

`PRC_BaseVersion` verwijst naar de geopende basis, nooit naar een voorspelde volgende versie. Na bevestiging kan de volgende bewerksessie de nieuwe basis krijgen; wijzig niet achteraf de al geregistreerde bytes om een property gelijk te trekken. Toon actuele identiteit in PRC. Indien een actuele versieproperty in elke CAD-save vereist blijkt, ontwerp daarvoor eerst een expliciet reserverings-/commitprotocol.

## Gebruikersflows

| Flow | Werking |
| --- | --- |
| Open in SolidWorks | PRC kiest exacte CAD-revisie → maakt werkkopie + job → helper verbindt met SolidWorks → opent exact pad en configuratie. Bestaande gewijzigde documenten blijven ongemoeid. |
| Nieuw CAD opslaan in PRC | Maak/selecteer een leeg PRC-Part met nummer → gebruiker kiest het actieve CAD-document → expliciete Save as copy naar de jobmap → PRC-preview → bevestiging maakt 001. Bij bestaand Part volgt UC-021. Oorspronkelijk CAD-bestand blijft behouden. |
| Bestaand CAD wijzigen | Native Save schrijft de werkkopie; PRC detecteert stabiele gewijzigde bytes. Meerdere saves blijven één voorstel. Expliciete bevestiging legt één volgende Part version vast. |
| CAD + STL registreren | Macro slaat CAD op en exporteert de gekozen configuratie naar STL met vastgelegde mesh-eenheid en exportinstellingen. Manifest koppelt de hashes aan elkaar. PRC registreert beide samen; 3MF blijft exact de oude revisie en wordt zichtbaar mogelijk verouderd. |
| Afleiden | PRC maakt nieuw Part number en bronrelatie; macro maakt een kopie. Alleen een andere bestandsnaam of gewijzigde property maakt geen nieuw Part. |

Het gewenste gelijklopen van CAD/STL-revisielabels botst met onafhankelijke legacy-revisies in de huidige MVP. Kies vóór fase S3: alleen nieuwe bewezen exportparen gelijk labelen, of een expliciete migratie. Historische labels nooit hernummeren zonder afzonderlijk besluit. Herkomst wordt altijd door hashes en exportcontext bewezen, niet door de letter.

## Fasen en oplevercriteria

| Fase | Werk | Klaar wanneer |
| --- | --- | --- |
| S0 · compatibiliteitsproef | Helper + minimale macro compileren op 2026 SP0; openen, Save en STL-export met echte kopie testen. | Geen wijziging van bron/object; Unicode-/spatiepaden en API-fouten aantoonbaar correct. |
| S1 · openen | Rolbewuste CAD-jobs, settingspad/versiecheck, COM-open en session recovery. | Nieuwste én historische CAD-revisie openen als werkkopie; bestaand dirty document wordt niet overschreven. |
| S2 · registreren | Nieuw/actief CAD naar PRC kopiëren, PRC-identiteit en confirm-flow. | Leeg Part krijgt één 001; annuleren creëert geen versie; verkeerde job/context wordt geweigerd. |
| S3 · reviseren/exporteren | Save-detectie en CAD/STL atomair vastleggen; basisconflict en idempotentie. | Meerdere saves → één bevestiging; één versie met bewijs; oude CAD/STL/3MF blijven exact terughaalbaar. |
| S4 · herstel/pilot | Backend-/SolidWorks-herstart, savefouten, schijffout, back-up/restore en packagegrens toetsen. | Volledige dagelijkse mono-partflow werkt na herstart en herstel op de doelinstallatie; gebruikersacceptatie vastgelegd. |

Start met S0/S1 als afzonderlijke build; releaseversie pas vastleggen bij start. Pas na S4 assemblies plannen. De bestaande `jobs`-opslag en `work/confirm` zijn 3MF-specifiek: voeg rol, configuratie, basisrevisies en commando-ID toe met migratieback-up. Gebruik één commitpad voor Bambu, CAD en handmatige Related Objects; regressietest UC-018 zonder de eerdere gebruikersacceptatie opnieuw open te zetten.

## Fouten en verificatie

Save/exportfouten maken geen Part version. Als CAD-save lukt maar STL-export faalt, bewaar de werkkopie en bied opnieuw proberen of expliciet CAD-only bevestigen; registreer geen schijnbaar actueel STL. Een dirty document vereist eerst expliciete Save; bestandsstabiliteit alleen bewijst dat niet. Basisconflict, dubbel bevestigen en verbroken helper moeten data behouden. Gebruik per job een wachtrij en begrensde time-outs; beëindig geen SolidWorks-proces met ander open gebruikerswerk.

Test: bronhash vóór/na, juiste configuratie, units/bounds, native Save/Save As, identieke bytes, ontbrekende licentie/app, macro geblokkeerd, read-only file, externe referenties, crash tussen capture/commit, twee vensters en historische open na restore. End-to-end op echte SolidWorks 2026 is verplicht; mocks bewijzen alleen het protocol.

## Bronnen en API-proef

De officiële [SolidWorks API-introductie](https://help.solidworks.com/2026/english/api/sldworksapiprogguide/Welcome.htm?id=0) ondersteunt de VBA/COM-richting. [SaveAs3](https://help.solidworks.com/2026/english/api/sldworksapi/SolidWorks.Interop.sldworks~SolidWorks.Interop.sldworks.IModelDocExtension~SaveAs3.html?format=P&value=) beschrijft Save As/export en verwijst voor bewaren onder dezelfde naam naar Save3. OpenDoc6, RunMacro2, custom properties en configuratie-/STL-opties worden in S0 aan de lokaal geïnstalleerde 2026 API-help getoetst; dit document claimt geen al werkende macro.
