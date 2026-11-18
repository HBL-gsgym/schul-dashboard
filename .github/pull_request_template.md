# Änderung am Schul-Dashboard HBL

## Zweck
Beschreibe präzise das Problem und warum diese Änderung notwendig ist.

## Änderungen
- Betroffene Dateien/Module:
- Neue/angepasste Schnittstellen:
- Bewusst NICHT verändert:

## Risikoanalyse
- Auswirkung auf Anmeldung, Dashboard-Mitgliedschaft und Adminrechte:
- Auswirkung auf privaten Chat, Gruppenzugehörigkeit und RLS:
- Auswirkung auf Stundenplan, Ausfallblöcke und vorhandene Mitarbeitseinträge:
- Auswirkung auf Push, Realtime, PWA-Cache und Smartphone:
- Bei Supabase: getrennte Test-/Migrations-/Deploy-Schritte:

## Tests
- [ ] `npm test` erfolgreich
- [ ] Relevante Funktion mit synthetischen Daten geprüft
- [ ] Unberechtigter Zugriff / Fehlersituation geprüft (sofern betroffen)
- [ ] Desktop und schmale Smartphone-Ansicht geprüft (sofern UI)
- [ ] Bei CSS/JS: `index.html`-Versionen und `sw.js`/CACHE synchronisiert
- [ ] Keine Secrets, Einladungslinks oder echten Schüler-/Kollegiumsdaten im PR

### Nachweise und noch offene Prüfungen
Konkret protokollieren, was ausgeführt und was NICHT geprüft wurde. Ein Syntaxcheck ist kein E2E-Test.

## Deployment / Rollback
- [ ] Nur GitHub Pages / statische Dateien
- [ ] Edge Function separat zu deployen (nur mit Freigabe)
- [ ] Datenbank/Auth/RLS/Cron separat zu ändern (nur mit Freigabe)
- Rückfallplan:

> Pilotbetrieb: keine echten Schülerdaten. Kein ungeprüfter produktiver Supabase-Schreibzugriff.
