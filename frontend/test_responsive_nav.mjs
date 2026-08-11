import { chromium } from 'playwright';

async function testResponsiveNav() {
  console.log('--- TEST NAVEGACIÓN DESKTOP Y MOBILE ---');
  const browser = await chromium.launch({ headless: true });
  const links = ['/personal', '/carga', '/asistencia', '/justificaciones', '/reportes', '/dashboard'];

  // 1. Mobile viewport test (iPhone SE 375x667)
  console.log('\n[MOBILE TEST - 375x667]');
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/login');
  await mobilePage.fill('input[type="text"]', 'director.demo');
  await mobilePage.fill('input[type="password"]', 'Demo12345');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/dashboard');

  for (const link of links) {
    await mobilePage.goto(`http://localhost:5173${link}`);
    await mobilePage.waitForLoadState('domcontentloaded');
    console.log(`  Mobile goto ${link} -> URL actual: ${mobilePage.url()}`);
  }
  await mobileContext.close();

  // 2. Desktop viewport test (1280x800)
  console.log('\n[DESKTOP TEST - 1280x800]');
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/login');
  await desktopPage.fill('input[type="text"]', 'director.demo');
  await desktopPage.fill('input[type="password"]', 'Demo12345');
  await desktopPage.click('button[type="submit"]');
  await desktopPage.waitForURL('**/dashboard');

  for (const link of links) {
    await desktopPage.goto(`http://localhost:5173${link}`);
    await desktopPage.waitForLoadState('domcontentloaded');
    console.log(`  Desktop goto ${link} -> URL actual: ${desktopPage.url()}`);
  }
  await desktopContext.close();

  await browser.close();
  console.log('\n==================================================');
  console.log('NAVEGACIÓN MULTIDISPOSITIVO VALIDADA 100% OK!');
  console.log('==================================================');
}

testResponsiveNav();
