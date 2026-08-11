import { chromium } from 'playwright';

async function testCreateJustification() {
  console.log('--- TEST: Creación y visualización de Justificación ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'director.demo');
    await page.fill('input[type="password"]', 'Demo12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('1. Login OK');

    await page.goto('http://localhost:5173/justificaciones');
    await page.waitForSelector('select:has(option[value="1"])');
    console.log('2. Navegado a /justificaciones, formulario y lista de docentes cargados.');

    const countDataRows = () => page.locator('table.data-table tbody tr').evaluateAll((rows) => rows.filter((row) => !row.textContent?.includes('Sin registros')).length);
    const initialRowCount = await countDataRows();
    console.log(`3. Tabla inicialmente tiene ${initialRowCount} fila(s) de datos.`);

    await page.selectOption('select:has(option[value="1"])', '1');
    await page.fill('input[type="date"] >> nth=0', '2026-07-10');
    await page.fill('input[type="date"] >> nth=1', '2026-07-12');
    await page.selectOption('select:has(option[value="J"])', 'J');
    const reason = `Licencia médica E2E ${Date.now()}`;
    await page.fill('input[placeholder*="licencia"]', reason);
    await page.click('button:has-text("Registrar Justificación")');
    console.log('4. Formulario de justificación enviado.');
    await page.waitForFunction((expected) => [...document.querySelectorAll('table.data-table tbody tr')].some((row) => row.textContent?.includes(expected)), reason);
    const finalRowCount = await countDataRows();
    console.log(`5. Tabla actualizada, ahora tiene ${finalRowCount} fila(s) de datos.`);

    const newRowText = await page.locator('table.data-table tbody tr').last().innerText();
    console.log(`   Contenido de la nueva fila: ${newRowText.replace(/\t/g, ' | ')}`);

    if (finalRowCount > initialRowCount && newRowText.includes(reason)) {
      console.log('\n==================================================');
      console.log('VERIFICACIÓN 100% OK: La creación y carga de justificaciones funciona.');
      console.log('==================================================');
    } else {
      throw new Error('La tabla no mostró la justificación recién creada.');
    }

  } catch (err) {
    console.error('ERROR EN EL TEST:', err.message);
  } finally {
    await browser.close();
  }
}

testCreateJustification();
