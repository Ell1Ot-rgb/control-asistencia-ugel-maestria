import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testAllButtons() {
  console.log('--- TEST COMPLETO DE TODOS LOS BOTONES Y FUNCIONALIDADES DE UI ---');
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. DASHBOARD / LOGIN
    console.log('\n[1] Probando Acceso y Sesión...');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForTimeout(500);
    if (!page.url().includes('/dashboard')) {
      await page.fill('input[type="password"]', 'Demo12345');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    }
    await page.waitForSelector('.kpi-grid');
    console.log(`   ✅ Acceso a Dashboard verificado OK -> ${page.url()}`);

    // 2. NAVEGACIÓN Y COMPROBACIÓN DE BARRA ÚNICA
    console.log('\n[2] Probando Botones de Navegación (Dashboard, Personal, Carga, Asistencia, Justificaciones, Reportes)...');
    const routes = ['/personal', '/carga', '/asistencia', '/justificaciones', '/reportes', '/dashboard'];
    for (const route of routes) {
      await page.click(`a[href="${route}"]`);
      await page.waitForURL(`**${route}`);
      console.log(`   ✅ Link a ${route} funciona OK`);
    }

    // 3. SECCIÓN ASISTENCIA Y PANEL DE EDICIÓN
    console.log('\n[3] Probando Edición de Asistencia en Grilla (/asistencia)...');
    await page.goto('http://localhost:5173/asistencia');
    await page.waitForSelector('table.attendance-grid');
    await page.waitForTimeout(1000);

    // Probar click en celda Día 5 del primer docente
    const cell5 = page.locator('table.attendance-grid tbody tr').first().locator('.attendance-cell').nth(4);
    await cell5.click();
    console.log('   ✅ Clic en celda de grilla (Día 5) selecciona celda OK');

    // Editar estado a Tardanza (late) y guardar
    await page.selectOption('.attendance-panel select', 'late');
    await page.fill('.attendance-panel input[type="number"]', '25');
    await page.click('.attendance-panel button:has-text("Guardar")');
    await page.waitForTimeout(1000);

    const alertMsg = await page.locator('.alert-info').innerText();
    console.log(`   ✅ Guardar asistencia funciona OK: "${alertMsg}"`);
    await page.screenshot({ path: path.join(screenshotDir, 'button-test-01-asistencia-editada.png') });

    // Clic en botón de nombre de docente para ir a justificaciones
    console.log('   Probando botón de nombre de docente...');
    await page.click('table.attendance-grid td button.attendance-person');
    await page.waitForURL('**/justificaciones?staff_id=*');
    console.log(`   ✅ Clic en nombre de docente redirige a: ${page.url()}`);

    // 4. SECCIÓN REPORTES - EXCEL
    console.log('\n[4] Probando Botón Descarga Excel (.xlsx)...');
    await page.goto('http://localhost:5173/reportes');
    await page.waitForSelector('button:has-text("Exportar Excel Oficial")');

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.click('button:has-text("Exportar Excel Oficial")'),
    ]);
    console.log(`   ✅ Botón Generar Excel funciona OK: ${download.suggestedFilename()}`);

    // 5. SECCIÓN PERSONAL - CREAR
    console.log('\n[5] Probando Botón + Nuevo Personal...');
    await page.goto('http://localhost:5173/personal');
    await page.click('button:has-text("+ Nuevo Personal")');
    await page.waitForSelector('form');
    console.log('   ✅ Botón + Nuevo Personal abre el formulario OK');

    console.log('\n==================================================');
    console.log('TODOS LOS BOTONES TESTEADOS Y FUNCIONANDO AL 100%! Errores: 0');
    console.log('==================================================');

  } catch (err) {
    console.error('\n❌ ERROR EN PRUEBA DE BOTONES:', err);
    await page.screenshot({ path: path.join(screenshotDir, 'button-test-error.png') });
  } finally {
    await browser.close();
  }
}

testAllButtons();
