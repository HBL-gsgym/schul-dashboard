**v7.0.11 – Klassenlisten-Routing:** Das neue Klassenmodul verwendet die bereits bestehende, global veröffentlichte Kurskatalog-Schnittstelle und nicht mehr die nur im Stundenplanmodul sichtbare Funktion. Damit lässt sich die Klassenliste auch in der mobilen und normalen Kursnavigation laden.

**v7.0.10 – Korrektur des Regressionstests:** Der Klassenlisten-Unit-Test vergleicht das leere Bewertungsobjekt über die Anzahl seiner Einträge, da das getestete Modul in einer separaten JavaScript-VM ausgeführt wird. Datenmodell und Fachfunktionen bleiben unverändert.

**v7.0.9 – Gemeinsame Klassenbuchliste:** Klassen desselben Schuljahres (z. B. 9a) nutzen nun über ihre Fachkurse hinweg dieselben stabilen Schüler-IDs, Namens-/Aliasfelder und numerisch sortierten Klassenbuchnummern. Die Daten liegen weiterhin im privaten Benutzer-Snapshot unter `__classRostersV1`, die Fachkurse führen ihre eigenen Noten, Mitarbeit und Sitzpläne. Ein Import in der Mitarbeit aktualisiert bei eindeutigen Klassen die Namen nach Nummer und erhält vorhandene IDs und Bewertungen. Bei widersprüchlichen Altlisten mit unterschiedlichen Aliassen wird nichts stillschweigend zusammengelegt: In der Kursübersicht erscheint ein ausdrücklich zu bestätigender Nummernabgleich. Bei belegten Sitzplätzen/Noten in irgendeinem Fach ist Entfernen gesperrt. Andere Klassen und Schuljahre bleiben unabhängig; gemischte Oberstufenkurse sind vorerst nicht automatisch verknüpft. Keine Änderungen an Supabase-Schema, Konten, Rollen oder bestehenden Backend-Tabellen.**

**v7.0.8 – Navigation:** Interne Kurslinks und Browser-Zurück verwenden dieselbe Dashboard-Seite. Der Browser-Regressionstest prüft DOM-Identität, Eingaben und Datenaktualisierung mit synthetischen Kursen.

**v7.0.7 – Beständige Inhalte statt Neuzeichnen:** Nicht veränderte Dashboard-Bereiche werden nicht mehr regelmäßig ohne Anlass neu aufgebaut: Aufgaben, Unterrichtsvorschau, Vorbereitung und Schulkalender überspringen identische Darstellungen. Mitarbeit bekommt pro Kurs eine zwischengespeicherte Ansicht mit Inhaltsprüfung; Übersicht/Sitzplan und Notenbuch behalten ihre Inhalte und Scrollbereiche beim Wechsel zwischen Kursen und Tabs. Die Kursleiste aktualisiert nur Hervorhebung und Linkziel statt komplett ersetzt zu werden. Die Handy-Navigation wird nicht mehr bei jedem Kurswechsel neu erzeugt und unterstützt Übersicht/Noten. Keine Änderung an gespeicherten Daten, RLS oder Backend. Browser-Gerätetest noch erforderlich.**

**v7.0.6 – Flüssige Navigation:** Das Dashboard und die Kursansichten bleiben in einem geladenen Dokument. Kurs- und Tabwechsel verwenden Browser-History statt vollständigem Neuladen. Bereits geöffnete Dashboard-/Mitarbeitsansichten behalten ihre DOM-Elemente und Scrollposition; Kurs-Navigation und Titelzeile bleiben beim Wechsel Übersicht/Noten bestehen. Globale Konto-, Chat- und Schnellleisten-Elemente bleiben verfügbar. Die mobile Schnellnavigation wird je Ansicht aktualisiert. Keine Datenbank-/Datenmodelländerungen. iPad-/Desktop-/Android-Gerätetest noch offen.

# Schul-Dashboard HBL

**v7.0.5 – Kurswechsel in allen drei Bereichen:** Die schmale horizontal scrollbarere Kursleiste aus der Mitarbeit sitzt jetzt bei **Übersicht, Mitarbeit und Noten direkt über den drei Bereichsbuttons**. Ein Klick auf einen Kurs öffnet genau denselben Bereich des gewählten Kurses (z. B. Noten zu Noten); der aktive Kurs wird hervorgehoben und bleibt im sichtbaren Ausschnitt. Auf iPad und Smartphones lässt sich die Leiste seitlich wischen; auf Desktop horizontal scrollen. Die Liste wird nach dem Laden/Aktualisieren der persönlichen Kurse erneut abgeglichen, archivierte aktive Kurse bleiben über ihren bestehenden Direktlink erreichbar. Die alte separate Leiste unter den Mitarbeit-Informationen entfällt. Schülerlisten, Sitzpläne, Mitarbeit, Noten, Konten und Datenhaltung bleiben unverändert.

**v7.0.4 – Kein Aufblitzen der Benutzer-/Chat-Schnellleiste:** Auf Desktop und iPad wird die Schnellleiste während der asynchronen Benutzerinitialisierung nicht angezeigt. Sie erscheint erst, nachdem die benutzerspezifisch gespeicherte Position und der minimierte Zustand geladen sind, mit einem kurzen Fade-in. Ist die Cloud nicht verfügbar, wird die Leiste über einen abgesicherten Rückfall sichtbar; Chat/Konto-/Einstellungsaktionen, Dragging und gespeicherte Position bleiben unverändert. Bei reduzierter Bewegung entfällt die Animation. Keine Änderungen an Kurs-, Schüler- und Benutzerdaten.

**v7.0.3 – PWA-Navigations-Cache repariert:** Der Service Worker ruft bei jedem Seitenwechsel von Kursansicht zu Dashboard die HTML-Seite **frisch und ohne HTTP-Browsercache** ab; nur im Offlinefall wird auf die gespeicherte App-Shell zurückgegriffen. Bei Installation/Update bezieht der Worker auch die beiden Startseiten-URLs `./` und `./index.html` bewusst frisch, damit ein neuer Cache nicht durch alte HTML-Antworten befüllt wird. Die Update-Schaltfläche öffnet `index.html` mit einmaligem Aktualisierungsparameter und behält bestehende Kursparameter bei. Der Versionsvergleich bietet nur noch wirklich **neuere** Versionen an. Kurs-, Schüler-, Noten-, Account- und Benachrichtigungsdaten bleiben unverändert. Reale Tests auf iPad und Desktop sind noch erforderlich.

**v7.0.2 – Einheitliche Position der Kursnavigation:** In **Übersicht, Mitarbeit und Noten** befinden sich die drei Bereichsbuttons unmittelbar unter demselben Zurück-zum-Dashboard-Link. Fach-, Kurs- und Bewertungsinformationen stehen darunter. Alle drei Seiten verwenden denselben Inhaltscontainer mit den gleichen horizontalen und vertikalen Abständen auf Desktop, iPad und Smartphone. Keine Änderung an Kursdaten, Sitzplänen, Bewertungslogik, Auth oder Datenhaltung.

**v7.0.1 – Mitarbeit-Reihenfolge:** Die drei Kursbereichs-Buttons **Übersicht | Mitarbeit | Noten** stehen nun **oberhalb** der Kursinformationen (Kursname, Beschreibung, Bewertungslegende) auf der Mitarbeit-Seite. Die übrigen Kursansichten, Mitarbeitseingaben, Schüler-IDs und gespeicherten Daten sind unverändert.

**v7.0.0 – Erste Etappe Classmanagement (Navigation):** Die Dashboard-Kachel heißt jetzt **Kursverwaltung**, behält aber ihre bisherige ID (`mitarbeit`) und damit die gespeicherte Position. Alle Kursseiten haben die drei Bereiche **Übersicht | Mitarbeit | Noten** mit sichtbarer Aktiv-Markierung. Auf der Übersicht steht der bestehende interaktive Sitzplan im Mittelpunkt; die gemeinsame Schülerliste folgt darunter. Mitarbeitstabelle und gewichtetes Notenbuch bleiben erhalten, ebenso die Direktlinks `?kurs=`, `?mitarbeit=`, `?noten=`. Kurskarten öffnen im selben PWA-Fenster, statt auf dem iPad einen neuen Tab anzufordern. **Keine Datenmigration, keine Löschung und keine Änderung an Benutzerkonten oder Berechtigungen.** Weitere v7.x-Etappen zu Schülerpflege, Bewertungslogik und Schuljahresverwaltung sind noch offen.

**v6.1.3 – PWA-Updates auf iPad:** Ein eigenes Update-Modul prüft bei App-Start und nach dem Zurückkehren (frühestens nach fünf Minuten), ob auf GitHub eine neuere Version verfügbar ist. Service Worker aktualisieren und eine URL mit Zeitparameter abfragen verhindern einen reinen Versionsvergleich mit der alten Cache-Datei. Der Hinweis **„Jetzt aktualisieren“ / „Später“** vermeidet einen unerwarteten Reload und mögliche Verluste nicht gespeicherter Eingaben. Die aktuelle App-Version steht zusätzlich im `hbl-version`-Metatag. Bereits installierte ältere Apps müssen diese Version mindestens einmal laden, um von der neuen Prüfung zu profitieren; ein vollständig festgefahrener alter App-Cache wird durch die neue Funktion nicht rückwirkend korrigiert.

**v6.1.2 – Sitzplan-PDF auf dem iPad:** Auf iPad/iPhone wird im Sitzplan statt `window.print()` der Button **„PDF erstellen“** angeboten. HBL erstellt ein A4-Querformat-PDF vollständig lokal aus dem Sitzplan und bietet **PDF öffnen** sowie **PDF sichern** als direkt antippbare Links an (in Safari über „Teilen“ auch Drucken/Dateien). Auf Desktop bleiben **Drucken** und die neue direkte PDF-Ausgabe getrennt verfügbar. Keine Datenübermittlung an einen PDF-Dienst. Die PDF-Ausgabe ist bildbasiert, nicht textdurchsuchbar; gespeicherte Kurs-/Schülerdaten werden nicht verändert.

**v6.1.1 – Stundenplan auf iPad/Desktop aufgeräumt:** In „Stundenplan bearbeiten“ wurden die zusätzlichen Aktionen Musterplan übernehmen, Dateiimport, JSON-/CSV-Export und „Stundenplan leeren“ aus der Oberfläche entfernt. **Meine Kurse** und das normale Bearbeiten von Unterricht und Aufsichten bleiben zugänglich; vorhandene Stundenplandaten werden nicht verändert. Die Import-/Export-Routinen bleiben vorerst ohne regulären UI-Einstieg erhalten und dürfen bei einem späteren schulischen Admin-Konzept gezielt mit Berechtigungsprüfung wieder aufgegriffen werden.

**v6.1.0 – Schwebende Schnellleiste für Desktop/Tablet:** Profil/Anmelden, Chat (inklusive Ungelesen-Zähler) und Einstellungen (bisher „Mein HBL“) sind über eine frei verschiebbare Leiste erreichbar. Über den Griff mit Maus/Touch ziehen, per Pfeiltasten verschieben, mit dem Minimalschalter einklappen, per Doppelklick die Position zurücksetzen. Position und Zustand werden lokal je Konto gespeichert und bei Größenwechsel in den Bildschirm begrenzt. Auf Kursseiten bleiben die Cloud-/Chat-Aktionen technisch vorhanden, aber die obere Leiste wird ausgeblendet; persönliche Einstellungen sowie Push/Chat bleiben erreichbar. Smartphone nutzt weiter die untere Navigation. Die Kursseiten verlinken für Kachel- und Designeinstellungen ins Dashboard.

**Stand: v7.0.11 · Pilotprojekt · 21.11.2026**

Der zusätzliche Button **„Benutzer verwalten“** wurde aus dem Schulkalender entfernt. Berechtigte Owner öffnen die unveränderte Benutzer- und Chatverwaltung jetzt ausschließlich über **Mein HBL → Administration**. Sichtbarkeit und Aufruf erfolgen anhand der bestehenden Owner-Rolle; die serverseitigen Berechtigungen bleiben unverändert.

Der zusätzliche Button **„🔔 Ruhezeiten“** wurde aus dem Chatkopf entfernt. Sämtliche Chat-, Unterrichts- und sonstigen Push-Einstellungen bleiben zentral unter **Mein HBL → Benachrichtigungen** erreichbar, einschließlich Geräteaktivierung. Die Benachrichtigungsfunktionen selbst sind unverändert.

Auf Smartphones enthält die feste untere Leiste jetzt **Chat** (mit Ungelesen-Zähler), **Anmelden/Benutzername** (öffnet das persönliche Konto bzw. Login) und **Mein HBL**, zusätzlich zu den vorhandenen sichtbaren Kachel-Schnellzugriffen. Bei vielen Elementen ist die Leiste horizontal scrollbar. Die separate Push-Gerätebox wurde aus dem Stundenplan in **Mein HBL → Benachrichtigungen** integriert; Registrierung, Deaktivierung und Installationsfunktion bleiben erhalten.

Der zuletzt noch sichtbare separate Cloud-Balken aus `cloud.js` ist auf dem Dashboard ebenfalls ausgeblendet; die Funktionen bleiben erhalten und der Chat ist jetzt auch über **Mein HBL → Kollegium-Chat** erreichbar. Ein eventueller alter Board-Toolbar-Rest wird bei der Initialisierung entfernt.

Der bisherige Status- und Rücksetzstreifen oberhalb der Dashboard-Kacheln entfällt: **Cloud-/Speicherstatus** und Sync-Aktionen sind in **Mein HBL → Daten & Synchronisierung** verfügbar, **Anordnung zurücksetzen** unter **Mein HBL → Dashboard anpassen** (mit Bestätigungsabfrage). Bestehende Speicherung, Konten und Kacheleinstellungen bleiben erhalten.

Die Android-Hero-Kachel enthält jetzt auch A/B-Woche, Uhrzeit mit Sekunden, Datum und KW in einer Reihe mit einheitlicher Schriftgröße. Auf Desktop bleibt die Uhrzeit separat. Die Ecosia-Suche wird innerhalb ihrer Kachel unterhalb der Steuerleiste in voller Breite dargestellt; die Suchfunktion und persönliche Kachel-Einstellungen bleiben erhalten.

Auf Android ist die Kopfkachel kompakter, die Wochen-/Uhrzeit-/Datums-/KW-Information steht in einer Zeile, die Autoren-Signatur ist dezent und der doppelte „Mein HBL“-Button oben wird ausgeblendet (Zugang über mobile Navigation bleibt). Die **Ecosia-Websuche** ist nun eine optionale Dashboard-Kachel, die sich über **Mein HBL → Dashboard anpassen** verschieben, minimieren und ausblenden lässt; bestehende individuelle Layouts und Suchverhalten bleiben erhalten.

Die Kachel **„Musik zum Arbeiten“** ist verschiebbar, minimierbar und in **Mein HBL → Dashboard anpassen** ausblendbar. Die bisher drei Musiklinks bleiben voreingestellt und lassen sich über **„Links bearbeiten“** ändern, entfernen und bis maximal vier Verknüpfungen ergänzen; die Speicherung erfolgt persönlich über den bestehenden Snapshot.

Unter **Mein HBL → Benachrichtigungen** gelten die gewählten Wochentage und Uhrzeiten gemeinsam für Chatnachrichten und Erinnerungen an Unterricht und Aufsichten. Die Auswahl für den persönlichen Kalender (v8.0) und Mitteilungen (v12.0) wird für später gespeichert. Jedes Gerät benötigt eine eigene Push-Freigabe.

Ein webbasiertes Dashboard für Lehrkräfte mit individualisierbarem Schulalltag, gemeinsamem Kalender und Kollegium-Chat.

**Live-Frontend:** https://hbl-gsgym.github.io/schul-dashboard/  
**GitHub:** https://github.com/HBL-gsgym/schul-dashboard

> **Testbetrieb:** Das Projekt ist noch keine freigegebene schulische Produktivanwendung. Ausschließlich synthetische/Testdaten verwenden – keine echten Schülernamen, Noten, Bewertungen oder sonstigen personenbezogenen Schuldaten.

## Leitidee: Software folgt dem Menschen

> **Unsere aktuelle Software bestimmt unsere Arbeitsabläufe. Wir brauchen eine Software, die sich optimal an unsere individuellen Arbeitsabläufe anpassen kann.**

Das Schul-Dashboard HBL soll nicht den Arbeitsalltag der Lehrkräfte in starre Vorgaben pressen. Stattdessen passt sich die Oberfläche an die Arbeitsweisen der einzelnen Kolleginnen und Kollegen an. Lehrkräfte können persönliche Links und Werkzeuge frei wählen, Kategorien und Kacheln organisieren und ihren Stundenplan individuell gestalten. Schulweit notwendige Funktionen wie Kalender, organisatorische Informationen und Kollegiumskommunikation bleiben dabei gemeinsam nutzbar.

**Produktprinzip:** So viel gemeinsame Struktur wie nötig, so viel individuelle Anpassbarkeit wie möglich. Neue Funktionen sollen diese Freiheit erhalten oder sinnvoll erweitern, ohne Nutzende mit unnötiger Konfiguration zu überfordern.

## Aktuelle Entwicklungsrichtung

Gemeinsamer Kern für **persönliche Lehrkräfte-Nutzung** und ein späteres **Schulportal**. Zunächst manuelle Eingabe und eigenständige persönliche Kursverwaltung; Untis-Anbindung zurückgestellt. Schulzuordnungen, Schüleraccounts und Bezahlmodell sind geplant, noch nicht implementiert. Siehe [Architekturplan und nächste Schritte](docs/PRODUCT_ARCHITECTURE.md). Die am **21.11.2026 neu priorisierte [Versions-Roadmap](docs/ROADMAP.md)** stellt persönliche Funktionen vor Schulorganisation und den Mehrschulbetrieb. Besonders vorgemerkt: **v15.0 Schulmitarbeitende, v20.0 Schülerinnen/Schüler und v25.0 Schulübergreifend**.

## Meine Kurse verwenden

Unter **Kurse → Meine Kurse** legst du Fach und Klasse/Kurs an, auch ohne Stundenplan. Anschließend unter **Wochenstundenplan → Bearbeiten** einen Block öffnen, den Kurs auswählen und Raum sowie A/B-Woche festlegen. Umbenennen und Archivieren erfolgen in „Meine Kurse“. Ein belegter Kurs muss vor dem Archivieren aus dem Stundenplan entfernt werden.

## Sitzplan und Raum verwenden (v5.9.16)

Wähle über dem Sitzplan den **Unterrichtstermin**. Ein **✓** neben dem Namen zeigt, für wen in diesem Block schon eine Mitarbeitseinschätzung vorliegt. Auch die Bewertung **0** zählt. Ein Terminwechsel aktualisiert die Häkchen. Beim Leeren eines Eintrags verschwindet dessen Häkchen.

Ab v5.9.17 öffnet ein Tipp auf einen belegten Sitzplatz die **Mitarbeit** für diese Person. Kurs, Unterrichtstermin und vorhandener Eintrag sind sichtbar. Den passenden Block prüfen oder wählen und direkt auf **++, +, 0, − oder −−** tippen. Damit ist der Eintrag auch in der Mitarbeitstabelle gespeichert. Erneut antippen zum Korrigieren oder Leeren. Beim Bearbeiten des Sitzplans dient derselbe Platz weiterhin der Sitzverteilung.

Für vier Doppeltische mit Mittelgang stehen 32 Rasterspalten zur Verfügung. Setze vier waagerechte Doppeltische in dieselbe Reihe auf die Startspalten **2, 9, 19 und 26**. So bleiben zwischen dem zweiten und dritten Tisch vier Spalten als Gang frei.

Im Sitzplaneditor unter **Raum** einen vorhandenen Raum wählen oder die Bezeichnung eingeben. Bei genau einem Raum im A/B-Stundenplan des Kurses ist er beim ersten Bearbeiten vorausgefüllt. Mit **Sitzplan speichern** wird dem Kursplan dieser Raum zugewiesen. Ältere Pläne lassen sich weiterhin öffnen und beim Bearbeiten zuordnen.

Hat ein anderer eigener Kurs im selben Raum schon einen Sitzplan, unter **Tischanordnung aus** den Kurs wählen und **Tischanordnung übernehmen** anklicken. Positionen und Ausrichtung werden mit leeren Plätzen kopiert. Ein bestehender Entwurf lässt sich nach Bestätigung ersetzen und mit **Rückgängig** wiederherstellen. Jeder Kurs behält seine eigene Belegung.

Unter **Kurse → Kurs öffnen → Sitzplan einrichten** Einzel- und Doppeltische hinzufügen. Die Tafel zeigt die Vorderseite des Raums. Am Tischgriff ziehen oder den Tisch auswählen und über **Spalte**, **Reihe** und **Verschieben** positionieren. Doppeltische lassen sich drehen. Auf schmalen Bildschirmen ist der Raum seitlich scrollbar.

Einen Platz antippen und eine Person aus der gemeinsamen Kursliste auswählen. Ist die Person bereits platziert, werden die Plätze getauscht. **Frei** lässt einen Platz leer. Eine Namensänderung am Platz gilt nach dem Speichern auch für Mitarbeit und Noten. **Zufällig verteilen** zeigt zuerst eine Vorschau. Die Tischpositionen bleiben erhalten. **Ohne Platz** zeigt, wer noch keinen Sitz hat. Mit **Rückgängig** den letzten Bearbeitungsschritt zurücknehmen. **Sitzplan speichern** sichert den Entwurf im persönlichen Kurs. Für den Pilotbetrieb weiterhin nur Beispieldaten verwenden.

## Kursübersicht und Noten in v5.9.13

Seit v5.9.20 zeigt das Notenbuch je Kurs beide Halbjahreswerte an. In der Voreinstellung **Sek I** kommt die Jahresnote hinzu. Dafür zählen alle erfassten Leistungen des Schuljahres innerhalb ihrer jeweiligen Bereichsgewichtung. Unter **Bewertungsbereiche, Skala und Berechnung** lässt sich **Sek II** mit zwei getrennten Halbjahreswerten einstellen. Die Notenskala ist davon unabhängig.

Im Sitzplan bleibt eine Person bei jeder Zufallsverteilung an ihrem Platz, wenn du beim Bearbeiten ihren besetzten Platz auswählst, **Platz fixieren** drückst und speicherst. Über **Drucken / PDF** öffnest du den Druckdialog für den gespeicherten Sitzplan im A4-Querformat. Eine Stecknadel kennzeichnet feste Plätze. Mit **Fixierung lösen** nimmt die Person wieder an der Verteilung teil. Auch eine manuelle Umbesetzung löst die Fixierung des betroffenen Platzes.

Über den Spaltenkopf lässt sich jeder Nachweis einem Halbjahr zuordnen. Die fünf Startspalten neuer Notenbücher beginnen im ersten Halbjahr. Ältere Spalten ohne Zuordnung zählen zum Jahreswert in Sek I und lassen sich nachträglich zuordnen. **Nachweise anzeigen** filtert die Eingabespalten. Die berechneten Vorschläge bleiben für beide Halbjahre und in Sek I für das Jahr sichtbar. Einen Vorschlag antippen, um eine Zeugnisnote manuell festzulegen oder die Festlegung zu entfernen.

**Kurs öffnen** führt zur Übersicht mit Sitzplan. Unter den Schaltflächen **Mitarbeit** und **Noten** kannst du die **Schülerliste** aufklappen. Tippe auf einen Namen zum Bearbeiten oder auf **+ Person hinzufügen**. Die Namen gelten für alle drei Ansichten. Personen mit eingetragenen Noten sind vor dem Entfernen geschützt.

Neue Notenbücher starten mit **Note 1 bis Note 5** pro Person im Bereich **Noten (100 %)**. Du kannst direkt eine beliebige Spalte ausfüllen. Weitere Spalten, andere Gewichte und die Skala (Noten 1–6 oder Punkte 0–15) lassen sich unter **Bewertungsbereiche und Skala** einstellen. Über den Spaltenkopf kannst du Titel und Datum bearbeiten. Eigene Bereiche lassen sich umsortieren oder vorübergehend deaktivieren. Bewertete Bereiche und Spalten sind vor dem Entfernen geschützt.

Jeder Bereichsmittelwert berücksichtigt die ausgefüllten Noten. Ein gewichteter Gesamtwert erscheint, sobald die aktiven Gewichte zusammen 100 % ergeben und für die Person in jedem positiv gewichteten Bereich mindestens eine Note steht. Der angezeigte Wert hat zwei Nachkommastellen. Die Entscheidung über eine Endnote bleibt bei der Lehrkraft. Die Einträge werden mit dem persönlichen Dashboard gespeichert. Im Pilotbetrieb ausschließlich erfundene Namen und Noten verwenden.

## Kursnotiz in v5.9.12

In der Kurswahl öffnet **+ Kursnotiz** ein kurzes Textfeld für den aktuellen Unterrichtsstand (bis zu 240 Zeichen). Nach dem Speichern steht die Notiz direkt auf der Kurskarte neben Schülerzahl und Blockfortschritt. Zum Ändern die Notiz antippen. Zum Entfernen das Feld leeren und speichern.

## Änderungen in v5.9.11

- Eigener privater Kursbestand unter „Meine Kurse“, unabhängig vom Stundenplan: anlegen, umbenennen, archivieren und wiederherstellen. Bestehende Kurse werden mit ihren Kennungen übernommen.
- Kursauswahl per Dropdown im Blockeditor; Raum und A/B bleiben pro Belegung einstellbar. Neue Kurse können direkt dort angelegt werden.
- Ein Kurs kann erst ohne Stundenplanbelegung archiviert werden; Schüler, Bewertungen und Links bleiben erhalten.

## Änderungen in v5.9.10

- Dauerhafte persönliche Kurskennungen im Stundenplan; vorhandene Kennungen, Mitarbeit und Links bleiben erhalten.
- Blockeditor unterscheidet Kursumbenennung (alle zugehörigen Blöcke) und andere Belegung. Raumänderungen bleiben blockbezogen.
- Alte Stundenpläne werden ohne Reset ergänzt; Kennungen bleiben beim JSON-Austausch erhalten. CSV wird anhand eindeutiger vorhandener Kursbezeichnungen zugeordnet.

## Änderungen in v5.9.9

- „Heute & Ausblick“ mit zwei Unterrichtsblöcken im Fokus, weiteren Blöcken zum Aufklappen und separaten kompakten Aufsichten.
- Erledigte Aufgaben dieser Woche platzsparend aufklappbar; offene Aufgaben bleiben sichtbar.

## Änderungen in v5.9.8

- Kompakte mobile Wochenübersicht mit lesbaren Unterrichtsdetails beim Antippen.
- Dezente Aufsichtszeilen auf Desktop und Handy; Haus-/Hof-Kürzel und vollständige Orts-/Zeitdetails ohne Änderung gespeicherter Daten.

## Änderungen in v5.9.7

- Mobile Chats mit horizontaler Gesprächsauswahl und mehr Platz für Nachrichten.
- Fensterhöhe folgt dem sichtbaren Bildschirm bei geöffneter Tastatur; größere Touchflächen in Gruppen- und Mitgliederdialogen.

## Änderungen in v5.9.6

- Kompakte mobile Kontoleiste: Profil und Chat direkt erreichbar, weitere Kontoaktionen unter „Konto“ ausklappbar. Synchronisierungs- und Fehlermeldungen bleiben sichtbar.

## Änderungen in v5.9.5

- Eigene Aktion zum Erneuern offener Einladungen bei gleicher Benutzer-ID; aktivierte Konten verwenden Passwortwiederherstellung.
- Link-Aktionen erhalten bestehende Freigaben und prüfen gesperrte Konten.
- Separates Edge-Function-Deployment und Integrationstests erforderlich: siehe [Einladungserneuerung](docs/INVITATION_LINKS.md).

## Änderungen in v5.9.4

- Vollständige persönliche JSON-Sicherung über „Lokale Sicherung herunterladen“, auch bei Cloud-Konflikten.
- Schutz lokaler Änderungen vor verspäteten Cloud-Antworten und Wiederherstellung ausstehender Sicherungen.
- Einheitliche Abmeldung aus Dashboard und Profil einschließlich Push-Bereinigung.
- Automatisierte Offline-Regressionstests und plattformübergreifender statischer Check.

## Funktionsumfang

- Persönliches Dashboard: verschiebbare Kacheln, Links (Orga, KI, digitale Tools, Materialien), Aufgaben/Korrekturen und Unterrichtsvorbereitung.
- Frei editierbarer Stundenplan für A/B-Wochen (A grün, B blau), 4 Unterrichtsblöcke pro Tag, Import/Export, individuell je Konto.
- Pausenaufsichten, anstehender Unterricht, Schuljahreskalender Brandenburg, gemeinsame Veranstaltungen und Unterrichtsausfälle.
- Mitarbeitserfassung mit aus dem Stundenplan geplanten Terminen und Schutz bereits erfasster Bewertungen.
- Supabase-Login mit administrativ verwalteten Lehrkräfte-Zugängen; manuell weitergeleitete Einladungs- und Recovery-Links; Benutzerprofile und Passwortvergabe.
- Kollegium-Chat: Lehrerzimmer, Direktnachrichten, selbst angelegte Gruppenchats, Mitgliederverwaltung, Ungelesen-Anzeige und Echtzeit.
- Progressive Web App (PWA) mit responsiver Oberfläche und optionalen Push-Benachrichtigungen einschließlich einstellbarer Chat-Zeitfenster und einem gerätespezifischen Push-Verbindungstest (v5.9.3).

## Technologie / Betrieb

- **Frontend:** Vanilla HTML, CSS, JavaScript; GitHub Pages; kein Bundler/Framework.
- **Daten:** Supabase Auth, PostgreSQL mit Row Level Security (RLS), Realtime und Edge Functions.
- **PWA:** `manifest.webmanifest` und `sw.js` (App-Shell-Cache, Push).
- **Sicherheit:** Keine echten Schülerdaten für den Pilotbetrieb; der öffentliche Repository-Code darf keine privilegierten API-Keys oder anderen Geheimnisse enthalten.

## Entwickeln und prüfen

Voraussetzung: Node.js 20+; für die lokale Vorschau optional Python 3.

```bash
git clone https://github.com/HBL-gsgym/schul-dashboard.git
cd schul-dashboard
npm test
python3 -m http.server 8000
```

Danach ist die **statische Oberfläche** unter http://localhost:8000 sichtbar. Die Anmeldung ist aktuell auf die bereitgestellte Supabase-/GitHub-Pages-Konfiguration ausgelegt; **keine produktiven Konten oder echten Daten für lokale Tests verwenden**. Einen getrennten Test-Backend-Zugang gibt es nicht im Repository.

`npm test` führt einen **statischen Offline-Check ohne zusätzliche npm-Pakete** aus (JavaScript-Syntax, lokale Referenzen, Service-Worker-App-Shell). Er ist **kein** Browser-, Auth-, RLS- oder Push-End-to-End-Test.

## Dokumentation für Codex

| Datei | Zweck |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Verbindliche Arbeits- und Sicherheitsregeln für Codex |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Module, Datenfluss, Supabase-Tabellen, Schnittstellen |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Lokaler Start, Tests, Branches, Deploy-Checkliste |
| [docs/SECURITY.md](docs/SECURITY.md) | Zugriff, RLS, Geheimnisse, Datenschutz und Risiken |
| [docs/CODEX_START.md](docs/CODEX_START.md) | Sofort verwendbarer erster Prüfauftrag an Codex |
| [docs/CHATGPT_TO_CODEX.md](docs/CHATGPT_TO_CODEX.md) | Übergabe der bisher in ChatGPT getroffenen Entscheidungen an Codex |
| [docs/SMOKE_TESTS.md](docs/SMOKE_TESTS.md) | Manuelle Funktionstests mit synthetischen Konten |

**Empfohlener Einstieg:** Repository mit Codex verbinden, [docs/CODEX_START.md](docs/CODEX_START.md) öffnen und den dortigen Prüfauftrag senden. **Zuerst nur auditieren, nichts deployen.**

## Verzeichnis

```text
index.html                  Hauptanwendung (inkl. Inline-JS/CSS)
cloud.js / cloud.css        Supabase-Login und persönlicher Snapshot
mobile.js / mobile.css      Mobile Navigation/Ansicht
hbl-v55.js / .css           Aufsichten, PWA, Push-Basis
hbl-v56.js / .css           Schulkalender, Rollen, Benutzerverwaltung, Links
hbl-v57.js / .css           Lehrerzimmer, Direktnachrichten, Gruppenchats
hbl-v58.js / .css           Profile, erste Passwortvergabe
hbl-v59.js / .css           Chat-Push-Einstellungen, Ruhezeiten und Push-Test
sw.js                       PWA-App-Shell und Push-Event-Verarbeitung
manifest.webmanifest        PWA-Metadaten
stundenplan-editor.html     Separates Stundenplan-Editor-/Hilfsdokument
supabase/functions/         Edge Functions: hbl-admin-users, hbl-push-dispatch, hbl-push-test (separat zu deployen)
scripts/check-static.mjs    Statischer Offline-Check
docs/                       Architektur, Sicherheit und Codex-Einstieg
```

**Hinweis zu Datenbankänderungen:** Das vollständige bestehende Supabase-Schema ist noch nicht als versionierte Migrationen im Repository abgelegt. Bei Schemaaufgaben zuerst Ist-Stand in einer getrennten Testumgebung erfassen, dann reviewbare Migrationen erstellen. Produktive Änderungen nicht ohne gesonderte Freigabe.
