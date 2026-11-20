# Getrennte Einladungstestumgebung

Stand: 20.11.2026. Ausschließlich synthetische Konten, keine Produktivdaten.

## Projekt

- Organisation: HBL Org, vorhandener Free-Tarif.
- Projekt: HBL Einladungstest (`tqggfifmcicahwbqanym`), Region eu-west-3.
- Dashboard: https://supabase.com/dashboard/project/tqggfifmcicahwbqanym
- Das bestehende Dashboard-Projekt `lmadidvmmwxcbytokoys` wurde nicht verändert.
- Eigenständiges Minimal-Schema für Einladungen, kein vollständiger Nachbau der produktiven Datenbank.

## Einrichtung

Fünf Tabellen: `hbl_dashboard_members`, `hbl_dashboard_admins`, `hbl_chat_members`, `hbl_user_profiles`, `hbl_invitation_test_runs`. RLS ist überall aktiv; Browserrollen besitzen keine Tabellenrechte. Nur der serverseitige Service-Zugriff ist für diese Fixture erlaubt. Der Security-Advisor meldet dazu lediglich fünf informative Hinweise „RLS enabled, no policy“: Dieser Zugriffsausschluss ist hier beabsichtigt. Daraus folgt keine Aussage über produktive RLS-Policies.

Die neue Admin-Function wurde nur hier deployed, einschließlich `invitation-links.js`. JWT und Owner werden wie im Produktcode innerhalb der Function geprüft. Einziger Konfigurationsunterschied: Test-Redirect `http://localhost:3000/`, passend zur neuen Testinstanz; keine Weiterleitung/Anmeldung am produktiven Dashboard während der Tests.

Ein einmalig aufrufbarer Test-Runner war mit einem zufälligen temporären Zugangsschutz und festem Projekt-ID-Abgleich abgesichert. Er verwendete serverseitige Zugangsdaten nur intern. Nach Testabschluss wurde er durch eine funktionslose 410-Antwort ersetzt und die Gateway-JWT-Prüfung aktiviert. Testlinks, Passwörter und Sitzungen wurden nicht in Berichte oder Repository übernommen. Die synthetischen Konten bleiben ausschließlich in dieser Testinstanz.

## Tatsächlich ausgeführter Integrationstest

Gespeicherter Lauf: `invitation-integration-4`, abgeschlossen. 17 Prüfpunkte erfolgreich:

1. Nicht angemeldeter Aufruf verweigert.
2. Angemeldeter Nicht-Owner verweigert.
3. Neue Einladung angelegt.
4. Kontrollierter Ablaufzustand vorbereitet.
5. Abgelaufene Einladung verweigert.
6. Erneuerung liefert dieselbe Auth-ID.
7. Erneuerter Link unterscheidet sich vom alten.
8. Dashboard-/Admin-/Chatfreigaben und Profil bleiben identisch.
9. Zweite Erneuerung verwendet weiterhin dieselbe Auth-ID.
10. Erneuerter Link aktiviert das ursprüngliche Konto und liefert eine gültige Sitzung.
11. Wiederverwendung des eingelösten Links verweigert.
12. Aktives Konto kann nicht erneut eingeladen werden.
13. Bestehende E-Mail kann nicht erneut über den Neuanlageablauf eingeladen werden.
14. Passwort-Recovery liefert dieselbe ID.
15. Recovery-Link lässt sich einlösen.
16. Gesperrtes Konto erhält keinen Recovery-Link.
17. Link-Aktion hebt die Sperre nicht auf.

Der Ablaufzustand wurde ausschließlich für synthetische Einladungen durch Rückdatieren von `confirmation_sent_at` sowie `auth.one_time_tokens.created_at/expires_at` in der Testdatenbank hergestellt. Es wurde nicht mehrere Stunden auf natürlichen Ablauf gewartet. Eine vorübergehende Test-Hilfsfunktion und zugehörige zusätzliche Spaltenrechte wurden anschließend entfernt. Die endgültige Ablaufvorbereitung erfolgte mit direktem SQL, weil der verwaltete Service-Role-Zugriff die Auth-Updates verweigerte.

## Grenzen und nächster Schritt

- Keine tatsächlichen E-Mails verschickt; Tests mit reservierten `example.com`-Adressen und direkter Supabase-OTP-Einlösung.
- Kein Browser-/Mailprogramm-/Scanner-Test und kein Nachweis der produktiven Redirect-Allowlist.
- Die tatsächliche produktive Email-OTP-Gültigkeit bleibt unverifiziert; keine feste Stundenzahl in der UI.
- Produktive Konten, Daten, Auth-Konfiguration und Functions unverändert.
- Für Veröffentlichung von v5.9.5 sind separate Freigabe, Deployment der Admin-Function mit beiden Dateien und anschließend Frontend-Veröffentlichung nötig.

Hinweis zum Advisor: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
