describe('Home smoke', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  it('shows home screen and opens FAB menu', async () => {
    await skipOptionalOnboarding();

    await expect(element(by.id('home-screen'))).toBeVisible();
    await expect(element(by.id('home-settings-button'))).toBeVisible();

    await element(by.id('home-fab-main')).tap();
    await expect(element(by.id('home-fab-create-workout'))).toBeVisible();
    await expect(element(by.id('home-fab-create-exercise'))).toBeVisible();
  });
});

async function skipOptionalOnboarding() {
  try {
    await waitFor(element(by.id('onboarding-skip-button')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id('onboarding-skip-button')).tap();
  } catch (e) {
    // overlay not visible
  }
}
