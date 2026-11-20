# Einladungserneuerung – Issue #7

## Änderung

Die Benutzerliste trennt offene Einladung (`invited_at`, keine E-Mail-Bestätigung) und aktiviertes Konto (`email_confirmed_at`/`confirmed_at`). Der Profilname ist kein Aktivierungsnachweis. Offene Einladungen können über `renew_invite` erneuert werden; aktive Konten verwenden `recovery`.

Der Server prüft weiterhin zuerst JWT und Owner-Rolle. Erneuerung prüft zusätzlich die bestehende Auth-ID, Dashboardfreigabe, Auth-Sperre, Einladungsstatus sowie die ID und Weiterleitung im Ergebnis. Sie verändert keine Dashboard-/Chat-/Adminfreigaben. Der bisherige Invite-Upsert entfällt: vorhandene E-Mail-Adressen werden im Neuanlageformular abgewiesen; die Freigabe eines neuen Kontos erfolgt nur per Insert.

## Befund und Grenzen

Die produktive Admin-Function wurde am 20.11.2026 ausschließlich lesend geprüft (Version 5); ihr Einladungsablauf entspricht dem vorherigen Repository-Code. Es wurden keine Konten oder Tokens gelesen oder erzeugt. Der aktuelle öffentliche Supabase-Auth-Quellcode `internal/api/mail.go`, `adminGenerateLink`, erneuert bei `type=invite` für unbestätigte Konten das Bestätigungstoken bei gleicher ID; bestätigte Konten werden abgewiesen. Daher ist ein Wechsel auf einen anderen Linktyp nicht erforderlich. Das beweist nicht die Ursache des ursprünglich gemeldeten Einzelfalls.

Referenzen:
- https://supabase.com/docs/reference/javascript/auth-admin-generatelink
- https://github.com/supabase/auth/blob/master/internal/api/mail.go
- https://supabase.com/docs/guides/auth/auth-email-templates (Einmal-Link kann durch E-Mail-Vorschau/Scanner verbraucht werden)

Die Management-Auth-Konfiguration (Email OTP Expiration und Redirect-Allowlist) ist mit den verfügbaren Connector-Aktionen nicht abrufbar. Keine feste Dauer oder Ablaufzeit wird behauptet. Vor Produktionsfreigabe ausschließlich diese Konfigurationswerte kontrollieren, keine Secrets exportieren.

## Validierung

`npm test`: Offline-Mocks für neue Einladung, zwei Erneuerungsaufrufe, ID-/Rechteerhalt, aktive/gesperrte Konten, falsche ID/Weiterleitung und Rate-Limit. Diese Tests prüfen die Anwendungslogik, nicht die tatsächliche Token-Erzeugung oder Einlösung von Supabase.

Integrationstests wurden am 20.11.2026 im getrennten Projekt „HBL Einladungstest“ durchgeführt: neue Einladung, kontrollierter Ablauf, Erneuerung, tatsächliche Einlösung, unveränderte Auth-ID/Rechte, Wiederverwendung eines eingelösten Links, Recovery und Owner-/Nichtowner-Zugriff bestanden. Einzelheiten und verbleibende Grenzen: [Testumgebung](INVITATION_TEST_ENVIRONMENT.md). Produktive Redirect-Konfiguration, natürlicher Ablauf, Mailprogramm und zweiter Browser sind damit nicht verifiziert.

## Deployment

Am 20.11.2026 als v5.9.5 produktiv ausgerollt. Keine SQL-Migration erforderlich. Die Edge Function `hbl-admin-users` wurde mit **index.ts und invitation-links.js** gemeinsam deployed; JWT-/Owner-Prüfung bleibt erhalten. Das Frontend wird anschließend als v5.9.5 veröffentlicht. Die oben dokumentierten Integrationstests wurden in der getrennten Testinstanz durchgeführt. Rückfall: bisherige Function-Version und Frontendversion wiederherstellen; keine Konten zurücksetzen.
