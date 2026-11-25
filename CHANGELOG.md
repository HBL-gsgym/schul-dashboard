## v9.0.0 – 25.11.2026 · Codex

Privater Kalender mit Monats-, Wochen- und Tagesansicht, Termin- und Serienverwaltung, Ferienausnahmen, A/B-Wochen und Erinnerungszeiten zur Vorbereitung von v9.1. Separate Supabase-Speicherung mit Zugriffsschutz pro Konto und Revisionsprüfung. Offline sind zuvor geladene Termine lesbar. Geräteabnahme und Push-Zustellung sind offen.

## v8.1.0 – 25.11.2026 · Codex

Gemeinsamer Hero mit A/B-Woche, Uhrzeit, Datum und KW. Auf breiten Ansichten stehen die Wocheninfos neben dem Titelbereich, im Smartphone-Querformat platzsparend darunter. Der schwebende Schnellzugriff weicht dem Hero aus. Der Schuljahreskalender scrollt nur sein Wochenraster horizontal und beginnt bei Bedarf an der aktuellen Woche. Überschrift, Legende und Ferieninfos bleiben in der Kachel. Geprüft mit automatisierten Tests und Chrome auf Desktop, Smartphone- und Tablet-Größen. Echte Geräteabnahme offen.

## v8.0.18 – 25.11.2026 · Codex

Vier freistehende Kacheln für Browser, Apple-Touch-Icon und Ladebildschirm. Kreis, Bogen und Stern entfernt. Android-Maskable-Icon mit neutraler Systemfläche und sicheren Abständen. Prüfstand: automatisierte Tests, Release-Paket, Browser- und Icon-Pixelprüfung. Homescreen-Darstellung auf echten Geräten offen.

## v8.0.17 – 25.11.2026 · Codex

Gewähltes rundes Icon unverändert aus der SVG-Vorlage in alle PNG-Größen übernommen, mit transparenten Ecken und eigener undurchsichtiger Android-Maske innerhalb der sicheren Kreisfläche. App-Start zeigt dasselbe Icon und prüft Sitzung, Freigabe und Daten vor dem Öffnen; kein vorzeitiges Login. Verbindungsfehler/15-Sekunden-Zeitlimit mit Wiederholen, verspätete Antworten verworfen, reduzierte Bewegung berücksichtigt. Prüfstand: 120 Tests, Release-Paketprüfung, Browser-Starttests und Icon-Pixelprüfung; echte Android-/iPad-Launcher-Abnahme offen. Endgültige Homescreen-Maske und Symbol-Cache bleiben Betriebssystemvorgaben.

## v8.0.15 – 25.11.2026 · ChatGPT

Neues App-Symbol (gewählter Vorschlag 3): vier farbige Kacheln für Bildung, Kalender, Aufgaben und Kollegium ohne HBL-Schriftzug. Eigene PNG-Icons für PWA (192/512), maskierbares Android-Icon (512), Apple-Startbildschirm (180) und Browser-Favicon (48), dazu gleich gestaltetes SVG. Manifest, HTML-Icon-Links, Service-Worker-Cache und öffentliche Release-Whitelist aktualisiert. Automatische Größen-/Releaseprüfung ergänzt; echte Gerätetests sowie Aktualisierung bereits installierter Homescreen-Symbole offen.

## v8.0.14 – 23.11.2026 · Codex

Veröffentlichungsblockade behoben: Navigationstest misst den nutzbaren Viewport ohne Scrollleiste und liefert konkrete Geometriedaten bei Fehlern. Vier Desktop-Positionen, Klappzustand, Beschriftungen, feste Position beim Scrollen und Wiederherstellung geprüft. Kompakter App-Schnellzugriff ohne Minimierbutton: Touch-Verschieben, Positionsspeicherung, Sync-Ampel und Einstellungen geprüft. Bestehende Anwendungslogik unverändert. Prüfstand: 116 Tests, Release-Pakettests und Chrome-Interaktionstests auf Desktop, Smartphone-/Tablet-Emulation; echte Gerätetests offen.

## v8.0.11 – 23.11.2026 · Codex

Sync-Ampel in der Desktop-Navigation und den App-Schnellzugriffen: Grün bestätigt, Gelb ausstehend/offline, Rot bei Fehlern oder Konflikten. Symbol, Text und direkter Zugang zum Speicherstatus; Ersatzanzeige in Ansichten ohne sichtbare Navigation. Geprüft: 116 Tests und Browserinteraktionen für Statuswechsel, Konflikt, Wiederaufnahme und Navigation auf Desktop, Smartphone und Tablet-Emulation. Echte Gerätetests offen.

## v8.0.10 – 23.11.2026 · Codex

Sichtbarer Speicherstand mit direktem Zugang zur Synchronisierung. Sichere Wiederholungsversuche nach Verbindungsfehlern; neuere Cloud-Stände werden nicht überschrieben. Kein falscher Erfolgsstatus bei ausstehenden Änderungen, lokale Sicherungsfehler werden angezeigt. Geprüft: 115 Tests sowie Desktop- und mobile Browserinteraktionen mit synthetischen Daten. Wiederherstellung gemeldeter WAT-9a-Eingaben und echte Gerätetests offen.

## v8.0.9 – 22.11.2026 · Codex

Zugang nur mit angemeldetem, freigeschaltetem Konto. Kompakte gemeinsame Kursköpfe in der obersten Inhaltskachel. Neue Konten starten ohne Beispielkurse; vorhandene Kursnamen bleiben erhalten. Manuelle Kursanlage bleibt verfügbar.

## v8.0.8 – 22.11.2026 · Codex

Einheitliche Inhaltsebene über der Hintergrunddekoration. Ansichtsabhängige Skalierung und Deckkraft entfernt. Echte iPad-Abnahme offen.

## v8.0.5 – 22.11.2026 · Codex

Updateprüfung alle 30 Sekunden bei sichtbarer App, unmittelbar beim Wiederöffnen und bei Service-Worker-Wechsel. Versionsabfrage unabhängig von der Service-Worker-Registrierung. Echte iPad-Abnahme offen.

## v8.0.4 – 22.11.2026 · Codex

Hintergrunddekoration auf eigener nichtnegativer Ebene; stärkere Geometrie und Blasen innerhalb des sichtbaren Bereichs. iPad-Sichtprüfung weiterhin offen.

## v8.0.3 – 22.11.2026 · Codex

Glass-Blasen über dem Fachhintergrund sichtbar machen: getrennte Ebenen, stärkere Lichtkanten und weiter innen platzierte Blasen. Echte iPad-Abnahme offen.

## v8.0.2 – 22.11.2026 · Codex

Organische Landschaftsformen, geometrische Linien und gläserne Blasen geben jeder Designwelt eine eigene Hintergrundgestaltung. Bestehende Fachmotive werden weiter berücksichtigt.

## v8.0.1 – 22.11.2026 · Codex

Plattformerkennung für Desktop und App; eigenständige Formen, Typografie, Oberflächen und Bedienelemente für Organic, Professional und Glass. Browserregression und Release-Prüfung; echte Geräte offen.

# Öffentliche Versionshinweise

## v8.0.0

Unter Einstellungen → Design lassen sich Farbwelt und Desktop-Menüposition wählen. Über Menü lässt sich die Navigation auf Symbole reduzieren.

## v7.6.2

Kacheln lassen sich unten rechts in der Größe anpassen. Die Größe wird im persönlichen Layout gespeichert.

## v7.6.1

Dashboard-Kacheln am Griff ziehen oder mit den Pfeiltasten umordnen. Beim Ziehen zeigt ein Platzhalter die Zielposition.

## v7.5.3

Das Leistungsprofil lässt sich über die Schülerliste und am Sitzplatz öffnen. Beim Wechsel ins Notenbuch oder zur Mitarbeit schließt sich der Dialog.
