# Erster Codex-Auftrag: Bestandsaufnahme ohne Änderungen

**Empfohlener Einstieg nach Verbindung von `HBL-gsgym/schul-dashboard` mit Codex.** Stand der Dokumentation: 18.11.2026, Version v5.9.3.

## Diesen Prompt in Codex verwenden

```text
Du übernimmst das bestehende Projekt "Schul-Dashboard HBL" im Repository
HBL-gsgym/schul-dashboard. Bitte beginne ausschließlich mit einer LESENDEN
Bestandsaufnahme. Verändere KEINE Dateien, Daten, Benutzerkonten, Einstellungen,
Supabase-Projekte, Edge Functions oder Deployments. Erstelle noch keinen PR.

1. Lies zuerst AGENTS.md, README.md und alle Dateien in docs/.
2. Prüfe anschließend den TATSÄCHLICHEN aktuellen Repository-Stand:
   index.html, cloud.js, mobile.js, hbl-v55.js bis hbl-v59.js,
   sw.js, die CSS-Dateien sowie alle drei Supabase-Edge-Functions (einschließlich hbl-push-test).
3. Ordne die Architektur und Datenflüsse ein (Supabase Auth, Dashboard-
   Freigabe, Admin/Owner, Snapshots mit Revision, A/B-Stundenpläne,
   Kalender/Ausfallblöcke, Mitarbeit, Lehrerzimmer, Direkt- und Gruppenchat,
   Push und PWA).
4. Untersuche besonders:
   - Zugriffsrechte und mögliche Schwachstellen in Frontend/Edge-Functions;
     RLS-Schema aus der Dokumentation ist nur Ausgangspunkt, nicht Beweis.
   - Einladungslinks, Passwort-Ersteinrichtung, Kontosperre/Löschung.
   - Gruppenrollen, Aufnahme/Entfernen, Verlaufssichtbarkeit, Realtime,
     ungelesene Nachrichten und Chat-Push, einschließlich des neuen
     authentifizierten Geräte-Push-Tests (v5.9.3).
   - Speicherung bei parallelen Geräten, Datenkonflikte, Datenverlustrisiken.
   - A/B-Wochen, Ferien/Feiertage, Blockausfälle, Erhalt von Bewertungen.
   - Script-Ladereihenfolge, globale Hooks, PWA/Service-Worker-Caching.
   - Fehlende Tests und fehlende versionierte Supabase-Migrationen.
5. Führe nur sichere, lokale, nicht-schreibende Prüfungen wie "npm test"
   aus. Verwende KEINE echten Schüler-/Kollegiumsdaten und führe KEINE
   produktiven Supabase-Schreib- oder Auth-Tests aus.
6. Gib einen strukturierten Prüfbericht auf Deutsch:
   a) bestätigte Architektur und Abhängigkeiten,
   b) Fehler/Risiken nach Priorität kritisch/hoch/mittel/niedrig,
   c) pro Befund Datei und möglichst genaue Zeile, Erklärung und Prüfweg,
   d) fehlende Nachweise bzw. noch zu testende Hypothesen klar abgrenzen,
   e) Vorschlag für die ersten drei KLEINEN, sicheren Pull Requests
      inklusive Akzeptanzkriterien und Testplan.
7. Beende die Aufgabe nach dem Bericht und WARTE auf meine Entscheidung,
   bevor du Änderungen implementierst.

Die Anwendung ist eine Pilotversion für Lehrkräfte. Bitte keine großflächigen
Refactorings, keine neuen Frameworks, keine studentischen Echtdaten und keine
Behauptungen über erfolgreiche Produktivtests ohne entsprechende Nachweise.
```

## Nach dem Audit

Codex soll zuerst Rückfragen oder einen kleinen PR-Vorschlag liefern – **nicht automatisch alles refactoren oder produktive Daten verändern**. Sinnvolle Reihenfolge:

1. Kritische Sicherheits-/Datenverlustfehler nach verifizierten Befunden beseitigen.
2. Reproduzierbare automatisierte Kernlogik- und Browser-Smoketests ergänzen.
3. Datenbankschema kontrolliert exportieren und in einer **separaten** Supabase-Testinstanz reproduzierbar machen.
4. `index.html` in kleinen, getesteten Schritten modularisieren (nur nach Freigabe).
5. Neue Funktionen erst danach umsetzen.

**Codex und Produktionssystem sind nicht dasselbe:** Ein GitHub-Pull-Request deployed keine Edge Functions und keine SQL-Migrationen.
