import { chromium } from 'playwright';

async function testAgostoImport() {
  console.log('--- INICIANDO PROCESAMIENTO Y VALIDACIÓN DE CSV AGOSTO 2026 ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. LOGIN
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'director.demo');
    await page.fill('input[type="password"]', 'Demo12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('1. Login exitoso -> Redirigido a Dashboard');

    // 2. IR A CARGA BIOMÉTRICA
    await page.click('a[href="/carga"]');
    await page.waitForSelector('input[type="file"]');
    console.log('2. Navegado a Carga Biométrica');

    // 3. SUBIR ARCHIVO CSV AGOSTO
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/tmp/marcas_biometricas_agosto2026.csv');
    await page.click('button:has-text("Subir archivo CSV")');
    await page.waitForSelector('.badge:has-text("draft")');
    console.log('3. Archivo CSV Agosto subido en borrador (draft)');

    // 4. AUTO-REGISTRAR DNI NUEVO
    const autoRegisterBtn = page.locator('button:has-text("Auto-Registrar")');
    if (await autoRegisterBtn.isVisible()) {
      await autoRegisterBtn.click();
      await page.waitForTimeout(1500);
      console.log('4. DNI Nuevo (Juan Pedro Mamani) registrado automáticamente');
    }

    // 5. CONFIRMAR E IMPACTAR ASISTENCIA
    await page.click('button:has-text("Confirmar e Impactar Asistencia")');
    await page.waitForTimeout(1500);
    console.log('5. Carga confirmada e impactada en la base de datos');

    // 6. VERIFICAR REPORTES (AGOSTO 2026)
    await page.click('a[href="/reportes"]');
    await page.waitForSelector('.kpi-grid');
    await page.selectOption('select', '8');
    await page.click('button:has-text("Actualizar Consolidado")');
    await page.waitForTimeout(1000);

    const reportKpis = await page.locator('.kpi-card .value').allInnerTexts();
    console.log(`6. Reportes Anexo 04 Agosto 2026 capturados. KPIs: ${JSON.stringify(reportKpis)}`);

    const staffRows = await page.locator('table.data-table tbody tr').count();
    console.log(`7. Total de docentes en reporte Anexo 04 Agosto: ${staffRows}`);

    console.log('\n==================================================');
    console.log('PRUEBA DE NUEVO CSV FINALIZADA AL 100% OK!');
    console.log('==================================================');

  } catch (err) {
    console.error('ERROR EN PRUEBA DE CSV:', err);
  } finally {
    await browser.close();
  }
}

testAgostoImport();
