import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let failed = false;
  page.on('dialog', async dialog => {
    console.log('DIALOG:', dialog.message());
    failed = true;
    await dialog.dismiss();
  });

  try {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@hireflow.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('http://localhost:3000/');
    
    await page.goto('http://localhost:3000/leads/new');
    
    await page.fill('input[name="firstName"]', 'Fail');
    await page.fill('input[name="lastName"]', 'Test');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    if (failed) {
      console.log('Test resulted in failure alert.');
    } else {
      console.log('Current URL:', page.url());
    }
  } catch (e) {
    console.error('Playwright Error:', e);
  } finally {
    await browser.close();
  }
})();
