# Entwicklung, Tests und Veröffentlichung

**Workflow aktualisiert:** 20.11.2026 · veröffentlichter Ausgangsstand v5.9.4.

Maßgeblich ist der aktuelle Pilot-Arbeitsmodus in `AGENTS.md`: beauftragte Routineänderungen direkt in GitHub und Supabase veröffentlichen, Prüfaufwand angemessen halten. Gesonderte PR-/Abnahmeverfahren bei Meilensteinen oder auf ausdrücklichen Wunsch. Ältere Checklisten sind Hilfsmittel und keine Pflicht vor jeder kleinen Änderung.

## Voraussetzungen

- Git und Node.js **20 oder neuer**
- Optional Python 3 für einen lokalen HTTP-Server
- Browser mit Entwicklertools
- Backend: vor Änderungen Zielprojekt und aktuellen Stand prüfen. Beauftragte Routineänderungen dürfen direkt im bestehenden Projekt erfolgen; die getrennte Testumgebung ist bei Bedarf verfügbar.

Das Frontend ist eine statische App **ohne Bundler und ohne npm-Abhängigkeiten**. Keine `npm install`-Schritte nötig, um den statischen Test auszuführen.

```bash
git clone https://github.com/HBL-gsgym/schul-dashboard.git
cd schul-dashboard
npm test
python3 -m http.server 8000
```

Browser: http://localhost:8000/

**Wichtig:** Der JavaScript-Client in `cloud.js` zeigt auf das bestehende Supabase-Projekt; die Auth-Redirect-URL ist für GitHub Pages angelegt. Nicht mit echten Produktivkonten gegen die lokale Vorschau testen. Für umfangreiche Auth-/RLS-Tests die vorhandene getrennte Testinstanz mit synthetischen Konten und passenden Redirect-URLs verwenden. Solche Testserien sind bei Routineänderungen keine pauschale Veröffentlichungsvoraussetzung.

## Architektur- und Änderungsworkflow

1. Ausdrücklich beauftragte Aufgabe eingrenzen; tatsächlichen Code und bei Backend-Arbeit den relevanten Supabase-Stand prüfen. Reine Audit-Aufträge bleiben lesend.
2. Kleine Änderung umsetzen; bestehende Konten, Rechte und Daten erhalten. Keine neuen Roadmap-Etappen eigenständig beginnen.
3. Nach Bedarf gezielt prüfen; bei Codeänderungen den vorhandenen schnellen `npm test`-Check nutzen. Browser-, Mehrgeräte-, Push- und RLS-Testserien nur passend zur Änderung, bei Meilensteinen oder auf Nutzerwunsch. Bereits bestandene Checks nicht ohne Anlass wiederholen.
4. Versionierung und Service-Worker-Assets synchron halten. Kleine nachvollziehbare Commits erstellen und Routineänderungen direkt auf `main`/GitHub Pages sowie nötige Edge-Functions und überschaubare DB-Anpassungen direkt in Supabase veröffentlichen. Keine zusätzliche Bestätigung für jeden Teilschritt.
5. Bei Meilensteinen (neue Hauptversion, Mandantentrennung, grundlegender Rollen-/Datenmodellumbau) vor Umsetzung einen technischen Plan und angemessene Abnahme abstimmen; PRs bei diesen Schritten oder auf Wunsch nutzen.
6. Veröffentlichung und betroffene Funktion gezielt kontrollieren, Ergebnis und offene Grenzen verständlich berichten. Datenlöschung, Reset und Kostenpflichtiges benötigen weiterhin einen konkreten Auftrag.

## Statischer Test

```bash
npm test
# alternativ:
node scripts/check-static.mjs
```

Prüft ohne Internet:
- JavaScript-Parsebarkeit (Dateien und Inline-Skripte in `index.html`)
- gültige `manifest.webmanifest`
- vorhandene lokale JS/CSS/Manifest/Icon-Referenzen
- Vollständigkeit der Service-Worker-App-Shell bezüglich eingebundener Skripte/Styles

**Kein Ersatz** für Browser-Smoke-Tests, Supabase-RLS, Edge-Functions, automatische Push-Zustellung oder DSGVO-Prüfung.

### Sonderfall: Änderungen an Versionsdateien

Wenn eine CSS-/JS-Datei geändert wird:
- Verweise und Query-Version (`?v=...`) in `index.html` aktualisieren, damit Geräte nicht alten Code laden.
- Dieselben URLs in `sw.js` unter `ASSETS` übernehmen.
- `CACHE`-Version in `sw.js` anheben, damit alte Caches ausgelöst werden.
- Service-Worker-Update auf PC und Smartphone prüfen (auch einmal vollständig neu öffnen).
- Keine personenbezogenen Inhalte in den SW-Cache legen.

Der Worker ist derzeit **cache-first** für statische App-Ressourcen und **network-first** für Dokumentnavigation. Unkontrollierte Cache-Neuordnung führt schnell zu schwer reproduzierbaren Fehlern.

## Backend: getrennt vom Frontend-Deploy

**Drei unabhängig zu prüfende Schritte:**

1. **GitHub Pages** – statische Dateien aus GitHub-`main`.
2. **Supabase Edge Functions** – Quellcode liegt im Repository; die Funktionen müssen separat deployed und geprüft werden.
3. **Supabase PostgreSQL/Auth/RLS/Cron/Secrets** – werden nicht durch einen GitHub-Push verändert.

**Aktueller Stand:** SQL-Struktur/Migrationshistorie ist nicht vollständig im Repository versioniert. Nicht aus den JS-Aufrufen eine scheinbar vollständige Schema-Migration „rekonstruieren“ und ungeprüft auf das Live-Projekt ausführen. Vor Änderungen Schema, Indizes, Grants, Trigger, RLS und Funktionsdefinitionen read-only exportieren, angemessen prüfen und innerhalb des beauftragten Umfangs veröffentlichen. Bei grundlegenden Migrationen gilt das Meilensteinverfahren aus `AGENTS.md`.

Für Supabase-Edge-Functions liegen die Quellen unter:
- `supabase/functions/hbl-admin-users/index.ts`
- `supabase/functions/hbl-push-dispatch/index.ts`
- `supabase/functions/hbl-push-test/index.ts` (v5.9.3: Server-Push-Test für ein eigenes registriertes Gerät)

Keine Service-Keys, SMTP-/VAPID-Private-Secrets, Cron-Tokens oder Zugangslinks in GitHub Actions, Browsercode oder PR-Beschreibungen speichern.

## Qualitätssicherung / Tests

Manuelle Checkliste: [SMOKE_TESTS.md](SMOKE_TESTS.md).

Priorisierte automatisierte Tests für künftige PRs:
- Reine Unterrichtslogik: A/B-Wechsel, Zeitgrenzen, Ferien/Feiertage, ausgefallene Unterrichtsblöcke.
- Mitarbeit: Kurs-Zuordnung nach Stundenplanänderung und **Erhalt vorhandener Bewertungen**.
- Auth/Profil: eingeladener, nicht freigeschalteter, gesperrter und gelöschter Nutzer.
- Chat: Lehrerzimmer, Direktnachrichten, Gruppeneigentümer, Hinzufügen/Entfernen, Lesen historischer Nachrichten, kein Zugriff nach Entfernen.
- Browser/PWA: DOM-Smoketests, Cache-Update, Offline-Verhalten, Push bei verschiedenen Zeitfenstern und Geräten.
- Supabase: RLS-Tests mit mehreren synthetischen Identitäten in **separater** Testdatenbank.

## Deployment-/Rollback-Checkliste (für Meilensteine und nach Bedarf)

Vor Freigabe:
- [ ] Diff enthält nur beabsichtigte Dateien; keine Secrets/Testdaten.
- [ ] `npm test` erfolgreich.
- [ ] Gefährdete Kernfunktionen manuell oder automatisiert geprüft.
- [ ] Bei Auth/DB: Sicherheitsreview, RLS-Negativtests und nötige Migration/Edge-Function-Version dokumentiert.
- [ ] `index.html`-Assets und `sw.js`-Assets/Cache-Version stimmen überein.
- [ ] Änderungen nachvollziehbar; bei Meilensteinen bzw. Nutzerwunsch PR geprüft. Keine unbemerkten Datenlöschungen.
- [ ] Abhängigkeiten der Liveversion und Rückfallplan dokumentiert.

Nach Freigabe:
- [ ] GitHub Pages liefert aktuellen Stand.
- [ ] Login, Dashboard und Chat mit Testdaten funktionieren.
- [ ] Smartphone/PWA prüft neue Version.
- [ ] Backend-Deploy, falls nötig, separat verifiziert.
- [ ] Änderungen im PR/Changelog vermerkt.

Rollback: Frontendversion per bekanntem Git-Commit wiederherstellen und SW-Cache neu versionieren; DB-Migrationen sind **nicht automatisch rückgängig** zu machen. Bei DB-Fehlern vorab geplante, getestete Restore-/Rollback-Strategie benutzen.
