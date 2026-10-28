import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { tabHasta } from "./helpers";

const axe = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);

/** Como en cualquier grupo de radios: Tab llega al grupo y las flechas eligen la opción. */
async function responder(page: Page, opcion: string) {
  const opciones = ["Sí", "No", "No lo sé", "No aplica"];
  await tabHasta(page, page.getByRole("radio", { name: "Sí", exact: true }));
  const n = opciones.indexOf(opcion);
  if (n === 0) await page.keyboard.press("Space");
  for (let k = 0; k < n; k++) await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: opcion, exact: true })).toBeChecked();
}
async function siguiente(page: Page) {
  await tabHasta(page, page.getByRole("button", { name: "Siguiente" }));
  await page.keyboard.press("Enter");
}

test("recorrido visual con teclado: pasos, anuncio y vista de texto", async ({ page }) => {
  await page.goto("/lugares/cafe-nube-de-pan");
  await tabHasta(page, page.getByRole("link", { name: "Abrir el recorrido" }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: /Recorrido visual/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Llegás a la vereda" })).toBeVisible();
  await expect(page.getByText("Paso 1 de 5").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Paso anterior" })).toBeDisabled();
  await tabHasta(page, page.getByRole("button", { name: "Paso siguiente" }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2, name: "El ingreso" })).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Paso 2 de 5: El ingreso" })).toBeAttached();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Ver todo el recorrido como texto" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(5);
  expect(await axe(page)).toEqual([]);
});

test("Contar cómo te fue: una pregunta por pantalla, errores en texto y envío con teclado", async ({ page }) => {
  await page.goto("/lugares/cafe-nube-de-pan/reporte");
  const h2 = (t: RegExp | string) => page.getByRole("heading", { level: 2, name: t });
  await expect(h2("¿Había escalones en el ingreso?")).toBeVisible();
  expect(await axe(page)).toEqual([]);

  // Error: seguir sin responder
  await siguiente(page);
  await expect(page.locator("#reporte-error")).toHaveText("Elegí una opción para seguir.");
  await expect(h2("¿Había escalones en el ingreso?")).toBeVisible();
  expect(await axe(page)).toEqual([]);

  await responder(page, "No");
  await siguiente(page);
  await expect(h2("¿La rampa estaba disponible cuando llegaste?")).toBeFocused();
  await responder(page, "Sí");
  await siguiente(page);
  for (const q of ["¿El baño accesible estaba disponible y en condiciones?", "¿Pudiste comunicarte por escrito?", "¿La música estaba a un volumen bajo?", "¿Había un espacio tranquilo disponible?"]) {
    await expect(h2(q)).toBeFocused();
    await responder(page, "Sí");
    await siguiente(page);
  }

  await expect(h2("¿En qué horario fuiste?")).toBeFocused();
  await page.getByLabel("¿En qué horario fuiste?").selectOption({ label: "Tarde (15 a 19 h)" });
  await siguiente(page);

  // "Sí" exige contar qué
  await expect(h2("¿Encontraste algo diferente de lo publicado?")).toBeFocused();
  await responder(page, "Sí");
  await siguiente(page);
  await expect(page.locator("#reporte-error")).toHaveText("Contanos qué encontraste distinto.");
  expect(await axe(page)).toEqual([]);
  await page.getByLabel("Contanos qué encontraste distinto").fill("El baño estaba ocupado por un depósito.");
  await siguiente(page);

  await expect(h2(/foto como evidencia/)).toBeFocused();
  await page.getByLabel(/foto como evidencia/).setInputFiles({ name: "nota.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
  await expect(page.locator("#reporte-error")).toContainText("tiene que ser una imagen");
  await page.getByLabel(/foto como evidencia/).setInputFiles({ name: "baño.png", mimeType: "image/png", buffer: Buffer.from("x") });
  await expect(page.getByText("Foto elegida: baño.png")).toBeVisible();
  await siguiente(page);

  await expect(h2(/Tu reporte sobre/)).toBeFocused();
  await expect(page.getByText("El baño estaba ocupado por un depósito.", { exact: false })).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await tabHasta(page, page.getByRole("button", { name: "Enviar reporte" }));
  await page.keyboard.press("Enter");

  await expect(h2("¡Gracias! Recibimos tu reporte")).toBeFocused();
  await page.waitForTimeout(600); // deja terminar la animación de entrada antes de medir el contraste
  expect(await axe(page)).toEqual([]);
});

test("Reportar un dato incorrecto: errores asociados al campo y envío", async ({ page }) => {
  await page.goto("/lugares/cafe-nube-de-pan/reporte?tipo=dato");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Reportar un dato incorrecto/);
  await page.getByRole("button", { name: "Enviar reporte" }).click();
  await expect(page.getByText("Elegí qué dato es incorrecto.")).toBeVisible();
  await expect(page.getByLabel("Dato")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("¿Qué dice la realidad?")).toHaveAttribute("aria-describedby", /d-texto-e/);
  expect(await axe(page)).toEqual([]);
  await page.getByLabel("Dato").selectOption("rampa");
  await page.getByLabel("¿Qué dice la realidad?").fill("La rampa móvil no está.");
  await page.getByRole("button", { name: "Enviar reporte" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "¡Gracias! Recibimos tu reporte" })).toBeVisible();
});

test("la API rechaza reportes inválidos con un mensaje y acepta los válidos", async ({ request }) => {
  const mal = await request.post("/api/reportes", { data: { lugarId: "nada", respuestas: {} } });
  expect(mal.status()).toBe(422);
  expect((await mal.json()).error).toBe("Lugar desconocido.");
  const bien = await request.post("/api/reportes", { data: { lugarId: "cafe-nube-de-pan", respuestas: { rampa: "si" }, email: "no-se-guarda@x.com" } });
  expect(bien.status()).toBe(201);
});

test("momentos tranquilos: el gráfico tiene una tabla equivalente", async ({ page }) => {
  await page.goto("/lugares/cafe-biblioteca-hojarasca");
  const tabla = page.getByRole("table", { name: "Ruido y concurrencia por franja horaria" });
  await expect(tabla.getByRole("row")).toHaveCount(5);
  await expect(tabla.getByRole("row").nth(1)).toContainText("Mañana");
  await expect(page.getByText("El momento más tranquilo")).toBeVisible();
});
