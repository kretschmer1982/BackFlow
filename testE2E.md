## Test‑IDs und Maestro‑Flows

### 1. Grundsatz
- Die App nutzt fest definierte `testID`s nach dem Muster
  `{screen}-{element}[-{index}]`. So bleiben die IDs überschaubar
  und können direkt in Maestro referenziert werden.
- Jeder Screen enthält einen kompakten Kommentar über der Komponenten-Zeile,
  die die ID bereitstellt („TestID: …“).

### 2. Wichtige TestIDs

| Screen | Element | TestID | Bemerkung |
|--------|---------|--------|-----------|
| Home | Workout-Card | `home-workout-card-<index>` | Index ist die Position in der Liste |
| Home | Workout-Name | `home-workout-name-<index>` | Ebenfalls index-basiert |
| Home | Workout-Count | `home-workout-count-<index>` |
| Home | FAB | `home-fab-main`, `home-fab-create-workout`, `home-fab-create-exercise` |
| Planner | Tagesreihe | `planner-row-{di,sa,...}` (nur sichtbare Seite) |
| Planner | Workout | `planner-workout-{di,sa}` (für einzelne Einträge) |
| Planner | Details | `planner-details-{di,sa}` |
| Create | Titel-Input | `create-title-input` |
| Create | Titel-Bestätigung | `create-title-confirm` |
| Create | Warmup-Karte | `create-warmup-card` |
| Create | Bibliotheks-Übung | `create-exercise-<index>` |
| Create | ausgewählte Übung | `create-selected-<index>` |
| Create | Mengenfeld | `create-amount-<index>` |
| Create | speichern | `create-save-button` |
| Settings | Demo-Workouts | `settings-demo-button` |
| Onboarding | Skip | `onboarding-skip` |
| Onboarding | Weiter | `onboarding-next` |

Viele IDs sind index-basiert, damit sie unabhängig vom Namen der Workout-Vorlage bleiben.

### 3. Maestro‑Flow schreiben
- Nutze die statischen IDs in den YAML-Dateien unter `.maestro/`.
- Beispiel (planner-routine-ids.yaml):
  ```yaml
  - assertVisible:
      id: "planner-workout-di"
  ```
- Assertions mit Text sind optional; die ID garantiert, dass das richtige Element
  gemeint ist.
- Beim Anwählen von Buttons mit Maestro kannst du dieselbe ID verwenden wie in den
  Komponenten (`tapOn` mit `id: "home-fab-main"`).

### 4. Tests erstellen

1. Seed Workouts per Deep Link (`backflow://debug/seed`), damit Planner & Home Daten
   erwarten.
2. Navigiere zur Zielseite (Home, Planner, Create …) per `tapOn` oder `deep link`.
3. Verifiziere Sichtbarkeit via `assertVisible` + `id`.
4. Optional: ergänze `text` für genaue Content-Prüfung (z. B. `text: "Starke Mitte"`).
5. Nutze `- swipe:` und `- tapOn:` für Interaktionen.

-### 5. Praxis
- Beziehe dich auf `.maestro/smoke-test.yaml`, `.maestro/planner-routine-ids.yaml`
  und `.maestro/workout-lifecycle.yaml` für konkrete Abläufe.
- Die Komponenten-Dateien (z. B. `app/(tabs)/planner.tsx`) zeigen, welche ID welcher
  UI-Komponente zugeordnet ist; dort stehen deutsche Kommentare direkt über dem
  Element.

### 6. Prebuilt Dev-Build nutzen
- Erzeuge dein Dev-Build (z. B. via EAS oder `expo run:android` mit eingebettetem JS) und kopiere es nach `builds/android/app-prebuilt-dev.apk`.
- Starte Maestro mit `.\scripts\run-maestro.ps1 -FlowPath .maestro/your-flow.yaml -prebuild`, dann wird diese APK installiert statt der Release/Debug-Variante. Fehler im Metro-Server werden dadurch vermieden.

Damit hast du ein nachvollziehbares, stabiles E2E-Konzept, das sich leicht erweitern lässt.

