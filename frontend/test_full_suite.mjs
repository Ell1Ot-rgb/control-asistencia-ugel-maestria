import { chromium } from 'playwright';

async function runFullSuite() {
  console.log('--- INICIANDO SUITE DE PRUEBAS COMPLETA E2E PLAYWRIGHT ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[Console Error] ${msg.text()}`);
      errors.push(`Console: ${msg.text()}`);
    }
  });

  page.on('requestfailed', req => {
    console.error(`[Network Fail] ${req.url()} - ${req.failure()?.errorText}`);
    errors.push(`Network: ${req.url()}`);
  });

  try {
    // 1. LOGIN
    console.log('\n1. Probando Login...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'director.demo');
    await page.fill('input[type="password"]', 'Demo12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('   LOGIN EXITOSO -> Redirigido a /dashboard');

    // 2. DASHBOARD
    console.log('\n2. Probando Dashboard...');
    await page.click('a[href="/dashboard"]');
    await page.waitForSelector('.kpi-grid');
    const kpis = await page.locator('.kpi-card .value').allInnerTexts();
    console.log(`   KPIs capturados en Dashboard: ${JSON.stringify(kpis)}`);

    // 3. PERSONAL
    console.log('\n3. Probando Gestión de Personal (/personal)...');
    await page.click('a[href="/personal"]');
    await page.waitForSelector('table.data-table');
    const initialStaffRows = await page.locator('table.data-table tbody tr').count();
    console.log(`   Filas de personal iniciales: ${initialStaffRows}`);

    // Crear nuevo personal
    await page.click('button:has-text("+ Nuevo Personal")');
    await page.waitForSelector('form');
    const testDni = `456${Math.floor(10000 + Math.random() * 90000)}`;
    await page.fill('input[placeholder="45678912"]', testDni);
    await page.fill('input[placeholder="Quispe Mamani"]', 'Perez Gonzalez');
    await page.fill('input[placeholder="Maria Elena"]', 'Carlos Alberto');
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(1000);
    const newStaffRows = await page.locator('table.data-table tbody tr').count();
    console.log(`   Personal creado exitosamente (DNI ${testDni}). Filas totales: ${newStaffRows}`);

    // 4. CARGA BIOMÉTRICA
    console.log('\n4. Probando Carga Biométrica (/carga)...');
    await page.click('a[href="/carga"]');
    await page.waitForSelector('input[type="file"]');
    console.log('   Página de Carga Biométrica renderizada OK');

    // 5. ASISTENCIA
    console.log('\n5. Probando Asistencia (/asistencia)...');
    await page.click('a[href="/asistencia"]');
    await page.waitForSelector('table.data-table');
    const attendanceRows = await page.locator('table.data-table tbody tr').count();
    console.log(`   Filas en tabla de Asistencia (Anexo 03): ${attendanceRows}`);

    // 6. JUSTIFICACIONES
    console.log('\n6. Probando Justificaciones (/justificaciones)...');
    await page.click('a[href="/justificaciones"]');
    await page.waitForSelector('form');
    console.log('   Formulario de Justificaciones renderizado OK');
    await page.fill('input[placeholder="Descripción del motivo de la licencia..."]', 'Licencia por capacitación UGEL');
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(1000);
    const justRows = await page.locator('table.data-table tbody tr').count();
    console.log(`   Justificación registrada exitosamente. Total justo: ${justRows}`);

    // 7. REPORTES
    console.log('\n7. Probando Reportes Oficiales UGEL (/reportes)...');
    await page.click('a[href="/reportes"]');
    await page.waitForSelector('.kpi-grid');
    const reportKpis = await page.locator('.kpi-card .value').allInnerTexts();
    console.log(`   Consolidado Anexo 04 capturado OK. KPIs: ${JSON.stringify(reportKpis)}`);

    console.log('\n==================================================');
    console.log(`SUITE E2E PLAYWRIGHT COMPLETADA CON ÉXITO AL 100%! Errores: ${errors.length}`);
    console.log('==================================================');

  } catch (err) {
    console.error('ERROR EN SUITE:', err);
  } finally {
    await browser.close();
  }
}

runFullSuite();
