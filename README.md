# Schul-Dashboard HBL

**Stand: v5.10.1 · Pilotprojekt · 21.11.2026**

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
