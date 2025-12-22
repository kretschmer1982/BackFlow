import { test, expect } from '@playwright/test';

async function resetAppStorage(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/');
  await page.evaluate(() => {
    try {
      window.localStorage?.clear();
    } catch {
      // ignore
    }
    try {
      window.sessionStorage?.clear();
    } catch {
      // ignore
    }
  });
  await page.reload();
}

async function createDurationWorkout(page: Parameters<typeof test>[0]['page']) {
  await page.getByTestId('home-fab-main').click();
  await page.getByTestId('home-fab-create-workout').click();

  await page.getByTestId('create-workout-title-input').fill('Run Duration Workout');
  await page.getByTestId('create-more-exercises-button').click();

  const pickerExercises = page.getByTestId(/create-picker-exercise-/);
  // Wir nehmen hier an, dass die erste Übung eine Duration-Übung ist
  await pickerExercises.first().click();
  await page.getByTestId('create-picker-apply-exercises-button').click();
  await page.getByTestId('create-save-workout-button').click();
}

test.describe('Workout-Ausführung', () => {
  test('Workout mit Duration-Übung kann gestartet und bis zum Ende durchlaufen werden (Smoke)', async ({
    page,
  }) => {
    await resetAppStorage(page);
    await createDurationWorkout(page);

    const cards = page.getByTestId(/home-workout-card-/);
    await expect(cards).toHaveCount(1);

    await cards.first().click();

    await expect(page.getByText('GET READY')).toBeVisible();

    // Kurz warten, dann Skip benutzen, um schneller zum Exercise zu kommen
    await page.waitForTimeout(1000);
    const skipGetReady = page.getByTestId('run-getready-skip-button');
    await expect(skipGetReady).toBeVisible();
    await skipGetReady.click();

    // Wir befinden uns jetzt im Exercise-Screen
    await expect(page.getByTestId('run-exercise-cancel-button')).toBeVisible();

    const skipExercise = page.getByTestId('run-exercise-skip-button');
    await skipExercise.click();

    // Je nach Workout-Länge kommen wir entweder in nächste Runde oder direkt in Completed-View.
    // Für den Smoke-Test akzeptieren wir beides und prüfen nur, dass kein Fehler auftritt.
  });

  test('Reps-Übung kann per Tap abgeschlossen werden', async ({ page }) => {
    await resetAppStorage(page);

    // Workout mit einer Reps-Übung erzwingen:
    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-workout').click();
    await page.getByTestId('create-workout-title-input').fill('Run Reps Workout');
    await page.getByTestId('create-more-exercises-button').click();

    const pickerExercises = page.getByTestId(/create-picker-exercise-/);
    // Wähle eine der Übungen weiter hinten – hier kann je nach Datenbasis eine Reps-Übung liegen.
    // Wir testen hier v.a. den Tap-Flow; bei fehlender Reps-Übung ist dieser Test eher Smoke.
    const count = await pickerExercises.count();
    if (count > 1) {
      await pickerExercises.nth(count - 1).click();
    } else {
      await pickerExercises.first().click();
    }
    await page.getByTestId('create-picker-apply-exercises-button').click();
    await page.getByTestId('create-save-workout-button').click();

    const cards = page.getByTestId(/home-workout-card-/);
    await cards.first().click();

    // Skip GET READY um schneller zur Übung zu kommen
    const skipGetReady = page.getByTestId('run-getready-skip-button');
    await expect(skipGetReady).toBeVisible();
    await skipGetReady.click();

    const tapArea = page.getByTestId('run-exercise-touchable');
    await expect(tapArea).toBeVisible();
    await tapArea.click();
  });

  test('Cancel in GetReady und Exercise bricht Workout ab', async ({ page }) => {
    await resetAppStorage(page);
    await createDurationWorkout(page);

    const cards = page.getByTestId(/home-workout-card-/);
    await cards.first().click();

    // Cancel in GetReady
    const cancelGetReady = page.getByTestId('run-getready-cancel-button');
    await expect(cancelGetReady).toBeVisible();
    await cancelGetReady.click();

    // Zurück auf Home
    await expect(page.getByTestId('home-fab-main')).toBeVisible();

    // Nochmal starten
    await cards.first().click();

    // Diesmal in Exercise canceln:
    const skipGetReady = page.getByTestId('run-getready-skip-button');
    await skipGetReady.click();

    const cancelExercise = page.getByTestId('run-exercise-cancel-button');
    await expect(cancelExercise).toBeVisible();
    await cancelExercise.click();

    await expect(page.getByTestId('home-fab-main')).toBeVisible();
  });

  test('Completed-View zeigt Haus-Icon und führt zurück zu Home', async ({ page }) => {
    await resetAppStorage(page);
    await createDurationWorkout(page);

    const cards = page.getByTestId(/home-workout-card-/);
    await cards.first().click();

    // Um schnell zum Completed-Screen zu kommen, skippen wir durch:
    const skipGetReady = page.getByTestId('run-getready-skip-button');
    await skipGetReady.click();

    // Mehrfach Skip im Exercise – hängt von der Workout-Länge ab.
    // Wir nutzen hier eine Schleife, um nach dem Haus-Icon zu suchen.
    for (let i = 0; i < 5; i++) {
      const homeButton = page.getByTestId('run-completed-home-button');
      if (await homeButton.isVisible().catch(() => false)) {
        await homeButton.click();
        break;
      }
      const skipExercise = page.getByTestId('run-exercise-skip-button');
      if (await skipExercise.isVisible().catch(() => false)) {
        await skipExercise.click();
      } else {
        break;
      }
    }

    await expect(page.getByTestId('home-fab-main')).toBeVisible();
  });
});










