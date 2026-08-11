import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("1. Navegando a la página de Login (http://localhost:5173/login)...");
  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });

  console.log("2. Verificando título de la página...");
  const title = await page.textContent("h1");
  console.log("   Título encontrado:", title);

  console.log("3. Completando credenciales...");
  await page.fill('input[type="text"]', 'director.demo');
  await page.fill('input[type="password"]', 'Demo12345');

  console.log("4. Haciendo click en 'Iniciar sesión'...");
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log("5. Redirección exitosa a URL:", page.url());

  const dashboardHeading = await page.textContent("h1");
  console.log("   Encabezado del Dashboard:", dashboardHeading);

  const kpis = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.kpi-card')).map(card => card.innerText.replace('\n', ': '));
  });
  console.log("6. KPIs del Dashboard en pantalla:", kpis);

  await browser.close();
  console.log("VALIDACIÓN DE PLAYWRIGHT: ÉXITO 100%");
})().catch(err => {
  console.error("ERROR EN PLAYWRIGHT:", err);
  process.exit(1);
});
