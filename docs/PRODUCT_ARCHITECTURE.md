# HBL: persönlicher Arbeitsplatz und Schulportal

**Entscheidungsstand: 20.11.2026 · Ausgangscode v5.9.10.**

Dieser Plan hält die vom Projektverantwortlichen gewählte Richtung fest. Beauftragt sind Ausarbeitung und Dokumentation, noch keine Implementierung, Migration, Registrierung, Zahlungsabwicklung oder Einführung von Schülerkonten. Die Roadmap bleibt Orientierung; jede Etappe benötigt ihren eigenen Umsetzungsauftrag.

## Gemeinsamer Kern, zwei Nutzungsarten

HBL wird als eine Anwendung mit gemeinsamem Fachmodell weiterentwickelt:

| | Persönliche Nutzung | Schulbetrieb |
| --- | --- | --- |
| Einstieg | Lehrkraft nutzt ihren eigenen Arbeitsbereich | Schule richtet einen geschützten Schulbereich ein |
| Klassen und Kurse | Manuell durch die Lehrkraft verwaltet | Durch berechtigte Schulverantwortliche verwaltet und zugewiesen |
| Stundenplan | Manuelle Belegung eigener Kurse | Zunächst ebenfalls manuell, später optionaler Import |
| Organisation | Eigene Aufgaben, Vorbereitung, Mitarbeit, Sitzpläne und Noten | Zusätzlich gemeinsame Gruppen, Kalender und Mitteilungen |
| Konten | Persönliches Konto | Dasselbe Konto mit bestätigter Schulmitgliedschaft |

Untis/WebUntis-Anbindung wird zurückgestellt. Kein verpflichtender zentraler Stundenplan, keine zweite App und keine automatische Umstellung vorhandener persönlicher Daten auf Schulbetrieb. Ein späterer eigenständiger Einstieg ist Zielbild; die aktuelle Einladungsanmeldung bleibt zunächst bestehen.

**Produktprinzip:** Gemeinsame Struktur unterstützt den Alltag. Persönliche Werkzeuge, Notizen, Bewertungsorganisation und Dashboard-Anordnung bleiben anpassbar. Die Zugehörigkeit zu einer Schule ist keine Voraussetzung für die persönliche Nutzung.

## Fachliche Struktur

| Begriff | Bedeutung und Beziehungen |
| --- | --- |
| Konto | Dauerhafte Anmeldeidentität. Bestehende Benutzer-IDs und Zugänge erhalten. |
| Arbeitsbereich | Persönlicher Bereich einer Lehrkraft oder gemeinsamer Schulbereich. Jedes Objekt hat einen eindeutigen Bereich. |
| Schuljahr | Zeitlicher Rahmen für Klassen, Kurse und Unterrichtszuordnungen; in beiden Nutzungsarten möglich. Ein Jahreswechsel löscht keine bisherigen Daten. |
| Klasse | Stammgruppe wie „9a“. Ihre Schülerliste kann Grundlage mehrerer Fachkurse sein. |
| Kurs / Lerngruppe | Unterrichtsgruppe wie „Mathematik 9a“ oder „Physik GK 12“. Hat eine dauerhafte ID und kann unabhängig von einer Klasse bestehen. Klassenübergreifende Kurse müssen möglich bleiben. |
| Schülerdatensatz | Stabile Identität innerhalb des jeweiligen Bereichs, mit Klassen-/Kursmitgliedschaften. Zunächst ein Datensatz ohne Login; nicht mit einem Supabase-Auth-Konto verwechseln. |
| Lehrerzuordnung | Verbindet eine Lehrkraft mit einem Schulkurs, Zeitraum und erlaubten Aufgaben. Mehrere Lehrkräfte je Kurs sind später möglich. |
| Unterrichtsbelegung | Verweist auf einen Kurs sowie Tag, Block, A/B-Woche und Raum. Ein Kurs kann ohne Stundenplaneintrag bestehen. |
| Persönliche Kursarbeit | Mitarbeit, Notizen, Vorbereitung und spätere Noten-/Sitzplandaten mit ausdrücklicher Eigentümerschaft und Sichtbarkeit. Eine zentrale Kurszuordnung macht sie nicht automatisch schulweit sichtbar. |

Im nächsten kleinen Schritt genügt eine persönliche Kursliste. Schulbereiche, gemeinsame Schülerverzeichnisse und Lehrerzuordnungen werden erst in ihrer eigenen Etappe umgesetzt. Bis dahin bleibt die bestehende Schülerliste pro persönlichem Kurs maßgeblich; keine zweite Liste parallel anlegen.

## Identität, Übergänge und Berechtigungen

- Persönliche und schulische Kurse sind getrennte Objekte. Gleiche Namen oder dieselbe Schule erzeugen keine automatische Verknüpfung oder Zusammenführung.
- Ein späterer Übergang erfolgt durch bewusste Zuordnung mit Vorschau: welcher persönliche Kurs wird mit welchem offiziellen Kurs verbunden, welche Daten bleiben privat, welche werden ausdrücklich übernommen? Bestehende persönliche IDs und Links bleiben über eine Zuordnung erhalten.
- Keine Schülerzusammenführung allein nach Namen. Ein bestätigter Abgleich und der Umgang mit Konflikten gehören zum späteren Übernahmeprozess.
- Ein Konto kann seinen persönlichen Bereich behalten und Mitglied mehrerer Schulen sein. Der aktive Bereich muss sichtbar sein; Schulwechsel verschiebt keine Daten automatisch.
- Schulmitgliedschaften und schulbezogene Rechte werden serverseitig geprüft. Schuladmin, Schulleitung und Lehrkraft sind zu unterscheidende Zuständigkeiten; bestehender globaler Owner/Admin wird nicht automatisch zum Admin aller künftigen Schulen.
- Ein Schuladmin darf nicht allein aufgrund seiner Verwaltungsrolle alle persönlichen Notizen oder Bewertungen lesen. Gemeinsame Bewertungsfunktionen und deren Rechte benötigen eine eigene fachliche Entscheidung.
- Bei Rollenentzug oder Schulaustritt endet der schulische Zugriff. Private Daten dürfen dabei nicht pauschal gelöscht oder Schulinhalte ungefragt in den persönlichen Bereich kopiert werden. Aufbewahrung und Export schulischer Daten werden vor Einführung festgelegt.
- Chatgruppen sind Gesprächsgruppen. Sie ersetzen keine bestätigten Schul-, Klassen-, Fachschafts- oder Gremienmitgliedschaften und verleihen keine Kalender-/Mitteilungsrechte.

## Ist-Stand und technische Leitplanken

v5.9.10 besitzt persönliche Snapshots mit Revisionskonflikterkennung, Mitarbeit mit Schüler-IDs sowie eingefrorene Kurskennungen in Stundenplaneinträgen (`hbl-course-ids.js`). Kurse werden derzeit überwiegend aus dem Stundenplan abgeleitet. Eine eigenständige Kursverwaltung ist noch nicht vorhanden.

Die beim Strukturcheck gelesene Datenbank besitzt noch kein Schul-/Schuljahres-/Mandantenmodell. Die vorhandenen globalen Chat- und Kalenderfunktionen sind deshalb kein bereits getrenntes Schulportal.

Für die persönliche Kursliste zunächst den vorhandenen privaten Speicherweg nutzen. Ein kleines eigenes Kursmodul soll die Identität verwalten; keine weitere Namensableitung als Primärschlüssel und kein großer Umbau der gesamten `index.html`. Bei Einführung zentraler Schulobjekte werden dafür getrennte relationale Daten mit serverseitiger Bereichsprüfung benötigt. Persönliche Snapshots werden nicht zum gemeinsam beschriebenen Schulspeicher umfunktioniert.

Bestehende Konten, Profile, Rechte, Chats, Bewertungen, Schüler-IDs, Kurslinks und Kachel-Anordnungen erhalten. Kein Datenreset. Datenübernahmen wiederholbar und konfliktbewusst gestalten. Vor jeder Umsetzung den tatsächlichen Code- und bei Backend-Arbeit Datenbankstand erneut prüfen.

## Kleine Entwicklungsschritte

1. **Manuelle persönliche Kursverwaltung:** Kurse ohne Stundenplan anlegen, umbenennen und archivieren. Bestehende Kurse mit unveränderten IDs übernehmen. Im Blockeditor vorhandenen Kurs auswählen oder neu anlegen; Raum und A/B bleiben Belegungsmerkmale. Umbenennen wirkt auf dieselbe Kursidentität, Archivieren löscht keine Bewertungen. Kein Schulbackend und kein Abomodell in dieser Etappe.
2. **Classmanagement:** Gemeinsamen Zugriff auf die maßgebliche Schülerliste herstellen, dann Übersicht, Mitarbeit, Sitzplan und Noten in einzeln beauftragten Schritten ergänzen. Der Übergang zu einem späteren schulischen Schülerverzeichnis erhält eine ausdrückliche Zuordnung statt stiller Vermischung.
3. **Schulgrundlage als Meilenstein:** Schulen, Schuljahre, bestätigte Mitgliedschaften, Schulrollen, zentrale Klassen/Kurse und Lehrerzuordnungen entwerfen und nach gesonderter Freigabe einführen. Vorher Schema/RLS nachvollziehbar erfassen und Migrationen sowie Zugriffsprüfungen planen.
4. **Schulportal für Erwachsene:** Vorhandene Kommunikation auf Schulbereiche begrenzen; darauf offizielle Zielgruppen, Kalender und Mitteilungen aufbauen. Getrennte Schulen müssen auch über direkte API-Zugriffe getrennt bleiben.
5. **Weitere Beschäftigte und Schülerkonten:** Eigene Freigabe mit Rollen-, Sichtbarkeits-, Datenschutz- und Betriebsentscheidungen. Keine Berechtigung allein aus einer persönlichen Schülerliste ableiten.

Diese Reihenfolge konkretisiert [Classmanagement #6](https://github.com/HBL-gsgym/schul-dashboard/issues/6) und die Schulgrundlage v6.0. [Einstellungen #8](https://github.com/HBL-gsgym/schul-dashboard/issues/8), [Kalender #9](https://github.com/HBL-gsgym/schul-dashboard/issues/9) und [Mitteilungen #10](https://github.com/HBL-gsgym/schul-dashboard/issues/10) bleiben nachgelagerte, separat beauftragte Vorhaben. Versionsnummern werden bei Umsetzung festgelegt; diese Dokumentation erhöht die App-Version nicht.

## Abnahme des nächsten Umsetzungsschritts

- Ein neuer Kurs bleibt ohne Stundenplan nach Neuladen sichtbar; mehrere Belegungen verweisen auf dieselbe ID.
- Umbenennen, Archivieren und Wiederherstellen erhalten Schüler-IDs, Bewertungen und bisherige Links. Ein bewusst anderer Kurs übernimmt keine fremden Bewertungen.
- Bestehende Kurse werden ohne Duplikate übernommen; Stundenplan, A/B und automatische Mitarbeitstermine funktionieren weiter.
- Persönliche Daten bleiben kontogebunden. Vorhandene Konflikterkennung bleibt wirksam, auch bei ausstehenden lokalen Änderungen.
- Vorhandenes `npm test` und gezielte Tests der Kursübernahme sowie eine kurze Browserprüfung der Kursverwaltung. Keine vollständige Testkampagne für reine Oberflächenkorrekturen; bei späteren Schulrechten gezielte Mehrkonto- und Negativtests.

## Geschäftsmodell und offene Entscheidungen

**10 € pro Jahr** ist eine Preisidee für die persönliche Nutzung, keine beschlossene Preis- oder Leistungszusage. Schulzugang wird separat betrachtet. Vor Verkauf: Betrieb, Zahlungsgebühren, Support, Leistungsumfang und datenschutzrechtliche Voraussetzungen klären. Lizenzstatus, Schulmitgliedschaft und fachliche Zugriffsrechte getrennt modellieren; noch keine Zahlungsintegration.

Vor dem Schulmeilenstein offen: verbindliche Zuständigkeiten je Schulrolle, gemeinsame versus private Kursarbeit, Austritt/Aufbewahrung und Schuljahresübernahme. Diese Fragen blockieren die manuelle persönliche Kursverwaltung nicht. Bis zur entsprechenden Freigabe gilt weiterhin der dokumentierte Pilotbetrieb mit synthetischen Schülerdaten.
