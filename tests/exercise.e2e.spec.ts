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

test.describe('Übungen erstellen', () => {
  test('neue Übung mit allen Pflichtfeldern anlegen', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-exercise').click();

    await page
      .getByTestId('create-exercise-name-input')
      .fill('Burpees Spezial');
    await page
      .getByTestId('create-exercise-instructions-input')
      .fill('Springen, Liegestütz, hochspringen.');

    await page.getByTestId('create-exercise-type-reps').click();
    await page.getByTestId('create-exercise-amount-input').fill('20');

    let dialogSeen = false;
    page.once('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.accept();
    });

    await page.getByTestId('create-exercise-save-button').click();
    expect(dialogSeen).toBeTruthy();
  });

  test('Validierung: fehlender Name und Anweisungen', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-exercise').click();

    // 1) Fehlender Name
    await page
      .getByTestId('create-exercise-instructions-input')
      .fill('Beschreibung ohne Namen.');

    let nameDialogSeen = false;
    page.once('dialog', async (dialog) => {
      nameDialogSeen = true;
      await dialog.dismiss();
    });
    await page.getByTestId('create-exercise-save-button').click();
    expect(nameDialogSeen).toBeTruthy();

    // 2) Fehlende Anweisungen
    await page.getByTestId('create-exercise-name-input').fill('Ohne Beschreibung');
    await page
      .getByTestId('create-exercise-instructions-input')
      .fill('');

    let instructionDialogSeen = false;
    page.once('dialog', async (dialog) => {
      instructionDialogSeen = true;
      await dialog.dismiss();
    });
    await page.getByTestId('create-exercise-save-button').click();
    expect(instructionDialogSeen).toBeTruthy();
  });

  test('Validierung: Duplikat-Name wird abgelehnt', async ({ page }) => {
    await resetAppStorage(page);

    // Erste Übung
    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-exercise').click();
    await page.getByTestId('create-exercise-name-input').fill('Einzigartige Übung');
    await page
      .getByTestId('create-exercise-instructions-input')
      .fill('Beschreibung A');
    await page.getByTestId('create-exercise-amount-input').fill('10');

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.getByTestId('create-exercise-save-button').click();

    // Zweite Übung mit gleichem Namen
    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-exercise').click();
    await page.getByTestId('create-exercise-name-input').fill('Einzigartige Übung');
    await page
      .getByTestId('create-exercise-instructions-input')
      .fill('Beschreibung B');
    await page.getByTestId('create-exercise-amount-input').fill('15');

    let duplicateDialogSeen = false;
    page.once('dialog', async (dialog) => {
      duplicateDialogSeen = true;
      await dialog.dismiss();
    });

    await page.getByTestId('create-exercise-save-button').click();
    expect(duplicateDialogSeen).toBeTruthy();
  });

  test('Amount-Eingabe kann geleert werden, ohne dass „0“ erscheint', async ({ page }) => {
    await resetAppStorage(page);

    await page.getByTestId('home-fab-main').click();
    await page.getByTestId('home-fab-create-exercise').click();

    const amountInput = page.getByTestId('create-exercise-amount-input');
    await amountInput.fill('50');
    await expect(amountInput).toHaveValue('50');

    await amountInput.fill('');
    await expect(amountInput).toHaveValue('');
  });
});










