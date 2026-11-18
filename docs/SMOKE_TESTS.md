# Manuelle Smoke-Tests (Pilotbetrieb)

**Stand:** 18.11.2026 · Ausgangsversion v5.9.3.

Diese Checkliste beschreibt **Testfälle**, keine bereits bestandenen Tests.

## Voraussetzungen

- Test nur mit frei erfundenen Konten und Nachrichten; keine realen Schüler- oder Kollegiumsdaten.
- Browser auf Desktop und Smartphone oder installierte PWA.
- Mindestens drei unterschiedliche **synthetische Testrollen** in einer ausdrücklich genehmigten **separaten Testumgebung**: Owner O, Lehrkraft A und Lehrkraft B. Für RLS-Negativtests zusätzlich Lehrkraft C ohne Gruppenmitgliedschaft.
- Kein Test darf die produktive Datenbank oder reale Konten zerstören. Vor Testdurchführung Zugriff und Testinstanz prüfen.
- Ereignis- und Mitarbeitstermine auf Demo-Daten beschränken.

| Bereich | Testschritt | Erwartung | Status |
| --- | --- | --- | --- |
| Basis | Dashboard Desktop laden, Konsole prüfen | Keine JS-Ladefehler, alle vorgesehenen Kacheln vorhanden | ☐ offen |
| Mobile | Dashboard auf schmalem Display öffnen | Bedienelemente erreichbar, keine ungewollte horizontale Überlagerung | ☐ offen |
| Themes | Hell-/Dunkelmodus wechseln | Lesbare Kontraste, Zustand konsistent | ☐ offen |
| Auth | Owner anmeldet/abmeldet | Session korrekt, private Daten nach Logout verborgen | ☐ offen |
| Einladung | Owner erstellt einmaligen Test-Einladungslink | Nur die beabsichtigte Testperson kann ihn verwenden | ☐ offen |
| Profil | Eingeladene Lehrkraft setzt Benutzername und Passwort | Beim ersten Einstieg verlangt, später nicht erneut | ☐ offen |
| Sperre | Owner sperrt Testkonto | Kein Zugriff auf Dashboard und Chatdaten | ☐ offen |
| Recovery | Owner erzeugt Test-Recovery-Link | Betroffener Testnutzer kann eigenes Passwort erneuern | ☐ offen |
| Stundenplan | A-/B-Wochen mit verschiedenen Kursen | Grüne/blaue Darstellung und richtige Unterrichtsblöcke | ☐ offen |
| Stundenplan | Import/Export mit Demo-Plan | Keine unerwarteten Änderungen an anderen Einträgen | ☐ offen |
| Kalender | Veranstaltung mit Ausfall eines Blocks eintragen | Betroffene Stunden und Planzahlen passend angepasst | ☐ offen |
| Mitarbeit | Bewerteten Eintrag anlegen, Plan verändern | Bewertung bleibt erhalten | ☐ offen |
| Lehrerzimmer | A sendet Nachricht, B ist online | Nachricht erscheint; ungelesen-Status korrekt | ☐ offen |
| Direktchat | A an B, C versucht fremden Verlauf zu lesen | A/B lesen; C erhält keinen Zugriff (RLS) | ☐ offen |
| Gruppe | A erstellt Gruppe mit B | A/B sehen Gruppe und können schreiben | ☐ offen |
| Gruppe | A fügt C hinzu | C sieht gemäß aktuellem Modell auch alten Verlauf | ☐ offen |
| Gruppe | A entfernt C | C hat keinen Zugriff mehr, auch nicht auf alte Nachrichten | ☐ offen |
| Gruppe | B versucht ohne Erlaubnis Mitglieder zu verändern | Änderung wird serverseitig verweigert | ☐ offen |
| Gruppe | Eigentümer benennt Gruppe um, löscht Demo-Gruppe | Oberfläche und Daten synchron | ☐ offen |
| Realtime | Zwei Testgeräte senden gleichzeitig | Keine doppelten/fehlenden Nachrichten, angemessene Reihenfolge | ☐ offen |
| Sync | A bearbeitet Demo-Daten auf zwei Geräten | Revisionskonflikt sichtbar statt stillem Datenverlust | ☐ offen |
| PWA | Browser/PWA mit neuem Cache neu öffnen | Aktuelle CSS/JS-Version ohne Altcode-Mischung | ☐ offen |
| Push | Push nach explizitem Opt-in, erlaubtem Zeitfenster | Zustellung nur innerhalb der gewünschten Zeit | ☐ offen |
| Push-Test v5.9.3 | Auf registriertem Testgerät aus dem Chat-Einstellungsdialog „Testbenachrichtigung senden“ auslösen | Nur das eigene Gerät kann adressiert werden; Serverannahme und tatsächlich angezeigte Systemmitteilung separat prüfen | ☐ offen |
| Push | Ruhezeit und Wochentag wechseln | Keine unerwünschte Chat-Push in Sperrzeit | ☐ offen |
| Push | Sperrbildschirm-Vorschautext deaktivieren | Keine vertrauliche Chatvorschau in Push | ☐ offen |

## Protokoll je Testdurchlauf

```text
Datum:
Commit / Version:
Testinstanz / Browser / OS:
Gerät:
Getestete Fälle:
Ergebnis je Fall (bestanden / fehlgeschlagen / nicht geprüft):
Fehlerbild und reproduzierbare Schritte:
DevTools-Fehler ohne Token-/Personendaten:
Bearbeitender PR / Issue:
```

**Keine echten Einladungslinks, Session-Tokens, Push-Endpunkte, Schülerdaten oder persönliche Chat-Nachrichten in Testprotokolle kopieren.**
