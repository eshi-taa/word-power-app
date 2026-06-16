import { test, expect } from '@playwright/test';

test.describe('Word Power Web Application E2E Tests', () => {
  
  test('should log in, view a word group, complete study, and open the quiz', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('http://localhost:5173');
    
    // Check if app title exists
    await expect(page.locator('.header-title')).toContainText('Word Power');

    // 2. Fill in credentials and log in
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // 3. Confirm redirected to Home dashboard and see groups loaded
    await expect(page.getByRole('heading', { name: 'CRED', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'RUPT', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'DICT', exact: true })).toBeVisible();

    // 4. Click the CRED group
    await page.getByRole('heading', { name: 'CRED', exact: true }).click();

    // 5. Confirm word list for CRED is loaded
    await expect(page.getByRole('heading', { name: 'credible', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'incredible', exact: true })).toBeVisible();

    // 6. Click the study completion button or take quiz button (using mock dialog handler to auto-accept the confirm dialog if needed!)
    const takeQuizBtn = page.locator('text=Take Quiz');
    if (await takeQuizBtn.isVisible()) {
      await takeQuizBtn.click();
    } else {
      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('You have finished studying');
        await dialog.accept(); // Clicks "OK" to redirect to Quiz
      });
      await page.click("text=I've studied this group");
    }

    // 7. Verify we are navigated to the Quiz Screen
    await expect(page.locator('text=Question 1 of 3')).toBeVisible();
  });

});

