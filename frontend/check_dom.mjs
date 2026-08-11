import { chromium } from 'playwright';

async function checkDom() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="text"]', 'director.demo');
  await page.fill('input[type="password"]', 'Demo12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.click('header nav a[href="/asistencia"]');
  await page.waitForTimeout(2000);

  const allSpans = await page.locator('.card-body span[title]').count();
  console.log('All spans with title in card-body:', allSpans);

  const tardanzaSpans = await page.locator('.card-body span[title*="Tardanza"]').count();
  console.log('Tardanza spans:', tardanzaSpans);

  const tbodyHtml = await page.locator('table.data-table tbody').first().innerHTML();
  console.log('TBODY HTML (first 1200 chars):');
  console.log(tbodyHtml.substring(0, 1200));

  await browser.close();
}

checkDom();
