# Schul-Dashboard HBL

**Stand: v5.9.1 · Pilotprojekt · 18.11.2026**

Ein webbasiertes Dashboard für Lehrkräfte mit individualisierbarem Schulalltag, gemeinsamem Kalender und Kollegium-Chat.

**Live-Frontend:** https://hbl-gsgym.github.io/schul-dashboard/  
**GitHub:** https://github.com/HBL-gsgym/schul-dashboard

> **Testbetrieb:** Das Projekt ist noch keine freigegebene schulische Produktivanwendung. Ausschließlich synthetische/Testdaten verwenden – keine echten Schülernamen, Noten, Bewertungen oder sonstigen personenbezogenen Schuldaten.

## Funktionsumfang

- Persönliches Dashboard: verschiebbare Kacheln, Links (Orga, KI, digitale Tools, Materialien), Aufgaben/Korrekturen und Unterrichtsvorbereitung.
- Frei editierbarer Stundenplan für A/B-Wochen (A grün, B blau), 4 Unterrichtsblöcke pro Tag, Import/Export, individuell je Konto.
- Pausenaufsichten, anstehender Unterricht, Schuljahreskalender Brandenburg, gemeinsame Veranstaltungen und Unterrichtsausfälle.
- Mitarbeitserfassung mit aus dem Stundenplan geplanten Terminen und Schutz bereits erfasster Bewertungen.
- Supabase-Login mit administrativ verwalteten Lehrkräfte-Zugängen; manuell weitergeleitete Einladungs- und Recovery-Links; Benutzerprofile und Passwortvergabe.
- Kollegium-Chat: Lehrerzimmer, Direktnachrichten, selbst angelegte Gruppenchats, Mitgliederverwaltung, Ungelesen-Anzeige und Echtzeit.
- Progressive Web App (PWA) mit responsiver Oberfläche und optionalen Push-Benachrichtigungen einschließlich einstellbarer Chat-Zeitfenster.

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
hbl-v59.js / .css           Chat-Push-Einstellungen und Ruhezeiten
sw.js                       PWA-App-Shell und Push-Event-Verarbeitung
manifest.webmanifest        PWA-Metadaten
stundenplan-editor.html     Separates Stundenplan-Editor-/Hilfsdokument
supabase/functions/         Edge Functions (separat zu deployen)
scripts/check-static.mjs    Statischer Offline-Check
docs/                       Architektur, Sicherheit und Codex-Einstieg
```

**Hinweis zu Datenbankänderungen:** Das vollständige bestehende Supabase-Schema ist noch nicht als versionierte Migrationen im Repository abgelegt. Bei Schemaaufgaben zuerst Ist-Stand in einer getrennten Testumgebung erfassen, dann reviewbare Migrationen erstellen. Produktive Änderungen nicht ohne gesonderte Freigabe.
