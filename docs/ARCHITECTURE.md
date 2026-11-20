# Architektur und Datenfluss

> **Aktuelle Produktentscheidung vom 20.11.2026:** [Persönlicher Arbeitsplatz und Schulportal](PRODUCT_ARCHITECTURE.md) beschreibt die weitere Richtung und die nächsten Schritte. Zunächst manuelle, vom Stundenplan unabhängige persönliche Kursverwaltung; Schulbetrieb ist eine spätere Etappe. Der Plan unterscheidet Zielbild und implementierten Stand und ersetzt keine Umsetzungsfreigabe.

**Stand:** Repository v5.9.3, geprüft am 18.11.2026. Dies ist eine Bestandsdokumentation des tatsächlich vorhandenen Frontends sowie eine lesende Übersicht des Supabase-Schemas, keine Behauptung über abgeschlossene End-to-End-Tests.

## Systemüberblick

```text
Browser / installierte PWA
  ├─ index.html (große Inline-Logik: Stundenplan, Kalender, Mitarbeit, Aufgaben, Layout)
  ├─ mobile.js
  ├─ cloud.js → Supabase Auth + hbl_dashboard_snapshots / hbl_save_snapshot
  ├─ hbl-v55.js → Aufsichten + Push-Registrierung
  ├─ hbl-v56.js → gemeinsame Schulveranstaltungen + Rechteverwaltung + Links
  ├─ hbl-v57.js → Lehrerzimmer / 1:1 / Gruppen + Realtime
  ├─ hbl-v58.js → Benutzerprofil / Passwort-Ersteinrichtung
  ├─ hbl-v59.js → Chat-Push-Präferenzen und gerätespezifischer Push-Test
  └─ sw.js → Cache der App-Shell + Systembenachrichtigungen
                      │ HTTPS
                      ▼
Supabase
  ├─ Auth: Lehrer-Konten und Sessions
  ├─ PostgreSQL + RLS: private Snapshots, Mitgliedschaften, Kalender, Chats
  ├─ Realtime: Nachrichten / Gruppenereignisse
  └─ Edge Functions:
       hbl-admin-users     (owner-only: Nutzer/Einladungen/Rechte)
       hbl-push-dispatch   (serverseitige Push-Verteilung)
       hbl-push-test       (authentifizierter Testversand ans eigene Gerät)
```

Hosting der statischen App: GitHub Pages. Edge Functions und Supabase-Datenbank sind **nicht** Teil des GitHub-Pages-Deployments. Es existiert kein klassischer Node-Server im Repository.

## Frontend-Dateien und Zuständigkeiten

| Datei | Beobachtete Zuständigkeit |
| --- | --- |
| `index.html` | App-Shell, Konfiguration, Dashboard-Kacheln, Tages-/Wochenansicht, Ferienberechnung, Aufgaben/Vorbereitung, Mitarbeitskurse, Stundenplaneditor und mehrere globale Funktionen |
| `cloud.js` | Supabase-Client, Auth-Session, Accountfreigabe und Synchronisierung des persönlichen `prepDone`-Snapshots mit Revision |
| `hbl-v55.js` | Pausenaufsichten, PWA-Installation, Service-Worker-Registrierung, Push-Abos |
| `hbl-v56.js` | Schulweite Ereignisse und Block-Ausfälle, Benutzer- und Rollenverwaltung, Link-Zentrale, Unterrichtsblockfortschritt |
| `hbl-v57.js` | Chat-Freigabe, Lehrerzimmer, 1:1, Gruppen, Mitglieder, Nachrichten, Realtime |
| `hbl-v58.js` | Username/Profile und initiale eigene Passwortwahl |
| `hbl-v59.js` | Nutzerseitige Chat-Push-Einstellungen (Tage, Start/Ende, Vorschautext) und Push-Verbindungstest |
| `mobile.js` | Mobile Navigation und responsive Hilfen |
| `sw.js` | App-Shell-Cache, Push-Empfang, Benachrichtigungsklick |
| `manifest.webmanifest` | PWA-Name, Start-URL, Icons, Standalone-Modus |
| `stundenplan-editor.html` | Separates Stundenplan-Hilfsdokument; nicht mit Haupteditor verwechseln |

`index.html` ist über 220 KB groß. Die JS-Erweiterungen sind überwiegend IIFEs mit Abhängigkeiten über `window.hbl...` und DOM-Elemente. **Vor jeder Änderung zunächst Referenzen und Initialisierungspfad suchen**; keine implizite ES-Module-Reihenfolge voraussetzen.

### Besondere globale Kopplungen

- `window.hblCloudClient` liefert den in `cloud.js` angelegten Browser-Supabase-Client.
- `window.hblCloudUser()` liefert die momentan bekannte Auth-Nutzerinstanz.
- `hbl-cloud-status` und `hbl-profile-changed` sind verwendete Browser-Events zur Aktualisierung abhängiger Module.
- `prepDone`, `applyPrepData` und `savePrepFile` gehören zum Snapshotsystem. `cloud.js` überschreibt `window.savePrepFile` zur Cloud-Synchronisierung.
- Stundenplan und Kalender interagieren über `window.hblCancelled`, `window.hblFullDayCancelled`, `window.hblPlannedSlots` und die Plan-/Kalender-Render-Funktionen. Die tatsächlichen Funktionen und ihre Export-/Zugriffsart im Code prüfen.
- `hbl-v57.js` und `hbl-v59.js` teilen Elemente der Chatoberfläche. Änderungen dürfen deren IDs und Mount-Reihenfolge nicht unbemerkt brechen.

## Persönliche Datenhaltung und Stundenplan

`cloud.js` speichert pro freigeschaltetem Konto eine eigene JSON-Snapshot-Zeile in `public.hbl_dashboard_snapshots`. `public.hbl_save_snapshot` übernimmt die Speicherversion; `revision` und lokale Pending-Snapshots unterstützen Konflikterkennung. **Keine stillen Überschreibungen** bei gleichzeitiger Bearbeitung von mehreren Geräten.

Der Stundenplan in `index.html` arbeitet mit A/B-Wochen und den vier Unterrichtsblöcken:

| Block | Zeitraum |
| --- | --- |
| 1 | 08:15–09:45 |
| 2 | 10:05–11:35 |
| 3 | 12:20–13:50 |
| 4 | 14:00–15:30 |

A = grün, B = blau. Pausenaufsichten in `hbl-v55.js`: 09:45–10:00, 11:35–11:55, 11:55–12:15. Unterrichtsplanung/Mitarbeit berücksichtigen Schuljahresdaten, Ferien, Feiertage und schulische Ausfallblöcke. Bereits vergebene Bewertungen müssen bei Stundenplanänderungen erhalten bleiben. Schuljahresangaben sind im Quellcode hinterlegt und jährlich zu prüfen.

## Auth, Rollen und Einladungen

1. Anmeldung via Supabase Auth (`cloud.js`).
2. `public.hbl_dashboard_members.enabled` entscheidet über freigeschalteten Dashboard-Zugang; nicht bloß das Vorhandensein eines Auth-Kontos.
3. `public.hbl_user_profiles` hält Benutzername/Profile. `hbl-v58.js` erzwingt für neue Nicht-Owner-Profile eine eigene Passwortwahl.
4. `public.hbl_dashboard_admins` hält Admin- bzw. Owner-Rollen für gemeinsame Schulfunktionen; Owner darf Benutzerverwaltung via `hbl-admin-users` nutzen.
5. `public.hbl_chat_members` steuert den **separaten** Chat-Zugang.
6. Die Edge Function `hbl-admin-users` erzeugt unter anderem manuell zu verschickende `invite`- und `recovery`-Links. **Diese Links sind Zugangstokens** und gehören nicht in Repositories, Screenshots oder Logs.

Der Admin-Endpunkt muss Auth-JWT und Owner-Rolle selbst prüfen; der im Frontend sichtbare Button allein ist keine Autorisierung.

## Chatmodell (Datenbank und Realtime)

- `hbl_chat_messages`: Lehrerzimmer (`channel='lounge'`) und Direktnachrichten (`channel='direct'`, Sender/Empfänger).
- `hbl_chat_groups`: Gruppendaten (Name, Eigentümer, Erstellung).
- `hbl_chat_group_members`: Mitgliedschaften; Gruppenbesitzer verwaltet Zu-/Abgänge.
- `hbl_chat_group_messages`: Gruppennachrichten.
- `hbl_chat_reads`: Lesestatus/Ungelesen-Markierungen.
- `hbl_chat_members`: zugelassene Kolleginnen und Kollegen.
- `hbl_user_profiles`: Anzeigenamen.

PostgreSQL-RLS schützt den Datenzugriff. In der produktiven Datenbank wurden bei dieser Bestandsaufnahme private Hilfsfunktionen `hbl_private.chat_allowed`, `hbl_private.chat_target_allowed`, `hbl_private.group_member` und `hbl_private.group_owner` festgestellt. Diese müssen bei neuen RLS-Policies ausdrücklich betrachtet werden. RLS vor Deploy getrennt und mit Negativtests prüfen (fremdes Konto, gesperrtes Konto, entferntes Gruppenmitglied).

Realtime-Publikation (lesend verifiziert): `hbl_chat_messages`, `hbl_chat_group_messages` und `hbl_chat_groups`. Realtime ergänzt die Datenbank, ersetzt **niemals** RLS/Autorisierung.

**Fachregel für Gruppen:** Neuer Beitritt erlaubt Verlauf gemäß aktueller Mitgliedschaft; beim Entfernen endet der Zugriff auch auf bisherige Gruppennachrichten. Das muss von RLS erzwungen werden, nicht nur von ausgeblendeten UI-Elementen.

## Push und PWA

- `hbl_push_subscriptions`: Push-Endpunkte je Benutzer/Gerät.
- `hbl_chat_push_preferences`: Chat-Zeitfenster/Benachrichtigungspräferenzen.
- `hbl_chat_push_sent`, `hbl_push_sent`: serverseitige Duplikatkontrolle.
- `hbl_push_private_settings`: private Serverkonfiguration.
- `hbl-push-dispatch`: serverseitige Funktion für Unterrichts-/Aufsichtshinweise und Chatnachrichten; Zeitberechnung für Deutschland.
- `hbl-push-test`: separate Edge Function (v5.9.3). Prüft das Benutzer-JWT serverseitig sowie die Eigentümerschaft am registrierten Push-Endpunkt und sendet eine Testnachricht an genau dieses Gerät. Ein angenommener Web-Push-Versand beweist nicht die Anzeige auf dem Gerät. Quelle unter `supabase/functions/hbl-push-test/index.ts`.
- `sw.js`: Anzeige/Bearbeitung eingehender Push-Nachrichten.

Datenbank und Service Worker allein beweisen **keine** zuverlässige Push-Zustellung: Browser-Berechtigung, Gerätesupport, Abonnement, VAPID/Serversecrets, Cron-Aufruf und Timezone müssen gesondert geprüft werden. Besonders Android/iOS-PWA und Ruhezeiten testen.

## Beobachtete Supabase-Tabellen (18.11.2026, lesende Abfrage)

```text
hbl_dashboard_admins       hbl_dashboard_members
hbl_dashboard_snapshots    hbl_user_profiles
hbl_school_events          hbl_chat_members
hbl_chat_messages          hbl_chat_reads
hbl_chat_groups            hbl_chat_group_members
hbl_chat_group_messages    hbl_chat_push_preferences
hbl_chat_push_sent         hbl_push_subscriptions
hbl_push_sent              hbl_push_private_settings
```

Es sind **keine vollständigen SQL-Migrationsdateien** im aktuellen GitHub-Baum vorhanden. Für Codex gilt: Schema nicht aus dieser Übersicht erraten. Bei neuer Schemaarbeit erst exaktes Live-Schema **lesend** erfassen, anschließend Testprojekt, Migration und explizite Freigabe für Produktionsänderungen.

## Nicht verifiziert / technische Schulden

- Kein vollautomatischer E2E-Test von zwei Browsern/Konten, Gruppenzugriffen oder Push-Zustellung.
- Große `index.html`; enge globale Kopplung statt klarer Module.
- Kein reproduzierbares SQL-Migrations-Setup im Repository.
- Cache-Versionen sind auf mehrere Dateien verteilt; Regressionen auf Mobilgeräten möglich.
- Live-Nutzung mit realen Schuldaten ist weder durch diese Dokumentation noch durch syntaktische Checks freigegeben.

**Nächster Schritt:** `docs/CODEX_START.md` ausführen – zunächst ausschließlich lesender Audit.


## Persönliche Kurskennungen ab v5.9.10

`hbl-course-ids.js` stellt die Kursidentität unabhängig von Fach-/Klassenbezeichnung bereit. Stundenplaneinträge in `__timetableV1` (interne Version 2) tragen zusätzlich `courseId`. Bei Bestandsplänen werden bisherige Kennungen einmalig übernommen und gespeichert; Mitarbeitsschlüssel, Schüler-IDs und bestehende Deep-Links werden nicht umgeschrieben. Die Ergänzung läuft beim Laden im eigenen Snapshot und verwendet den vorhandenen revisionsgeschützten Speicherweg.

Der Blockeditor unterscheidet Kursbearbeitung und andere Belegung: Umbenennen aktualisiert Fach/Klasse aller Blöcke derselben Kennung; Raum und Wochenbelegung bleiben blockbezogen. Ein Kurswechsel verändert keine Kennung des bisherigen Kurses und überträgt keine Bewertungen. Entfernte bewertete Termine bleiben gemäß bestehender Archivlogik erhalten. Die automatische Terminplanung gleicht Kennungen direkt mit Stundenplaneinträgen ab.

JSON-Stundenpläne erhalten Kennungen. CSV enthält weiter die bisherigen sechs Spalten; eindeutige Bezeichnungen werden vorhandenen Kursen zugeordnet. Mehrdeutige Zuordnungen werden abgelehnt. Neue Kurse erhalten zufällige Kennungen. Diese persönlichen Kennungen begründen keine Schul-, Klassen- oder Zugriffsberechtigung.

Gezielte Tests: `tests/course-identity.test.mjs` (Übernahme, Umbenennen, A/B, Kurswechsel, Datenerhalt, Austausch und automatische Termine).


## Eigenständiger persönlicher Kursbestand ab v5.9.11

`hbl-courses.js` verwaltet `prepDone.__coursesV1 = {version:1,courses:{[courseId]:{subject,group,archived}}}` im bestehenden privaten Snapshot. Bestehende Stundenplan- und Mitarbeitskurse werden mit ihren IDs wiederholbar übernommen. Schüler, Termine, Bewertungen und Endnoten verbleiben unter `__participation.classes[courseId]`; keine zweite Schülerliste und kein Datenreset.

Die Kursliste ist jetzt die maßgebliche Quelle für Fach-/Klassenbezeichnung und Kursübersicht, unabhängig vom Stundenplan. Der Blockeditor wählt einen aktiven Kurs per Dropdown oder legt einen neuen an. Kurse werden unter „Meine Kurse“ umbenannt; alle zugehörigen Belegungen erhalten die neue Bezeichnung. Raum und A/B bleiben blockbezogen. Eine Änderung nur in A erhält die bestehende B-Belegung.

Archivieren ist nur ohne Stundenplanbelegungen möglich. Archivierte Kurse bleiben mit allen Daten gespeichert, sind wiederherstellbar und über bisherige Mitarbeitslinks erreichbar. Entfernen einer Belegung löscht keinen Kurs. Die vorhandene Terminarchivierung schützt bewertete Termine weiter.

Importierte Belegungen werden vorhandenen Kurskennungen zugeordnet; bei vorhandenen Kennungen bleibt die zentrale persönliche Kursbezeichnung maßgeblich. Ein ausdrücklich bestätigter Stundenplanimport mit archiviertem Kurs reaktiviert diesen. Der Stundenplanexport enthält nur Belegungen; eine vollständige persönliche Sicherung enthält auch den gesamten Kursbestand. Speichern und Konflikte verwenden weiterhin `savePrepFile`/`hbl_save_snapshot`; keine Backend- oder Rechteänderung.

Tests: `tests/course-catalog.test.mjs` ergänzt die Kursidentitätstests. Schulbereiche und zentrale Lehrerzuordnungen sind weiterhin nur Zielbild.
