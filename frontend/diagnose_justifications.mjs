import { chromium } from 'playwright';

async function diagnosePageLoad() {
  console.log('--- DIAGNÓSTICO: Carga de la página /justificaciones ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // --- CAPTURA DE EVIDENCIA ---
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[CONSOLE JS ERROR]: ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    console.error(`[PAGE UNCAUGHT EXCEPTION]: ${error.message}`);
  });
  page.on('request', request => {
    if (request.url().startsWith('/api/')) {
      console.log(`[API CALL] ${request.method()} ${request.url()}`);
    }
  });
  page.on('response', response => {
    if (response.url().startsWith('/api/') && !response.ok()) {
      console.error(`[API ERROR] ${response.status()} ${response.url()}`);
    }
  });

  try {
    // LOGIN
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="text"]', 'director.demo');
    await page.fill('input[type="password"]', 'Demo12345');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('1. Login OK');

    // INTENTAR NAVEGAR A LA PÁGINA PROBLEMÁTICA
    console.log('2. Intentando navegar a /justificaciones...');
    await page.goto('http://localhost:5173/justificaciones');

    // Esperar un tiempo fijo para permitir que todo se ejecute/falle
    await page.waitForTimeout(5000);

    console.log('3. Navegación completada (o intentada). Revisando el estado del DOM...');
    const pageContent = await page.content();
    const isFormRendered = await page.locator('form').isVisible();
    console.log(`4. ¿El formulario es visible?: ${isFormRendered}`);
    console.log('--- Contenido de <main> después de 5 segundos ---');
    console.log(pageContent.substring(pageContent.indexOf('<main'), pageContent.indexOf('</main>') + 7));


  } catch (err) {
    console.error('ERROR CAPTURADO DURANTE EL DIAGNÓSTICO:', err.message);
  } finally {
    await browser.close();
  }
}

diagnosePageLoad();
