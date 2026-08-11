import { chromium } from 'playwright';

async function testNav() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));

  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="text"]', 'director.demo');
  await page.fill('input[type="password"]', 'Demo12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  console.log('Current URL after login:', page.url());

  const links = ['/personal', '/carga', '/asistencia', '/justificaciones', '/reportes', '/dashboard'];
  for (const link of links) {
    console.log(`Clicking nav item for ${link}...`);
    await page.click(`.nav-item[href="${link}"]`);
    await page.waitForTimeout(500);
    console.log(`URL after clicking ${link}: ${page.url()}`);
  }

  await browser.close();
}

testNav();
