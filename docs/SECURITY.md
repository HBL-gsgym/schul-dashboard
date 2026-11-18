# Sicherheits- und Datenschutzleitplanken

**Projektstatus:** Private Pilotinitiative, öffentliches GitHub-Repository, Stand 18.11.2026. Diese Datei dokumentiert Anforderungen und bekannte Grenzen; sie ist **keine Sicherheitszertifizierung** und keine Datenschutzfreigabe für den Unterrichtsbetrieb.

## Grundregel: nur synthetische Daten

Bis zur Freigabe durch Schulleitung, IT und Datenschutzverantwortliche:
- Keine echten Schülernamen, Noten, Mitarbeitsbewertungen, Klassenlisten, Krankheitsdaten oder sonstigen personenbezogenen Schuldaten.
- Keine echten vertraulichen Kollegiumsnachrichten in Chat-Gruppen oder Direktnachrichten.
- Nur frei erfundene Testkonten/Testinhalte verwenden, zu denen eine Berechtigung besteht.
- Screenshots, Beispiel-SQL und GitHub-Issues niemals mit produktiven personenbezogenen Daten füllen.

Auch Mitarbeiter-E-Mail-Adressen, Chatverläufe und Benutzernamen sind personenbezogene Daten. Der Pilot braucht vor realem schulischem Einsatz einen Verantwortlichen, klare Zwecke, Auftragsverarbeitung, Informationspflichten, Löschfristen und abgestimmte Berechtigungen.

## Öffentlicher Code und Geheimnisse

Das GitHub-Repository ist **public**. Niemals einchecken:
- Supabase `service_role`-, secret- oder andere privilegierte API-Keys
- VAPID private key, Cron-Authentifizierung, SMTP-Passwörter
- Zugangstokens, JWTs, Cookies, Auth-Session-Inhalte
- Einmalige Einladungs-/Recovery-Links
- Auth-Konfigurationsdateien mit Geheimnissen, vollständige Datenbankdumps, reale Nachrichten/Benutzerlisten

Im Frontend dürfen nur explizit für öffentliche Clients gedachte Schlüssel liegen (Supabase Publishable Key, VAPID **Public** Key). Privilegierte Aktionen erfolgen ausschließlich serverseitig. Edge-Function-Secrets in Supabase-Secrets/Umgebungsvariablen; öffentliches JavaScript darf sie nicht kennen.

`AGENTS.md` verlangt außerdem, dass Codex Secrets in Logs und PRs entfernt/zensiert.

## Rollen und Zugriff

Unterschiedliche Berechtigungen nicht miteinander vermischen:

| Mechanismus | Bedeutung |
| --- | --- |
| Supabase Auth | Eine Person besitzt eine gültige Session |
| `hbl_dashboard_members.enabled` | Erlaubnis für das persönliche Dashboard |
| `hbl_dashboard_admins` | Verwaltung des gemeinsamen Kalenders, Owner-Sonderrolle |
| `hbl_chat_members` | Gesonderte Freigabe für Lehrerzimmer und Chat |
| `hbl_chat_group_members` | Mitgliedschaft in einem bestimmten Gruppenchat |
| `hbl_user_profiles` | Sichtbarer Name, **keine** Autorisierungsquelle |

Frontend-Sichtbarkeit allein reicht nicht. Alle Datenbank-Reads und Writes müssen per RLS/gesichertem Backend beschränkt sein. Bei gesperrten Konten keine bloße UI-Sperrung; Zugriff auf Datensätze über Mitgliedschaft und RLS prüfen. Bereits ausgestellte Sitzungen können bis zur tatsächlichen serverseitigen Prüfung existieren.

## Besonders sicherheitskritische Vorgänge

**Admin-Edge-Function** `hbl-admin-users`:
- Jede Admin-Aktion muss eine gültige Session *serverseitig* und die Hauptadministratorrolle prüfen.
- Vor dem Rückgeben von `action_link` jede Besitzerfreigabe, Authentifizierung und Ziel-E-Mail prüfen.
- Einladungs- und Passwortwiederherstellungslinks sind **Bearer-Tokens**. Nur unmittelbar an den bestimmten Empfänger weitergeben. Nicht in Logs speichern oder in öffentlichen Tickets zitieren.
- Benutzer sperren/löschen nur nach expliziter administrativer Bestätigung; Datenfolgen und RLS-Policy beachten.

**Gruppenchats**:
- Mitgliedschaft muss serverseitig auf jedem Read/Insert geprüft werden.
- Nur berechtigte Gruppenverantwortliche dürfen Mitglieder hinzufügen/entfernen, Gruppe umbenennen oder löschen.
- Neue Mitglieder können im derzeitigen Modell frühere Gruppenbeiträge sehen. Dafür muss schulisch eine bewusste Entscheidung getroffen werden.
- Nach Gruppen-Ausschluss darf **auch der alte Verlauf** nicht mehr lesbar sein.
- Direkte Nachrichten ausschließlich für Sender und Empfänger, Lehrerzimmer ausschließlich für Chat-freigeschaltete Lehrkräfte.
- Kein unkontrolliertes HTML in Nachrichten rendern.

**PostgreSQL**:
- Alle öffentlich exponierten Tabellen mit RLS und passenden `GRANT`-/`POLICY`-Regeln.
- Private `SECURITY DEFINER`-Funktionen unter `hbl_private` existieren. Vor Änderungen Definition, `search_path`, Ausführungsrechte und RLS-Auswirkungen prüfen. Keine Freigabe für `PUBLIC` ohne begründete Notwendigkeit.
- DB-Änderungen nur als explizit reviewte, getestete Migration in einer separaten Testumgebung vorbereiten.
- Nicht ohne Freigabe in das bestehende Supabase-Projekt schreiben, auch nicht für „kurze“ Tests.

**Push**:
- Push-Endpunkte und Auth-Keys sind sensible Abonnementdaten; nicht in Logs veröffentlichen.
- Browser-Permission nur nach Nutzerinteraktion erfragen.
- Chat-Push-Vorschautexte können vertraulichen Inhalt auf Sperrbildschirmen sichtbar machen. Privacy-Default und Aktivierung bewusst prüfen.
- Chat-Zeitfenster, Wochentage und Zeitzone (Europe/Berlin, einschließlich Sommerzeit) testen.

## Empfohlener RLS-Negativtestkatalog (ausschließlich isoliert)

1. Nicht angemeldet: kein Zugriff auf private Snapshots, Chats oder Gruppen.
2. Registriert, aber nicht freigegeben: keine Datenzugriffe trotz gültiger Session.
3. Freigegebene Lehrkraft A: kein Zugriff auf privaten Snapshot der Lehrkraft B.
4. Chatmitglied A: kann nicht Direktnachrichten zwischen B und C lesen.
5. Nichtchatmitglied: kann keine Lehrerzimmer-Nachricht lesen oder schreiben.
6. Gruppenmitglied A: kann Gruppe und Nachrichten sehen; nicht Mitglied einer fremden Gruppe.
7. Entfernter Teilnehmer A: kann Gruppenverlauf nicht mehr abrufen (auch bei alten IDs).
8. Nicht-Eigentümer: kann Gruppe/Mitglieder nicht gegen die Regeln ändern.
9. Inhaber ohne Adminrolle: kann keinen fremden Nutzer einladen, freischalten oder löschen.
10. Einmalige Einladungs-/Recovery-Links: keine Weitergabe, Wiederverwendung oder persistente Protokollierung.

## Offene Prüfungen vor schulischem Rollout

- Datenschutzfolgeabschätzung/Schulfreigabe soweit erforderlich; Vertrag/Auftragsverarbeitung und Datenregionen klären.
- Transparente Benutzerverwaltung und Lösch-/Exportprozesse definieren.
- Backup-/Wiederherstellungsverfahren und administrativen Notfallzugang prüfen.
- Rate Limiting/Spam-/Missbrauchsgrenzen für Chat und Einladungen ergänzen.
- Zugriffsaudit, Supabase Auth-Sicherheit und MFA für Administrationskonten prüfen.
- Testumgebung und vollständige Migrationsdateien schaffen; danach unabhängige RLS-Sicherheitsprüfung.
- Browser-End-to-End-Tests und Push-Geräteversuche durchführen.

**Wichtig:** Die Existenz von RLS-Policies ist kein Beweis, dass alle Pfade sicher sind. Freigabe erst nach gezieltem positiven und negativen Test.
