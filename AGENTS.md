# Codex-Arbeitsanweisungen – Schul-Dashboard HBL

> Diese Datei gilt für das gesamte Repository. Zuerst lesen, danach `README.md` und die Dokumentation unter `docs/`. Sprache für Kommunikation und sichtbare Benutzeroberfläche: Deutsch.

## Zweck und aktueller Stand
Dies ist ein **öffentliches GitHub-Repository** für den **Pilotbetrieb** einer schulischen Lehrer-Dashboard-Web-App. Der veröffentlichte Ausgangsstand dieser Arbeitsregel ist **v5.9.4** (20.11.2026). Die tatsächlich ausgecheckten Dateien sind immer maßgeblich; Dokumentation kann veralten. Das Projekt liegt unter `HBL-gsgym/schul-dashboard`; der Produktions-Frontend-Link ist https://hbl-gsgym.github.io/schul-dashboard/.

Funktionen: individuelle A/B-Stundenpläne, Pausenaufsichten, Aufgaben/Korrekturen/Vorbereitung, Brandenburg-Schuljahreskalender und Schulveranstaltungen/Unterrichtsausfälle, Mitarbeitserfassung, individuelle Links und Kachel-Layout, Supabase-Login und Benutzerverwaltung mit manuellen Einladungs-/Passwortlinks, Lehrerzimmer, Direkt- und Gruppenchats, Web-Push/PWA.

## Leitbild und Produktentscheidung

> **Unsere aktuelle Software bestimmt unsere Arbeitsabläufe. Wir brauchen eine Software, die sich optimal an unsere individuellen Arbeitsabläufe anpassen kann.**

Dies ist die zentrale Produktvision. **Software folgt dem Arbeitsablauf der Lehrkraft – nicht umgekehrt.** Bei Produktentscheidungen Personalisierung und selbstbestimmte Arbeitsweisen erhalten: frei wählbare Links, individuell geordnete Kategorien und Kacheln, persönliche Werkzeuge und Stundenpläne. Gemeinsame schulische Grundfunktionen dürfen sinnvoll standardisiert sein, aber individuelle Anpassungen nicht grundlos blockieren. Keine starren, herstellerdefinierten Linklisten, erzwungenen Workflows oder unnötige zentrale Abhängigkeiten einführen. Neue Funktionen nach dem Prinzip „gemeinsamer Kern + persönliche Freiheit“ entwerfen; Anpassungen einfach und zugänglich halten.

## Aktueller Arbeitsmodus im kleinen Pilotbetrieb (20.11.2026)

**Ausdrückliche Vorgabe des Projektverantwortlichen:** Aktuell nutzen nur der Entwickler, sein eigener Testaccount und zwei befreundete Feedbackgeber das Dashboard. Für ausdrücklich beauftragte Aufgaben deshalb zügig und direkt arbeiten:

- Änderungen im normalen Pilotbetrieb direkt auf GitHub (`main`/GitHub Pages) und, soweit für den Auftrag erforderlich, direkt im bestehenden Supabase-Projekt umsetzen und veröffentlichen. Der Umsetzungsauftrag umfasst die dafür nötigen Frontend-, Edge-Function- und überschaubaren Datenbankänderungen; keine zusätzliche Freigabe für jeden technischen Teilschritt verlangen.
- Keine obligatorischen PR-Entwürfe, getrennten Testinstanzen, umfassenden Testserien oder wiederholten Bestätigungsrunden vor jeder kleinen Veröffentlichung. Vorhandene schnelle Checks und gezielte Funktionsprüfungen nach Art und Risiko der Änderung einsetzen; einen bestandenen Check ohne neue Ursache nicht wiederholen. Reine Dokumentationsänderungen benötigen keinen Anwendungstest.
- **Ausnahmen:** Bei echten Meilensteinen (z. B. neue Hauptversion, schulübergreifende Architektur, grundlegender Rollen-/Datenmodellumbau) zuerst einen kleinen technischen Plan und angemessene Abnahmetests mit dem Nutzer abstimmen. Ebenso ausdrücklich verlangte Prüf-, PR-, Test- oder Freigabeschritte beachten.
- Nur an ausdrücklich beauftragten Aufgaben arbeiten. Roadmap-Issues sind Orientierung und kein Startauftrag für neue Versionen oder Migrationen außerhalb des aktuellen Auftrags.
- Bestehende Konten, IDs, Berechtigungen und gespeicherte Daten bewahren. Datenlöschung, Reset, Kontolöschung oder andere irreversible Eingriffe sind durch diesen Arbeitsmodus nicht pauschal genehmigt; Kostenpflichtiges ebenfalls nicht ungefragt beauftragen.
- Vor Änderungen den tatsächlich betroffenen Code und bei Backend-Arbeit den relevanten Datenbank-/Function-Stand prüfen. Kleine nachvollziehbare Änderungen, geeignete Versionierung und einen praktikablen Rückweg erhalten.
- Nach Umsetzung kurz auf Deutsch erklären, was geändert und veröffentlicht wurde, was geprüft wurde und welche konkreten Grenzen offen sind. Nicht geprüfte Abläufe nicht als verifiziert darstellen.
- Kommunikation verständlich halten, Fachbegriffe kurz erklären und am Ende den nächsten sinnvollen Schritt nennen. Nur nach Zustimmung fragen, wenn ein neuer Auftrag, eine echte offene Entscheidung oder eine der obigen Ausnahmen vorliegt.

**Diese aktuelle Workflow-Vorgabe ersetzt ältere pauschale „erst testen/PR/Freigabe, dann veröffentlichen“-Regeln in der Dokumentation und in Konzept-Issues.** Fachliche Anforderungen, Konten-/Datenerhalt, Geheimnisschutz und der Umfang des Nutzerauftrags gelten weiterhin. Ein ausdrücklich nur lesender Prüfauftrag bleibt lesend.

## Tokenbewusst und zügig arbeiten (20.11.2026)

- **Gezielt lesen:** Nach dem Einstieg nur betroffene Dateien, relevante Codeabschnitte und geänderte Vorgaben prüfen. Dokumentation nicht bei jeder Kleinigkeit vollständig erneut lesen. Bekannte Zusammenhänge aus der laufenden Sitzung weiterverwenden; vor Änderungen den relevanten aktuellen Stand trotzdem kontrollieren.
- **Kurz kommunizieren:** Abschluss möglichst als „Geändert – geprüft – live – nächster Schritt“ in wenigen Sätzen. Fachbegriffe kurz erklären. Ausführliche Pläne, Begründungen und Berichte nur bei Bedarf, Problemen, Meilensteinen oder auf Nachfrage. Fortschrittsmeldungen knapp und nur mit neuen Erkenntnissen.
- **Checks einmal und passend ausführen:** Vorhandene schnelle Checks nutzen; nach erfolgreichem Lauf nur bei weiteren relevanten Änderungen oder ungeklärten Fehlern wiederholen. Zusätzliche Tests gezielt auf das geänderte Verhalten und konkrete Risiken begrenzen. Keine komplette Testkampagne für jede Kleinigkeit.
- **Browser punktuell einsetzen:** Sichtbare Änderungen und wichtige betroffene Bedienabläufe prüfen. Keine vollständige Browserrunde für reine Backend-, Dokumentations- oder kleine technische Änderungen ohne UI-Auswirkung. Grenzen der tatsächlichen Prüfung ehrlich nennen.
- **Zusammengehörige Wünsche bündeln:** Mehrere bereits beauftragte kleine Anpassungen möglichst in einem Durchgang umsetzen und veröffentlichen. Nicht jeden technischen Teilschritt erneut bestätigen lassen; keine unbestellten Funktionen hinzufügen.
- **Zusatzarbeit vermeiden:** Keine neuen Testsysteme, umfangreichen Refactorings, langen Architekturpläne oder ausführlichen Zusatzdokumente als Nebenprodukt einer kleinen Aufgabe. Vorhandene Werkzeuge und Tests wiederverwenden.
- **Tool-Ausgaben begrenzen:** Suchen auf relevante Pfade/Muster eingrenzen, nur notwendige Ausschnitte auslesen und unabhängige Abfragen bündeln. Erfolgreiche Checks kurz zusammenfassen; ausführliche Logs und Diffs nur bei konkretem Bedarf. Keine großen Datei-, Bild- oder Protokollausgaben ohne Nutzen für die aktuelle Entscheidung.
- Token sparen durch gezielteres Arbeiten, nicht durch Weglassen erforderlicher Umsetzung, Verschweigen von Fehlern oder Behaupten ungetesteter Erfolge. Geheimnisschutz, Konten-/Datenerhalt und ausdrücklich verlangte Prüfungen bleiben verbindlich.

## Unverhandelbare Regeln
1. **Keine echten Schülerdaten in Tests oder Demos**: keine Schülernamen, Bewertungen, Beobachtungen, Gesundheitsdaten oder sonstige personenbezogene Schuldaten in Supabase, GitHub, Logs, Beispieldateien oder Screenshots verwenden. Bis zur schulischen Freigabe ausdrücklich Demo-/Testbetrieb.
2. **Pilotbetrieb und Daten schützen**: Im aktuellen Arbeitsmodus sind die für einen ausdrücklich erteilten Umsetzungsauftrag nötigen Supabase-Änderungen und Deployments direkt erlaubt. Auftragsumfang einhalten, Konten und gespeicherte Daten erhalten; keine ungefragten Löschungen, Resets oder fachfremden Konfigurationsänderungen. Bei reinen Prüfaufträgen lesend arbeiten.
3. **Git nachvollziehbar benutzen**: Im normalen Pilotbetrieb direkt auf `main` veröffentlichen; PRs bei Meilensteinen oder auf Nutzerwunsch. `main` wird von GitHub Pages ausgeliefert. Keine destruktiven Git-Befehle oder unkontrollierten Merges; fremde Änderungen bewahren.
4. **Secrets niemals veröffentlichen**: Keine service_role-/secret-Keys, SMTP-Zugangsdaten, VAPID-Private-Keys, Cron-Tokens, JWTs, Einladungs-/Recovery-Links, Cookie-/Session-Daten oder tatsächliche Nutzerdaten committen oder ausgeben. Publishable/anon-Keys und öffentliche VAPID-Keys sind keine Secret-Keys, müssen aber klar als solche erkennbar bleiben.
5. **Autorisierung gehört in die Datenbank**: UI-Sperren sind keine Sicherheit. Änderungen an Auth, Chat-Gruppen oder Einladungen müssen RLS, Mitgliedschaften, gesperrte Nutzer und Privatsphäre prüfen. Kein ungeprüfter Einsatz von `SECURITY DEFINER`.
6. **Nicht ungefragt neu bauen**: Kein Framework-Wechsel, keine Umstrukturierung der riesigen `index.html`, keine Ersetzung des Snapshotspeichers und kein großer Refactor als Nebeneffekt einer kleinen Aufgabe. Zuerst den betroffenen Bestand prüfen; größere Architekturänderungen nur im ausdrücklich beauftragten Umfang planen und umsetzen.
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
4. Kleine, verständliche Commits und angemessene gezielte Prüfung. `npm test` ist der schnelle vorhandene Basischeck bei Codeänderungen; keine vollständige Testkampagne als Standard-Voraussetzung für kleine Veröffentlichungen.
5. Bei Änderungen an JS/CSS `index.html`-Referenzen und `sw.js`-App-Shell/CACHE sorgfältig synchron halten. HTML-Inline-JS bei Änderungen auf Syntax prüfen; betroffene PWA-Abläufe gezielt prüfen.
6. Für UI-Funktionen mindestens Desktop und Smartphone (schmale Ansicht), Hell-/Dunkelmodus, Login/Logout und Fehlersituationen gedanklich oder in Tests prüfen.
7. Bei Auth/Chat/PostgreSQL die betroffenen Berechtigungen gezielt prüfen. Die vorhandene getrennte Testinstanz bei Bedarf nutzen; sie ist keine Pflicht für jede Änderung. Umfangreiche RLS-/Mehrkontentests bei Meilensteinen oder auf Nutzerwunsch. Nur synthetische Testdaten verwenden.
8. Abschluss: geänderte Dateien, geprüfte Tests, nicht geprüfte Risiken sowie benötigte Deploy-/Migrationsschritte genau benennen; niemals ungetestete Funktionen als verifiziert darstellen.

## Übergabe des ChatGPT-Projektwissens

Lies auch `docs/CHATGPT_TO_CODEX.md`. Diese Datei bündelt Entscheidungen zu Produktvision, freien Links, A/B-Stundenplänen, Mitarbeitserhalt, geschlossenem Kollegiumszugang, Gruppenchats, Push und offenen Tests. Sie ist eine Kontextübergabe und kein automatischer Import des gesamten Chatverlaufs. Im Konfliktfall ist der tatsächliche Code der maßgebliche technische Ist-Stand.

## Prioritäten für die erste Codex-Sitzung
Die erste lesende Bestandsaufnahme wurde bereits durchgeführt. `docs/CODEX_START.md` bleibt als Vorlage für ausdrücklich beauftragte Audits erhalten und ist keine erneute Freigabeschleife für spätere Umsetzungsaufträge. Für laufende Arbeit gilt der aktuelle Pilot-Arbeitsmodus oben.

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
