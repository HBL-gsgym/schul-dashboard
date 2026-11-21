# HBL – verbindliche Versions-Roadmap

**Beschlossen am 21.11.2026.** Grundsatz: **zuerst individuell nutzbare Lehrerfunktionen**, danach schulinterne Zusammenarbeit, danach weitere schulische Nutzergruppen und **zuletzt mehrere Schulen**. Die Roadmap beschreibt fachliche Ziele und ist **keine Umsetzungserlaubnis**. Der tatsächliche Implementierungsstand kann bereits Teilfunktionen enthalten; vor einem Auftrag Code und Issues prüfen. Kleine Änderungen gemäß [AGENTS.md](../AGENTS.md) einzeln versionieren und im [CHANGELOG](../CHANGELOG.md) dokumentieren.

| Version | Schwerpunkt | Issue(s) | Abhängigkeiten / Abgrenzung |
| --- | --- | --- | --- |
| **v5.10.x** | Stabilität, Android/Browser, Push- und Account-Fehler | [#1](https://github.com/HBL-gsgym/schul-dashboard/issues/1), [#2](https://github.com/HBL-gsgym/schul-dashboard/issues/2), [#7](https://github.com/HBL-gsgym/schul-dashboard/issues/7) | Sicherheits- und Datenerhalt fortlaufend |
| **v6.0** | Zentrales **Benutzerkonto & Einstellungen**: Profil, Passwort, vier Push-Kategorien, Ruhezeiten, Design, individuelle Kacheln | [#8](https://github.com/HBL-gsgym/schul-dashboard/issues/8) | Unabhängig von Schul-/Gruppenmodell |
| **v7.0** | **Classmanagement**: Kursverwaltung, Schülerübersicht, Sitzplan, Mitarbeit, gewichtete Noten | [#6](https://github.com/HBL-gsgym/schul-dashboard/issues/6) | Bestehende Teilfunktionen bewahren; keine Schulzuordnung erforderlich |
| **v8.0** | **Persönlicher großer Kalender** mit Monats-/Wochen-/Tagesansicht, eigenen Terminen/Erinnerungen | [#9](https://github.com/HBL-gsgym/schul-dashboard/issues/9) | Schmalen Schuljahreskalender behalten, nur private Termine erstellen |
| **v9.0** | **Eigenständiger persönlicher Arbeitsbereich** ohne erforderliche Schulmitgliedschaft | [#12](https://github.com/HBL-gsgym/schul-dashboard/issues/12) | Verlässliche private Datenspeicherung, Auth-/Datenschutzkonzept |
| **v10.0** | **Schulinterne Organisation**: eine Schule, bestätigte Zugehörigkeit, Fachgruppen, Gremien, Rollen | [#13](https://github.com/HBL-gsgym/schul-dashboard/issues/13) | Persönliche Daten bleiben privat, kein Mehrschulbetrieb |
| **v11.0** | **Gemeinsamer Schul-/Gruppenkalender**, Zielgruppen, Berechtigungen und offizielle Ausfallrechte | [#15](https://github.com/HBL-gsgym/schul-dashboard/issues/15) | Erweitert v8.0 und benötigt v10.0; keine zweite Kalender-App |
| **v12.0** | **Mitteilungen** mit schul-/gruppenspezifischer Sichtbarkeit und vierter Push-Kategorie | [#10](https://github.com/HBL-gsgym/schul-dashboard/issues/10) | Nutzt dieselben v10.0-Zielgruppen wie v11.0 |
| **v15.0** | **Weitere Schulmitarbeitende**: Sekretariat, Schulsozialarbeit, Hausmeister und weitere Rollen | [#17](https://github.com/HBL-gsgym/schul-dashboard/issues/17) | Eigene Rollen, keine automatische „Alle Lehrer“-Mitgliedschaft |
| **v20.0** | **Schüler-Integration**: Konten, eigene Ansichten, bestätigte Klassen-/Kurszuordnung, sichere Klassenkommunikation | [#16](https://github.com/HBL-gsgym/schul-dashboard/issues/16) | Minderjährigen-/Datenschutzkonzept und schulische Freigaben zwingend |
| **v25.0** | **Schulübergreifende Plattform**: mehrere Schulen, globale Administration, explizite interschulische Gruppen | [#14](https://github.com/HBL-gsgym/schul-dashboard/issues/14) | Erst nach den eigenständigen persönlichen und schulinternen Funktionen |

## Verbindliche Leitplanken

- **Ausbau in dieser Reihenfolge**, sofern der Projektverantwortliche ihn nicht später ausdrücklich anders beschließt.
- **v8.0 vs. v11.0:** Ein großer persönlicher Kalender kommt früh; die schulischen Zielgruppen und amtlichen Unterrichtsausfälle später. Bestehender schmaler Schuljahreskalender bleibt.
- **v6.0 vs. v10.0:** Eigene Konto-/Push-/Darstellungseinstellungen dürfen nicht an Schulfunktionen gekoppelt werden; Administratorrollen und Schulzuordnung folgen getrennt.
- **v12.0 vs. v20.0:** Schulische Mitteilungen können bereits an Lehrkräfte/Gremien gehen. **Schüler erhalten erst in v20.0 tatsächliche Konten und Zustellung.** Zielgruppe „Alle Schüler“ erfordert eigens autorisierte Veröffentlichung.
- **v15.0:** Sekretariat, Schulsozialarbeit und anderes Personal erhalten eigene bestätigte Rechte; nicht automatisch als Lehrkräfte behandeln.
- **v25.0:** Schule-übergreifende Kontakte und Administration sind keine Voraussetzung für individuelle oder schulinterne Nutzbarkeit.
- **Bestand bewahren:** Auth-IDs, Gruppenrechte, persönliche Daten und Speicherstände schützen; keine echten Schülerdaten im öffentlichen GitHub oder Pilotbetrieb.
- **Codex-Aufträge:** GitHub-Issues sind Konzepte/Backlog, nicht automatische Startfreigaben. Bei jeder Entwicklungsänderung App-Version + Changelog + PWA-Cache in demselben Commit gemäß AGENTS.md erhöhen.
