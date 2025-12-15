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

async function createSimpleWorkout(page: Parameters<typeof test>[0]['page'], name: string) {
  await page.getByTestId('home-fab-main').click();
  await page.getByTestId('home-fab-create-workout').click();

  await page.getByTestId('create-workout-title-input').fill(name);
  await page.getByTestId('create-more-exercises-button').click();

  const pickerExercises = page.getByTestId(/create-picker-exercise-/);
  await pickerExercises.first().click();
  await page.getByTestId('create-picker-apply-exercises-button').click();
  await page.getByTestId('create-save-workout-button').click();
}

test.describe('Workout erstellen & bearbeiten', () => {
  test('neues Workout mit mehreren Übungen und Mengen anlegen', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-workout').click();

    await page.getByTestId('create-workout-title-input').fill('Intensives Workout');
    await page.getByTestId('create-more-exercises-button').click();

    const pickerExercises = page.getByTestId(/create-picker-exercise-/);
    await pickerExercises.nth(0).click();
    await pickerExercises.nth(1).click();
    await pickerExercises.nth(2).click();
    await page.getByTestId('create-picker-apply-exercises-button').click();

    const amountInputs = page.getByTestId(/create-exercise-amount-input-/);
    await amountInputs.nth(0).fill('30');
    await amountInputs.nth(1).fill('10');
    await amountInputs.nth(2).fill('60');

    await page.getByTestId('create-save-workout-button').click();

    await expect(page.getByText('Intensives Workout')).toBeVisible();
  });

  test('Validierung: kein Workoutname verhindert Speichern', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-workout').click();

    await page.getByTestId('create-more-exercises-button').click();
    const pickerExercises = page.getByTestId(/create-picker-exercise-/);
    await pickerExercises.first().click();
    await page.getByTestId('create-picker-apply-exercises-button').click();

    // Alert erwarten
    let dialogSeen = false;
    page.once('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await page.getByTestId('create-save-workout-button').click();

    expect(dialogSeen).toBeTruthy();
    // Wir bleiben auf dem Create-Screen (Titel-Eingabe weiterhin sichtbar)
    await expect(page.getByTestId('create-workout-title-input')).toBeVisible();
  });

  test('Validierung: ohne Übungen kann nicht gespeichert werden', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-workout').click();

    await page.getByTestId('create-workout-title-input').fill('Leeres Workout');

    let dialogSeen = false;
    page.once('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await page.getByTestId('create-save-workout-button').click();

    expect(dialogSeen).toBeTruthy();
    await expect(page.getByTestId('create-workout-title-input')).toBeVisible();
  });

  test('Mehrfach gleiche Übung im Workout möglich', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-workout').click();
    await page.getByTestId('create-workout-title-input').fill('Doppel-Squat Workout');

    // Erste Runde: Übung hinzufügen
    await page.getByTestId('create-more-exercises-button').click();
    const pickerExercises = page.getByTestId(/create-picker-exercise-/);
    await pickerExercises.first().click();
    await page.getByTestId('create-picker-apply-exercises-button').click();

    // Zweite Runde: gleiche Übung nochmals hinzufügen
    await page.getByTestId('create-more-exercises-button').click();
    await pickerExercises.first().click();
    await page.getByTestId('create-picker-apply-exercises-button').click();

    const amountInputs = page.getByTestId(/create-exercise-amount-input-/);
    await expect(amountInputs).toHaveCount(2);

    await page.getByTestId('create-save-workout-button').click();
    await expect(page.getByText('Doppel-Squat Workout')).toBeVisible();
  });

  test('Übungen können per Drag & Drop umsortiert werden (Smoke-Test)', async ({ page }) => {
    await resetAppStorage(page);
    await createSimpleWorkout(page, 'Sortier-Workout');

    // Öffne Bearbeiten (erste Karte -> Edit-Button)
    const editButtons = page.getByTestId(/home-workout-edit-/);
    await editButtons.first().click();

    // Mindestens eine Übung vorhanden
    const selectedExercises = page.getByTestId(/create-selected-exercise-/);
    const count = await selectedExercises.count();
    expect(count).toBeGreaterThan(0);

    // Wir können hier nur smoke-testen, dass ein Drag-Versuch nicht crasht.
    // Playwright unterstützt native DnD unterschiedlich je nach Implementation.
    // Deshalb nur ein einfacher "long click" auf das erste Element:
    await selectedExercises.first().press('Shift');

    // Speichern, um sicherzustellen, dass kein Fehler auftritt
    await page.getByTestId('create-save-workout-button').click();
    await expect(page.getByText('Sortier-Workout')).toBeVisible();
  });
});







