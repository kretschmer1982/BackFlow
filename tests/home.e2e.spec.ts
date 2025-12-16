import { test, expect } from '@playwright/test';

async function resetAppStorage(page: Parameters<typeof test>[0]['page']) {
  // Lädt die App einmal, leert dann Storage und lädt neu,
  // damit AsyncStorage/LocalStorage garantiert leer ist.
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

test.describe('Home / Workouts Übersicht', () => {
  test('zeigt Empty-State, wenn keine Workouts vorhanden sind', async ({ page }) => {
    await resetAppStorage(page);

    await expect(page.getByText('Noch keine Workouts')).toBeVisible();
    await expect(
      page.getByText('Erstelle dein erstes Workout mit dem + Button')
    ).toBeVisible();

    await expect(page.getByTestId('home-fab-main')).toBeVisible();
    await expect(page.getByTestId('home-settings-button')).toBeVisible();

    const workoutCards = page.getByTestId(/home-workout-card-/);
    await expect(workoutCards).toHaveCount(0);
  });

  test('FAB-Menü lässt sich öffnen und schließen', async ({ page }) => {
    await resetAppStorage(page);

    // Menü geschlossen
    await expect(page.getByTestId('home-fab-main')).toBeVisible();
    await expect(page.getByTestId('home-fab-create-workout')).toHaveCount(0);

    // Öffnen
    await page.getByTestId('home-fab-main').click();
    await expect(page.getByTestId('home-fab-create-workout')).toBeVisible();
    await expect(page.getByTestId('home-fab-create-exercise')).toBeVisible();

    // Schließen
    await page.getByTestId('home-fab-main').click();
    await expect(page.getByTestId('home-fab-create-workout')).toHaveCount(0);
    await expect(page.getByTestId('home-fab-create-exercise')).toHaveCount(0);
  });

  test('erstellte Workouts erscheinen in der Liste (Sortierung nach Erstellungszeit)', async ({
    page,
  }) => {
    await resetAppStorage(page);

    // Erstes Workout
    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-workout').click();

    await page.getByTestId('create-workout-title-input').fill('Workout A');
    await page.getByTestId('create-more-exercises-button').click();

    // Füge zwei beliebige Übungen hinzu
    const pickerExercises = page.getByTestId(/create-picker-exercise-/);
    await pickerExercises.nth(0).click();
    await pickerExercises.nth(1).click();
    await page.getByTestId('create-picker-apply-exercises-button').click();

    await page.getByTestId('create-save-workout-button').click();

    // Zweites Workout mit späterem Erstellungszeitpunkt
    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-workout').click();

    await page.getByTestId('create-workout-title-input').fill('Workout B');
    await page.getByTestId('create-more-exercises-button').click();

    await pickerExercises.nth(0).click();
    await page.getByTestId('create-picker-apply-exercises-button').click();
    await page.getByTestId('create-save-workout-button').click();

    // Zurück auf Home, es sollten zwei Workouts existieren
    const cards = page.getByTestId(/home-workout-card-/);
    await expect(cards).toHaveCount(2);

    // Prüfen, dass das neuere Workout B ganz oben steht
    await expect(cards.first().getByText('Workout B')).toBeVisible();
    await expect(cards.nth(1).getByText('Workout A')).toBeVisible();
  });

  test('Workout löschen mit Bestätigungsdialog', async ({ page }) => {
    await resetAppStorage(page);

    // Workout anlegen
    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-workout').click();
    await page.getByTestId('create-workout-title-input').fill('Zu löschendes Workout');
    await page.getByTestId('create-more-exercises-button').click();

    const pickerExercises = page.getByTestId(/create-picker-exercise-/);
    await pickerExercises.nth(0).click();
    await page.getByTestId('create-picker-apply-exercises-button').click();
    await page.getByTestId('create-save-workout-button').click();

    const deleteButtons = page.getByTestId(/home-workout-delete-/);
    await expect(deleteButtons).toHaveCount(1);

    // Erster Versuch: Abbrechen im Dialog
    page.once('dialog', async (dialog) => {
      await dialog.dismiss(); // "Abbrechen"
    });
    await deleteButtons.first().click();

    await expect(page.getByText('Zu löschendes Workout')).toBeVisible();

    // Zweiter Versuch: Bestätigen
    page.once('dialog', async (dialog) => {
      await dialog.accept(); // "Löschen"
    });
    await deleteButtons.first().click();

    await expect(page.getByText('Zu löschendes Workout')).toHaveCount(0);
  });
});








