# Codex-Arbeitsanweisungen – Schul-Dashboard HBL

> Diese Datei gilt für das gesamte Repository. Zuerst lesen, danach `README.md` und die Dokumentation unter `docs/`. Sprache für Kommunikation und sichtbare Benutzeroberfläche: Deutsch.

## Zweck und aktueller Stand
Dies ist ein **öffentliches GitHub-Repository** für den **Pilotbetrieb** einer schulischen Lehrer-Dashboard-Web-App. Der im Repository vorgefundene Stand ist **v5.9.3** (18.11.2026). Die tatsächlich ausgecheckten Dateien sind immer maßgeblich; Dokumentation kann veralten. Das Projekt liegt unter `HBL-gsgym/schul-dashboard`; der Produktions-Frontend-Link ist https://hbl-gsgym.github.io/schul-dashboard/.

Funktionen: individuelle A/B-Stundenpläne, Pausenaufsichten, Aufgaben/Korrekturen/Vorbereitung, Brandenburg-Schuljahreskalender und Schulveranstaltungen/Unterrichtsausfälle, Mitarbeitserfassung, individuelle Links und Kachel-Layout, Supabase-Login und Benutzerverwaltung mit manuellen Einladungs-/Passwortlinks, Lehrerzimmer, Direkt- und Gruppenchats, Web-Push/PWA.

## Leitbild und Produktentscheidung

> **Unsere aktuelle Software bestimmt unsere Arbeitsabläufe. Wir brauchen eine Software, die sich optimal an unsere individuellen Arbeitsabläufe anpassen kann.**

Dies ist die zentrale Produktvision. **Software folgt dem Arbeitsablauf der Lehrkraft – nicht umgekehrt.** Bei Produktentscheidungen Personalisierung und selbstbestimmte Arbeitsweisen erhalten: frei wählbare Links, individuell geordnete Kategorien und Kacheln, persönliche Werkzeuge und Stundenpläne. Gemeinsame schulische Grundfunktionen dürfen sinnvoll standardisiert sein, aber individuelle Anpassungen nicht grundlos blockieren. Keine starren, herstellerdefinierten Linklisten, erzwungenen Workflows oder unnötige zentrale Abhängigkeiten einführen. Neue Funktionen nach dem Prinzip „gemeinsamer Kern + persönliche Freiheit“ entwerfen; Anpassungen einfach und zugänglich halten.

## Unverhandelbare Regeln
1. **Keine echten Schülerdaten in Tests oder Demos**: keine Schülernamen, Bewertungen, Beobachtungen, Gesundheitsdaten oder sonstige personenbezogene Schuldaten in Supabase, GitHub, Logs, Beispieldateien oder Screenshots verwenden. Bis zur schulischen Freigabe ausdrücklich Demo-/Testbetrieb.
2. **Produktivsystem schützen**: Ohne gesonderte ausdrückliche Genehmigung des Nutzers **keine** produktiven Supabase-SQL-/RLS-/Auth-/Edge-Function-/Cron-/Secret-Änderungen, keine Datenmanipulationen und keine produktiven Zugangstests. Insbesondere keine echten Konten anlegen, sperren oder löschen. Bei Prüfaufträgen standardmäßig nur lesend arbeiten.
3. **Git sicher benutzen**: Nach Möglichkeit Feature-Branch + Pull Request statt Änderungen direkt auf `main`. `main` wird von GitHub Pages ausgeliefert. Keine destruktiven Git-Befehle oder unkontrollierten Merges.
4. **Secrets niemals veröffentlichen**: Keine service_role-/secret-Keys, SMTP-Zugangsdaten, VAPID-Private-Keys, Cron-Tokens, JWTs, Einladungs-/Recovery-Links, Cookie-/Session-Daten oder tatsächliche Nutzerdaten committen oder ausgeben. Publishable/anon-Keys und öffentliche VAPID-Keys sind keine Secret-Keys, müssen aber klar als solche erkennbar bleiben.
5. **Autorisierung gehört in die Datenbank**: UI-Sperren sind keine Sicherheit. Änderungen an Auth, Chat-Gruppen oder Einladungen müssen RLS, Mitgliedschaften, gesperrte Nutzer und Privatsphäre prüfen. Kein ungeprüfter Einsatz von `SECURITY DEFINER`.
6. **Nicht ungefragt neu bauen**: Kein Framework-Wechsel, keine Umstrukturierung der riesigen `index.html`, keine Ersetzung des Snapshotspeichers und kein großer Refactor als Nebeneffekt einer kleinen Aufgabe. Erst Analyse, kleinen Änderungsplan und Tests.
7. **Bestandsfunktionen erhalten**: A/B-Zuordnung (A=grün, B=blau), vier 90-min-Unterrichtsblöcke, Ferien/Feiertage, bewertete Mitarbeitstermine, Aufsichten, mobil/PWA, Anmelde- und Chatrechte müssen funktionsfähig bleiben.
8. **Datenschutz & Zugänglichkeit**: Eingaben validieren, fremde Inhalte sicher als Text rendern, keine Geheimnisse in URL/Logs; mobile Bedienbarkeit, Tastatur und nachvollziehbare Fehlermeldungen berücksichtigen.

## Technische Architektur
- **Frontend**: Vanilla HTML/CSS/JS ohne Build-System. `index.html` enthält große Teile von Datenmodell, UI und Logik. Weitere IIFE-Skripte: `cloud.js`, `mobile.js`, `hbl-v55.js` bis `hbl-v59.js`. CSS entsprechend.
- **Hosting**: GitHub Pages aus dem Repository; Service Worker `sw.js` cached die App-Shell. `manifest.webmanifest` liefert PWA-Metadaten.
- **Backend**: Supabase Auth, PostgreSQL mit RLS, Realtime, Edge Functions. Öffentliche Supabase-Projektkennung im Frontend; privilegierte Schlüssel ausschließlich serverseitig.
- **Edge Functions**: `supabase/functions/hbl-admin-users/index.ts` (Einladungslinks, Account- und Rechteverwaltung) und `supabase/functions/hbl-push-dispatch/index.ts` (Web-Push) und `supabase/functions/hbl-push-test/index.ts` (authentifizierter Testversand an das eigene registrierte Gerät). Änderungen an Dateien deployen Edge Functions **nicht automatisch**.
- **Datenbank**: Tabellen/Funktionen sind produktiv vorhanden, aber zum Stand dieser Dokumentation **nicht durch ein vollständiges Migrationsverzeichnis im Repository reproduzierbar**. Vor Schemaänderungen zuerst Ist-Schema in sicherer Umgebung dokumentieren und Migrationen entwerfen.
- **Beachte**: Der Push-Test wurde in v5.9.3 ergänzt. Die Supabase-Funktion `hbl-push-test` ist separat deployed und verlangt eine gültige Sitzung sowie ein Push-Abonnement des angemeldeten Nutzers. Ein bestätigter Versand bedeutet noch keine angezeigte Benachrichtigung am Gerät.
- **Beachte**: Module verwenden globale `window.hbl...`-Hooks und Events; die Lade-Reihenfolge ist wichtig. Nicht stillschweigend globale Schnittstellen oder PWA-Caching ändern.

Weitere Details: `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/SECURITY.md`.

## Vorgehensweise pro Auftrag
1. Auftrag und betroffene Module eingrenzen; reale Dateien lesen, nicht aus alten Chat-Zusammenfassungen auf Code schließen.
2. Vor Änderungen Abhängigkeiten prüfen (DOM, globale Hooks, Speicher-/Revisionslogik, RLS, Edge Functions, SW).
3. Einen überschaubaren Plan und mögliche Risiken nennen. Bei Audit/„prüfen“ **keine Code-/DB-Änderungen**, bis der Nutzer ausdrücklich Umsetzung beauftragt.
4. Kleine, verständliche Commits; Änderungen mit Tests belegen. Lokaler Basischeck: `npm test` (nur Node.js, keine Installation externer Pakete nötig).
5. Bei Änderungen an JS/CSS `index.html`-Referenzen und `sw.js`-App-Shell/CACHE sorgfältig synchron halten. HTML-Inline-JS auf Syntax prüfen; PWA alt/neu testen.
6. Für UI-Funktionen mindestens Desktop und Smartphone (schmale Ansicht), Hell-/Dunkelmodus, Login/Logout und Fehlersituationen gedanklich oder in Tests prüfen.
7. Bei Auth/Chat/PostgreSQL zusätzlich RLS-Negativtests mit *synthetischen* Konten in einer **separaten Testdatenbank** planen. Ohne Genehmigung nicht in Produktion ausführen.
8. Abschluss: geänderte Dateien, geprüfte Tests, nicht geprüfte Risiken sowie benötigte Deploy-/Migrationsschritte genau benennen; niemals ungetestete Funktionen als verifiziert darstellen.

## Übergabe des ChatGPT-Projektwissens

Lies auch `docs/CHATGPT_TO_CODEX.md`. Diese Datei bündelt Entscheidungen zu Produktvision, freien Links, A/B-Stundenplänen, Mitarbeitserhalt, geschlossenem Kollegiumszugang, Gruppenchats, Push und offenen Tests. Sie ist eine Kontextübergabe und kein automatischer Import des gesamten Chatverlaufs. Im Konfliktfall ist der tatsächliche Code der maßgebliche technische Ist-Stand.

## Prioritäten für die erste Codex-Sitzung
**Zuerst nur Lesemodus**: technische Bestandsaufnahme, Sicherheits-/Funktionsrisiken priorisieren, fehlende Tests aufzeigen und einen kleinen PR-Plan vorlegen. Einstieg: `docs/CODEX_START.md`.

## Fachliche Regeln
- Unterricht: vier Blöcke: 08:15–09:45, 10:05–11:35, 12:20–13:50, 14:00–15:30.
- A-Woche grün, B-Woche blau; Belegungen in einer oder beiden Wochen bzw. unterschiedlich je Woche.
- Aufsichten: 09:45–10:00, 11:35–11:55, 11:55–12:15.
- Brandenburg-Ferien/Feiertage berücksichtigen; lokale variable Ferientage sind ggf. schulspezifisch.
- Bei Änderungen an Stundenplan, Ausfällen oder Kalendereinträgen **bewertete Mitarbeitseinträge niemals unbemerkt löschen**.
- Chat ist **nur für freigeschaltete Lehrkräfte** bestimmt; Kalenderadmin, Hauptadmin, Dashboardzugang und Chat-Zugang sind getrennte Konzepte.
- Gruppennachrichten sind gemäß Mitgliedschaft abgesichert; neue Mitglieder können historischen Verlauf sehen, entfernte Mitglieder müssen Zugriff verlieren. Dies ist sicherheitsrelevant und muss bei Codeänderungen erhalten bleiben.

## Bitte nicht voraussetzen
- Es existiert derzeit kein vollständiger automatisierter Browser-End-to-End-Test.
- Ein bestandener Syntaxcheck beweist weder sichere RLS-Policies noch funktionierende Push-Zustellung oder aktuelle GitHub-Pages-Auslieferung.
- GitHub-Repository ist **public**, nicht privat.
- Frontend-Deploy, Edge-Function-Deploy und Datenbankmigration sind **drei getrennte Schritte**.
