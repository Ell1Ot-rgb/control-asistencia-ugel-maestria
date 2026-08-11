import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testAutoConsolidation() {
  console.log('--- TEST AUTO-CONSOLIDACIÓN DE ASISTENCIA Y FINES DE SEMANA (SÁB/DOM) ---');
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('1. Iniciando sesión...');
    await page.goto('http://localhost:5173/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'director.demo');
    await page.fill('input[type="password"]', 'Demo12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('   ✅ Login OK');

    console.log('2. Navegando a /asistencia...');
    await page.goto('http://localhost:5173/asistencia');
    await page.waitForSelector('table.attendance-grid');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'auto-consolidate-01-antes.png') });

    console.log('3. Haciendo clic en botón "⚡ Auto-Consolidar"...');
    await page.click('button:has-text("Auto-Consolidar")');
    await page.waitForTimeout(1500);

    const alertMsg = await page.locator('.alert-info').innerText();
    console.log(`   ✅ Mensaje de confirmación: "${alertMsg}"`);
    await page.screenshot({ path: path.join(screenshotDir, 'auto-consolidate-02-despues.png') });

    // 4. Verificación de exclusión de fines de semana (Julio 2026: Día 11 es Sábado, Día 12 es Domingo)
    console.log('4. Verificando que Sábados y Domingos NO fueron marcados como tardanza o inasistencia...');
    const firstRow = page.locator('table.attendance-grid tbody tr').first();
    
    // Julio 2026: Día 11 es Sábado, Día 12 es Domingo
    const day11Status = await firstRow.locator('.attendance-cell').nth(10).getAttribute('class');
    const day12Status = await firstRow.locator('.attendance-cell').nth(11).getAttribute('class');
    
    console.log(`   Estado Día 11 (Sábado): ${day11Status}`);
    console.log(`   Estado Día 12 (Domingo): ${day12Status}`);

    if (day11Status.includes('status-absent') || day11Status.includes('status-late')) {
      throw new Error('FALLO: El día de fin de semana (Sábado 11) fue marcado como inasistencia/tardanza!');
    }
    if (day12Status.includes('status-absent') || day12Status.includes('status-late')) {
      throw new Error('FALLO: El día de fin de semana (Domingo 12) fue marcado como inasistencia/tardanza!');
    }

    console.log('\n==================================================');
    console.log('TEST AUTO-CONSOLIDACIÓN Y FINES DE SEMANA 100% EXITO!');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ ERROR EN TEST:', err);
    await page.screenshot({ path: path.join(screenshotDir, 'auto-consolidate-error.png') });
  } finally {
    await browser.close();
  }
}

testAutoConsolidation();
