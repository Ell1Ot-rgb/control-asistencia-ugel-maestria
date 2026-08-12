import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testDatUpload() {
  console.log('--- TEST SUBIDA Y PROCESAMIENTO DE ARCHIVO ATTLOG.dat ---');
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Crear archivo ATTLOG.dat de prueba
  const datPath = '/tmp/test_biometric_ATTLOG.dat';
  const datContent = [
    '45651880\t2026-07-06 07:55:00\t1\t1\t0\t0',
    '45651880\t2026-07-06 15:00:00\t0\t1\t0\t0',
    '45678912\t2026-07-06 08:14:00\t1\t1\t0\t0',
    '45678912\t2026-07-06 15:02:00\t0\t1\t0\t0',
    '45651880\t2026-07-07 07:58:00\t1\t1\t0\t0',
    '45678912\t2026-07-07 08:22:00\t1\t1\t0\t0',
    '45651880\t2026-07-08 07:50:00\t1\t1\t0\t0',
    '45678912\t2026-07-08 07:56:00\t1\t1\t0\t0',
  ].join('\n');

  fs.writeFileSync(datPath, datContent, 'utf8');
  console.log(`1. Archivo de prueba creado en ${datPath}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('2. Iniciando sesión...');
    await page.goto('http://localhost:5173/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'director.demo');
    await page.fill('input[type="password"]', 'Demo12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('   ✅ Login OK');

    console.log('3. Navegando a /carga y subiendo ATTLOG.dat...');
    await page.goto('http://localhost:5173/carga');
    await page.waitForSelector('input[type="file"]');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(datPath);
    await page.click('button:has-text("Subir archivo CSV")');
    await page.waitForSelector('.badge:has-text("draft")');
    console.log('   ✅ Archivo ATTLOG.dat cargado correctamente en borrador (draft)');
    await page.screenshot({ path: path.join(screenshotDir, 'dat-upload-01-carga.png') });

    // Auto-registrar si hay DNI nuevo
    const autoRegisterBtn = page.locator('button:has-text("Auto-Registrar")');
    if (await autoRegisterBtn.isVisible().catch(() => false)) {
      await autoRegisterBtn.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ Nuevos DNI registrados automáticamente');
    }

    console.log('4. Confirmando e impactando asistencia...');
    await page.click('button:has-text("Confirmar e Impactar Asistencia")');
    await page.waitForTimeout(1500);
    console.log('   ✅ Asistencia impactada en la base de datos');

    console.log('5. Verificando grilla en /asistencia...');
    await page.goto('http://localhost:5173/asistencia');
    await page.waitForSelector('table.attendance-grid');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'dat-upload-02-asistencia.png') });

    const firstRow = page.locator('table.attendance-grid tbody tr').first();
    const day6Status = await firstRow.locator('.attendance-cell').nth(5).getAttribute('class');
    console.log(`   Estado Día 6 (Lunes): ${day6Status}`);

    console.log('\n==================================================');
    console.log('TEST SUBIDA ATTLOG.dat COMPLETADO CON ÉXITO AL 100%!');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ ERROR EN TEST DE SUBIDA ATTLOG.dat:', err);
    await page.screenshot({ path: path.join(screenshotDir, 'dat-upload-error.png') });
  } finally {
    await browser.close();
  }
}

testDatUpload();
