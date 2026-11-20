# Übergabe von ChatGPT an Codex – Entscheidungen und Projektkontext

> **Aktuelle Produktentscheidung vom 20.11.2026:** [Persönlicher Arbeitsplatz und Schulportal](PRODUCT_ARCHITECTURE.md) beschreibt die weitere Richtung und die nächsten Schritte. Zunächst manuelle, vom Stundenplan unabhängige persönliche Kursverwaltung; Schulbetrieb ist eine spätere Etappe. Der Plan unterscheidet Zielbild und implementierten Stand und ersetzt keine Umsetzungsfreigabe.

**Stand der Übergabe:** 19.11.2026. **Zuletzt im Repository geprüfter Frontendstand:** v5.9.3 (18.11.2026). Bei Abweichungen ist immer der tatsächlich ausgecheckte Code maßgeblich.

Diese Datei überträgt wichtige **Ergebnisse und Entscheidungen** aus der bisherigen Projektentwicklung. Sie ist **kein vollständiges Transkript** aller ChatGPT-Gespräche und keine Aussage über bereits bestandene Ende-zu-Ende-Tests. Für technische Details: `AGENTS.md`, `README.md` und `docs/ARCHITECTURE.md`.

## Produktvision und Zielgruppe

> **Unsere aktuelle Software bestimmt unsere Arbeitsabläufe. Wir brauchen eine Software, die sich optimal an unsere individuellen Arbeitsabläufe anpassen kann.**

Die Software soll Lehrkräften einen flexiblen persönlichen Arbeitsplatz bieten. Gemeinsame schulische Informationen sind wichtig, aber **individuelle Werkzeuge und Workflows sind ausdrücklich erwünscht**. Prinzip: *gemeinsamer Kern, persönliche Freiheit*.

Das Dashboard ist ein selbstständig entwickelter **Pilot für Lehrkräfte**, bislang kein offiziell freigegebenes Schul-Produktivsystem. Es soll später möglicherweise im Kollegium vorgestellt werden. Das Projekt ist bewusst zunächst unabhängig von schulischer IT-/Domaininfrastruktur konzipiert.

## Bisherige Produktentscheidungen

### Persönlicher Arbeitsplatz
- Frei wählbare eigene Links statt einer ausschließlich starren Liste des Herstellers. Links und Kategorien sind Teil des Nutzens, keine bloße Dekoration.
- Persönlich organisierbare Dashboard-Kacheln und Links zu beliebigen geeigneten Lehrkräfte-Werkzeugen.
- Gute Bedienbarkeit auf Desktop und Smartphone; Hell-/Dunkelmodus und installierbare PWA erhalten.
- Gemeinsame schulische Grundangebote dürfen zentral gepflegt werden, sollen aber persönliche Anpassungen nicht unnötig verdrängen. Eine erweiterte Trennung zwischen persönlichen und zentralen Links ist eine **Idee**, keine als umgesetzt behauptete Funktion.

### Zeit, Unterricht und Mitarbeit
- A-/B-Wochen mit **A = grün, B = blau**; Fächer können in A und B verschieden sein oder in beiden Wochen stattfinden.
- Vier Unterrichtsblöcke: 08:15–09:45, 10:05–11:35, 12:20–13:50, 14:00–15:30.
- Stundenplanfelder mit Fach, Klasse und Raum flexibel verwalten.
- Stundenplan und Mitarbeitslisten gehören zusammen: Die geplanten Unterrichtstermine müssen zu Kursen und Wochenrhythmus passen.
- Bereits dokumentierte Bewertungen dürfen bei Stundenplanänderungen oder Veranstaltungsausfällen **nicht versehentlich gelöscht werden**.
- Brandenburg-Schulkalender und schulische Veranstaltungen/Blockausfälle berücksichtigen; schulspezifische Ferien-/Termindetails verifizieren.

### Anmeldung und Benutzerverwaltung
- Kollegiumsorientierter Zugang, **keine offene Selbstregistrierung** als gewünschtes Betriebsmodell.
- Der Owner verwaltet Freischaltung, Sperrung, Einladungen und Passwortwiederherstellung. Benutzer setzen ihr eigenes Passwort.
- Für den kostenfreien Pilotbetrieb werden **manuell zu versendende persönliche Einladungs-/Recovery-Links** bevorzugt; weder eigene Domain noch automatischer SMTP-Versand sind vorerst erforderlich. Zugangstokens vertraulich behandeln.
- Technisch zwischen Supabase-Auth-Identität, Dashboardfreigabe, Kalender-Adminrechten, Owner und Chatfreigabe unterscheiden.

### Kollegium-Kommunikation
- Gemeinsames Lehrerzimmer, private Direktnachrichten und selbst erstellbare Gruppenchats.
- Gruppe benennen, Mitglieder hinzufügen/entfernen und als berechtigter Verantwortlicher verwalten.
- Neue Mitglieder dürfen nach dem gewählten Modell vorhandene Gruppennachrichten lesen; entfernte Mitglieder dürfen **auch alte Nachrichten nicht mehr lesen**. Dies ist eine **serverseitige RLS-Anforderung**, keine reine UI-Regel.
- Ungelesen-Markierungen und Realtime-Verhalten nicht durch Änderungen an Gruppenverwaltung beschädigen.

### Push-Benachrichtigungen
- Nutzer können Chat-Pop-ups aktivieren und Wochentage, Uhrzeitfenster und Vorschautext einstellen; Europe/Berlin inklusive Sommerzeit beachten.
- Geräte-Push erfordert Zustimmung, Registrierung und Plattformunterstützung. Bei iOS die Anforderungen an installierte Web-Apps beachten.
- In v5.9.3 kam ein **authentifizierter Test-Push an das eigene registrierte Gerät** hinzu: `hbl-v59.js` ruft `hbl-push-test` auf. Der vollständige deployed Edge-Function-Code ist im Repository unter `supabase/functions/hbl-push-test/index.ts` nachgeführt.
- Server meldet die Annahme eines Test-Pushs; das ersetzt nicht die Prüfung, ob das Betriebssystem die Nachricht tatsächlich angezeigt hat.

## Technischer Zustand am Übergabezeitpunkt

- Frontend: Vanilla HTML/CSS/JavaScript auf GitHub Pages, Hauptlogik teilweise in der umfangreichen `index.html`; weitere JS-Erweiterungen durch `hbl-v55.js` bis `hbl-v59.js`, `cloud.js`, `mobile.js`.
- Backend: Supabase Auth, Postgres/RLS, Realtime, Edge Functions. Die vorhandenen **produktiven Daten und Auth-Konten gehören nicht zum Git-Repository**.
- Im Repository stehen die Edge-Function-Quelltexte `hbl-admin-users`, `hbl-push-dispatch` und `hbl-push-test`.
- Das vollständige SQL-Schema / RLS-/Trigger-Migrationspaket ist **noch nicht reproduzierbar versioniert**. Nicht aus Frontend-Annahmen ersetzen.
- Node-basierter statischer Offline-Check: `npm test`; GitHub Actions prüft bei Commits/PRs. Statischer Erfolg ≠ Browser-, Chat-, RLS-, Backend-, Geräte- oder Push-End-to-End-Test.
- Service-Worker-App-Shell muss bei JS-/CSS-Versionswechsel mit `index.html` synchron bleiben. Am 18.11.2026 trat genau deswegen kurz ein fehlgeschlagener Test auf, anschließend erfolgreich korrigiert.

## Sicherheit und Datenschutz

1. Das GitHub-Repository ist **öffentlich**. Keine Schlüssel, Token, privaten Links, Chatdaten, vollständigen Datenbankdumps oder personenbezogenen Schuldaten committen.
2. Bis zur schulischen Freigabe **nur synthetische Schüler- und Testdaten**. Auch Kollegiums-E-Mails und Chatnachrichten können personenbezogen sein.
3. Ohne gesonderten Auftrag keinerlei produktive Supabase-Schreib-/Auth-/Schema-/RLS-/Edge-Function-Änderung, keinen Push-Versandtest gegen reale Endgeräte, keine Kontensperrung und keine Löschungen.
4. Frontend, Supabase-Datenbank und Edge-Functions haben **getrennte Deploywege**.
5. RLS/Autorisierung und Fehler mit mehreren Nutzern in **isolierter Testumgebung** prüfen; siehe `docs/SECURITY.md` und `docs/SMOKE_TESTS.md`.

## Was bereits entschieden ist – und was nicht

**Entschieden:** GitHub als Codequelle, Supabase als Backend, persönlicher Arbeitsbereich mit freien Links, geschlossener Kollegiumszugang, A/B-Logik, Lehrerzimmer + Einzel-/Gruppenchat, anpassbare Push-Zeiten, Sicherheit vor Refactoring.

**Noch nicht fertig oder bestätigt:** Browser-E2E, Mehrkonten-/RLS-Negativtests, robuste Mobil-Push-Zustellung, komplette versionierte SQL-Migrationen und spätere schulische Freigabe. Codex Cloud/Fernzugriff ist ein **separater späterer Schritt** und nicht Bestandteil dieser Code-/Kontextübergabe.

## Arbeitsauftrag für die erste Codex-Sitzung

1. **Nur lesen und prüfen.** Starte mit `AGENTS.md`, `README.md`, `docs/CODEX_START.md` und dieser Datei.
2. Analysiere anschließend den **realen** Stand im ausgecheckten Repository. Nimm diese Zusammenfassung nur als Kontext, nicht als Wahrheit über die letzte Codeversion.
3. Führe `npm test` lokal aus; keine Produktivzugriffe oder Schreiboperationen.
4. Liefere einen deutschsprachigen priorisierten Bericht mit Fundstellen, Risiken, noch offenen Prüfungen und Vorschlägen für drei kleine PRs.
5. **Nicht eigenmächtig refactoren oder deployen**. Auf Freigabe warten.

**Wichtig:** Der frühere ChatGPT-Verlauf wird nicht automatisch in Codex importiert; diese und die übrigen Dokumentationsdateien transportieren die wesentlichen Entwicklungsentscheidungen. Änderungen, die darüber hinausgehende frühere Nutzerwünsche betreffen, vor Umsetzung konkret erfragen bzw. in den dokumentierten Anforderungen nachschlagen.
