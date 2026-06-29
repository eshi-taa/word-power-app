import { test, expect } from '@playwright/test';

test.describe('Word Power Web Application E2E Tests', () => {
  
  test('should log in, view a word group, complete study, and open the quiz', async ({ page }) => {
    // 1. Navigate to the landing page and click Log In
    await page.goto('http://localhost:5173');
    
    // Check if app title exists
    await expect(page.locator('.header-title').first()).toContainText('Word Power');

    // Click Log In to go to Login Screen
    await page.click('text=Log In');

    // 2. Fill in credentials and log in
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for the Split OTP input boxes and fill in mock code 123456
    await expect(page.locator('.otp-box-input').first()).toBeVisible();
    const otpInputs = page.locator('.otp-box-input');
    const otpCode = '123456';
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(otpCode[i]);
    }
    await page.click('button[type="submit"]'); // Verify OTP button

    // 3. Confirm redirected to Home dashboard and see groups loaded
    await expect(page.getByRole('heading', { name: 'EGO' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ALTER' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'VERT' }).first()).toBeVisible();

    // 4. Click the EGO group
    await page.getByRole('heading', { name: 'EGO' }).first().click();

    // 5. Confirm word list for EGO is loaded
    await expect(page.getByRole('heading', { name: 'egoist', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'egotist', exact: true })).toBeVisible();

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

