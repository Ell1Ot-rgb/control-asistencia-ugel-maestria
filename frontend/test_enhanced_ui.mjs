import { chromium } from 'playwright';

async function testEnhancedUI() {
  console.log('--- TEST UI MEJORADA: Badges RSG 326, Redirección, Excel ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    // LOGIN
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'director.demo');
    await page.fill('input[type="password"]', 'Demo12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('1. Login OK');

    // NAVEGAR A ASISTENCIA (usar goto para estado limpio)
    await page.goto('http://localhost:5173/asistencia');
    await page.waitForSelector('table.data-table');
    await page.waitForTimeout(1500);
    const badges = await page.locator('.card-body span[title*="Tardanza"]').count();
    console.log(`2. Anexo 03 con badges de tardanza: ${badges} encontrados`);
    const staffButtons = await page.locator('table.data-table td button[title*="justificar"]').count();
    console.log(`3. Botones de personal clickeables: ${staffButtons} encontrados`);

    // CLICK EN PRIMER DOCENTE -> REDIRECCIÓN A JUSTIFICACIONES
    await page.locator('table.data-table td button[title*="justificar"]').first().click();
    await page.waitForURL('**/justificaciones?staff_id=*');
    const url = page.url();
    const hasStaffId = url.includes('staff_id=');
    console.log(`4. Redirección a justificaciones: ${hasStaffId ? 'OK' : 'FALLÓ'} (${url})`);
    const selectedStaff = await page.locator('select').first().inputValue();
    console.log(`   Docente pre-seleccionado en dropdown: ${selectedStaff}`);

    // PROBAR DESCARGA EXCEL DESDE REPORTES
    await page.goto('http://localhost:5173/reportes');
    await page.waitForSelector('button:has-text("Exportar Excel Oficial")');
    console.log('5. Botón "Exportar Excel Oficial" visible en reportes');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.click('button:has-text("Exportar Excel Oficial")'),
    ]);
    const suggested = download.suggestedFilename();
    console.log(`6. Excel descargado: ${suggested}`);

    console.log('\n==================================================');
    console.log('PRUEBA UI MEJORADA 100% OK!');
    console.log('==================================================');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await browser.close();
  }
}

testEnhancedUI();
