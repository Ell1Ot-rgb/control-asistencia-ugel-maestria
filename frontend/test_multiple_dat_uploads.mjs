import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const fixtures = [
  "ATTLOG_AGOSTO_BLOQUE_1.dat",
  "ATTLOG_AGOSTO_BLOQUE_2.dat",
  "ATTLOG_AGOSTO_FIN_DE_SEMANA.dat",
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    await page.goto("http://localhost:5173/login");
    await page.fill('input[type="text"]', "director.demo");
    await page.fill('input[type="password"]', "Demo12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    await page.goto("http://localhost:5173/carga");
    await page.waitForSelector('input[type="file"]');

    for (const fixture of fixtures) {
      const fixturePath = path.join(process.cwd(), "fixtures", fixture);
      await page.locator('input[type="file"]').setInputFiles(fixturePath);
      await page.click('button:has-text("Subir archivo CSV")');
      await page.waitForSelector('.alert-info');
      await page.waitForTimeout(300);

      const summary = await page.locator(".card").filter({ hasText: "Resumen de Carga" }).innerText();
      if (!summary.includes("draft")) throw new Error(`${fixture}: no quedó en draft`);
      if (!summary.includes("Nuevos DNI\n0")) throw new Error(`${fixture}: detectó DNI nuevos inesperados`);

      await page.click('button:has-text("Confirmar e Impactar Asistencia")');
      await page.waitForFunction(() => document.body.innerText.includes("confirmada e impactada"));
      console.log(`✅ Procesado: ${fixture}`);
    }

    await page.goto("http://localhost:5173/asistencia");
    await page.waitForSelector("table.attendance-grid");
    await page.locator("label").filter({ hasText: "Mes" }).locator("select").selectOption("8");
    await page.locator('button:has-text("Auto-Consolidar")').click();
    await page.waitForFunction(() => document.body.innerText.includes("Sáb/Dom excluidos"));

    const rows = page.locator("table.attendance-grid tbody tr");
    const firstRow = rows.first();
    const weekendSaturday = await firstRow.locator(".attendance-cell").nth(7).getAttribute("class");
    const weekendSunday = await firstRow.locator(".attendance-cell").nth(8).getAttribute("class");
    if (weekendSaturday.includes("status-present") || weekendSaturday.includes("status-late") || weekendSaturday.includes("status-absent")) {
      throw new Error(`Sábado 08 marcado incorrectamente: ${weekendSaturday}`);
    }
    if (weekendSunday.includes("status-present") || weekendSunday.includes("status-late") || weekendSunday.includes("status-absent")) {
      throw new Error(`Domingo 09 marcado incorrectamente: ${weekendSunday}`);
    }

    console.log(`✅ Fines de semana excluidos: sábado=${weekendSaturday}, domingo=${weekendSunday}`);
    console.log(`✅ Errores de navegador: ${errors.length}`);
    if (errors.length) throw new Error(errors.join(" | "));
    console.log("MULTIPLE DAT UPLOADS: OK");
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error("MULTIPLE DAT UPLOADS: FAIL", error);
  process.exitCode = 1;
});
