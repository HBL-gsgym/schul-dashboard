# Schul-Dashboard HBL

**Stand: v5.9.10 · Pilotprojekt · 20.11.2026**

Ein webbasiertes Dashboard für Lehrkräfte mit individualisierbarem Schulalltag, gemeinsamem Kalender und Kollegium-Chat.

**Live-Frontend:** https://hbl-gsgym.github.io/schul-dashboard/  
**GitHub:** https://github.com/HBL-gsgym/schul-dashboard

> **Testbetrieb:** Das Projekt ist noch keine freigegebene schulische Produktivanwendung. Ausschließlich synthetische/Testdaten verwenden – keine echten Schülernamen, Noten, Bewertungen oder sonstigen personenbezogenen Schuldaten.

## Leitidee: Software folgt dem Menschen

> **Unsere aktuelle Software bestimmt unsere Arbeitsabläufe. Wir brauchen eine Software, die sich optimal an unsere individuellen Arbeitsabläufe anpassen kann.**

Das Schul-Dashboard HBL soll nicht den Arbeitsalltag der Lehrkräfte in starre Vorgaben pressen. Stattdessen passt sich die Oberfläche an die Arbeitsweisen der einzelnen Kolleginnen und Kollegen an. Lehrkräfte können persönliche Links und Werkzeuge frei wählen, Kategorien und Kacheln organisieren und ihren Stundenplan individuell gestalten. Schulweit notwendige Funktionen wie Kalender, organisatorische Informationen und Kollegiumskommunikation bleiben dabei gemeinsam nutzbar.

**Produktprinzip:** So viel gemeinsame Struktur wie nötig, so viel individuelle Anpassbarkeit wie möglich. Neue Funktionen sollen diese Freiheit erhalten oder sinnvoll erweitern, ohne Nutzende mit unnötiger Konfiguration zu überfordern.

## Aktuelle Entwicklungsrichtung

Gemeinsamer Kern für **persönliche Lehrkräfte-Nutzung** und ein späteres **Schulportal**. Zunächst manuelle Eingabe und eigenständige persönliche Kursverwaltung; Untis-Anbindung zurückgestellt. Schulzuordnungen, Schüleraccounts und Bezahlmodell sind geplant, noch nicht implementiert. Siehe [Architekturplan und nächste Schritte](docs/PRODUCT_ARCHITECTURE.md).

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
