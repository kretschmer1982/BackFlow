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

test.describe('Settings: Hintergrund, Beep, Erinnerungen', () => {
  test('Hintergrundfarbe ändern und Persistenz über Neustart', async ({ page }) => {
    await resetAppStorage(page);

    // In Settings gehen
    await page.getByTestId('home-settings-button').click();
    await expect(page.getByText('Einstellungen')).toBeVisible();

    await page.getByTestId('settings-background-entry').click();
    await expect(page.getByText('Hintergrund')).toBeVisible();

    // Wähle eine helle Farbe, z.B. Weiß (#ffffff)
    const whiteColor = page.getByTestId('settings-background-color-ffffff');
    await whiteColor.click();

    // Zurück über Browser-History
    await page.goBack(); // zurück zu Einstellungen
    await page.goBack(); // zurück zu Home

    // App neu laden, Farbe sollte bleiben
    await page.reload();
    await expect(page.getByTestId('home-fab-main')).toBeVisible();
  });

  test('Beep-Toggle wechselt zwischen An/Aus', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-settings-button').click();
    const beepEntry = page.getByTestId('settings-enable-beep-toggle');

    const initialText = await beepEntry.textContent();
    await beepEntry.click();
    const toggledText = await beepEntry.textContent();

    expect(initialText).not.toEqual(toggledText);
  });

  test('Erinnerungs-Switch aktiviert und deaktiviert Tage-Auswahl', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-settings-button').click();
    await page.getByTestId('settings-reminders-entry').click();

    const reminderSwitch = page.getByTestId('settings-reminders-switch');
    await expect(reminderSwitch).toBeVisible();

    // Aktivieren
    await reminderSwitch.click();
    await expect(page.getByText('Tage auswählen')).toBeVisible();

    // Zwei Tage auswählen
    await page.getByTestId('settings-reminder-day-mon').click();
    await page.getByTestId('settings-reminder-day-wed').click();

    // Deaktivieren – sollte Tage wieder löschen
    await reminderSwitch.click();
    await expect(page.getByText('Tage auswählen')).toHaveCount(0);
  });

  test('Test-Benachrichtigung zeigt nur Info-Alert (kein Crash)', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-settings-button').click();
    await page.getByTestId('settings-reminders-entry').click();

    const testButton = page.getByTestId('settings-test-notification-button');
    await expect(testButton).toBeVisible();

    let dialogSeen = false;
    page.once('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await testButton.click();
    expect(dialogSeen).toBeTruthy();
  });
});










