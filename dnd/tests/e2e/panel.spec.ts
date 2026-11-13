import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

const ADMIN = { email: "admin@umbral.test", clave: "clave-admin-e2e-123" };
const axe = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze()).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);

async function ingresar(page: Page, email: string, clave: string) {
  await page.goto("/panel/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Clave", { exact: true }).fill(clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
}
async function comoAdmin(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await ingresar(page, ADMIN.email, ADMIN.clave);
  await expect(page.getByRole("heading", { level: 1, name: "Administración" })).toBeVisible();
  return { ctx, page };
}
/** Cuántos cafés muestra hoy el listado público (el número que se anuncia: "N cafés para elegir"). */
const publicos = async (page: Page) => {
  await page.goto("/lugares");
  const t = await page.getByRole("status").filter({ hasText: "cafés para elegir" }).innerText();
  return Number(/^(\d+) /.exec(t)![1]);
};

test.describe.configure({ mode: "serial" });

test("sin sesión no se puede entrar a ninguna pantalla del panel", async ({ page }) => {
  for (const ruta of ["/panel/admin", "/panel/admin/cafes", "/panel/admin/cafes/nuevo", "/panel/admin/cuentas", "/panel/admin/metricas", "/panel/cafe", "/panel/cafe/clave"]) {
    await page.goto(ruta);
    await expect(page, ruta).toHaveURL(/\/panel\/ingresar/);
  }
});

test("ingreso: errores en texto, entrada de la administración y salida", async ({ page }) => {
  await ingresar(page, ADMIN.email, "clave-equivocada-1");
  await expect(page.getByText("El correo o la clave no son correctos.")).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await ingresar(page, ADMIN.email.toUpperCase(), ADMIN.clave);
  await expect(page).toHaveURL(/\/panel\/admin$/);
  await expect(page.getByRole("heading", { level: 1, name: "Administración" })).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/panel\/ingresar/);
  await page.goto("/panel/admin");
  await expect(page).toHaveURL(/\/panel\/ingresar/); // la sesión se cerró de verdad
});

test("una cookie alterada o con otro perfil no da acceso", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "umbral_sesion", value: `${Buffer.from(JSON.stringify({ u: "x@x.co", rol: "admin", exp: Date.now() + 1e9 })).toString("base64url")}.firmafalsa`, url: "http://localhost:3100" }]);
  const page = await ctx.newPage();
  await page.goto("/panel/admin");
  await expect(page).toHaveURL(/\/panel\/ingresar/);
  await ctx.close();
});

test("la administración agrega, edita, oculta, muestra y elimina un café, y la app pública lo refleja", async ({ browser }) => {
  const { ctx, page } = await comoAdmin(browser);
  const n = await publicos(page);

  // Formulario vacío: errores en texto, con enlaces a cada campo
  await page.goto("/panel/admin/cafes/nuevo");
  await page.getByRole("button", { name: "Agregar café" }).click();
  const alerta = page.locator("form [role=alert]");
  await expect(alerta).toContainText("Revisá los campos marcados");
  await expect(page.getByText("El nombre tiene que tener entre 3 y 80 caracteres.").first()).toBeVisible();
  await expect(page.getByLabel("Nombre del café")).toHaveAttribute("aria-invalid", "true");
  expect(await axe(page)).toEqual([]);

  // Alta
  await page.getByLabel("Nombre del café").fill("Café E2E Prueba");
  await page.getByLabel("Estilo de café").selectOption("Café con jardín");
  await page.getByLabel("Barrio", { exact: true }).fill("Villa Devoto");
  await page.getByLabel("Dirección o referencia", { exact: true }).fill("Zona Plaza Arenales");
  await page.getByLabel("Latitud", { exact: true }).fill("-34,60");
  await page.getByLabel("Longitud", { exact: true }).fill("-58,50");
  await page.getByLabel("Descripción", { exact: true }).fill("Café de prueba con jardín y mesas al aire libre.");
  await page.getByLabel("Horarios", { exact: true }).fill("Lun a vie 9 a 19 h");
  for (const f of ["Foto de la fachada", "Foto del interior", "Foto de la mesa"]) await page.getByLabel(f).selectOption({ index: 1 });
  await page.getByLabel("Generar el recorrido visual de cinco pasos").check();
  await page.getByLabel("Ingreso sin escalones: estado").selectOption("confirmado");
  await page.getByLabel("Ingreso sin escalones: quién lo aportó").selectOption("equipo");
  await page.getByLabel("Ingreso sin escalones: fecha del dato").fill("2026-10-01");
  await page.getByRole("button", { name: "Agregar café" }).click();
  await expect(page).toHaveURL(/\/panel\/admin\/cafes\?ok=/);
  await expect(page.getByText("Agregamos Café E2E Prueba.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Café E2E Prueba", exact: true })).toBeVisible();

  // La app pública lo muestra, con sus datos y su recorrido
  expect(await publicos(page)).toBe(n + 1);
  await page.goto("/lugares/cafe-e2e-prueba");
  await expect(page.getByRole("heading", { level: 1, name: "Café E2E Prueba" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Recorrido visual de 5 pasos" })).toBeVisible();
  await page.goto("/lugares/cafe-e2e-prueba/recorrido");
  await page.getByRole("button", { name: "Ver todo el recorrido como texto" }).click();
  await expect(page.getByText("La puerta está a nivel de la vereda, sin escalones.")).toBeVisible();
  await expect(page.getByText("No tenemos datos sobre la altura de las mesas.")).toBeVisible(); // lo no cargado, "sin información"

  // Edición
  await page.goto("/panel/admin/cafes/cafe-e2e-prueba");
  await expect(page.getByLabel("Nombre del café")).toHaveValue("Café E2E Prueba");
  await expect(page.getByLabel("Ingreso sin escalones: estado")).toHaveValue("confirmado");
  await page.getByLabel("Horarios", { exact: true }).fill("Todos los días 8 a 20 h");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Guardamos los cambios de Café E2E Prueba.")).toBeVisible();
  await page.goto("/lugares/cafe-e2e-prueba");
  await expect(page.getByText("Todos los días 8 a 20 h")).toBeVisible();

  // Ocultar: deja de verse en la app (pero sigue en el panel)
  await page.goto("/panel/admin/cafes");
  await page.getByRole("button", { name: "Ocultar Café E2E Prueba" }).click();
  await expect(page.getByText("Ocultamos Café E2E Prueba: ya no se ve en la app.")).toBeVisible();
  expect((await page.goto("/lugares/cafe-e2e-prueba"))?.status()).toBe(404);
  expect(await publicos(page)).toBe(n);
  await page.goto("/panel/admin/cafes");
  await page.getByRole("button", { name: "Mostrar Café E2E Prueba" }).click();
  expect(await publicos(page)).toBe(n + 1);

  // Eliminar pide confirmación
  await page.goto("/panel/admin/cafes");
  await page.getByRole("button", { name: "Eliminar Café E2E Prueba" }).click();
  const dialogo = page.getByRole("dialog", { name: "¿Eliminar Café E2E Prueba?" });
  await expect(dialogo).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(page.getByRole("link", { name: "Café E2E Prueba", exact: true })).toBeVisible(); // cancelar no borra
  await page.getByRole("button", { name: "Eliminar Café E2E Prueba" }).click();
  await page.getByRole("button", { name: "Sí, eliminar el café" }).click();
  await expect(page.getByText("Eliminamos Café E2E Prueba.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Café E2E Prueba", exact: true })).toHaveCount(0);
  expect((await page.goto("/lugares/cafe-e2e-prueba"))?.status()).toBe(404);
  expect(await publicos(page)).toBe(n);
  await ctx.close();
});

test("la administración también puede ocultar un café de los que vienen de base y volver a mostrarlo", async ({ browser }) => {
  const { ctx, page } = await comoAdmin(browser);
  const n = await publicos(page);
  await page.goto("/panel/admin/cafes");
  await page.getByRole("button", { name: "Ocultar Café Taller del Sur" }).click();
  expect(await publicos(page)).toBe(n - 1);
  expect((await page.goto("/lugares/cafe-taller-del-sur"))?.status()).toBe(404);
  await page.goto("/panel/admin/cafes");
  await page.getByRole("button", { name: "Mostrar Café Taller del Sur" }).click();
  expect(await publicos(page)).toBe(n);
  await ctx.close();
});

test("cuentas de cafés: se crean con clave provisoria, obligan a cambiarla, ven solo lo suyo y se pueden suspender", async ({ browser }) => {
  const { ctx: ctxAdmin, page: admin } = await comoAdmin(browser);
  await admin.goto("/panel/admin/cuentas");
  expect(await axe(admin)).toEqual([]);

  // errores en texto
  await admin.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(admin.getByText("Elegí el café.")).toBeVisible();
  await expect(admin.getByText("Escribí un correo válido (nombre@ejemplo.com).")).toBeVisible();

  await admin.getByLabel("Café", { exact: true }).selectOption({ label: "Café Taller del Sur" });
  await admin.getByLabel("Correo de quien administra el café").fill("Dueño@TallerDelSur.test");
  await admin.getByRole("button", { name: "Crear cuenta" }).click();
  const clave = await admin.getByTestId("clave-provisoria").innerText();
  expect(clave).toHaveLength(14);
  await expect(admin.getByText("Copiá la clave provisoria ahora: no la vas a volver a ver.")).toBeVisible();

  // El café entra: primero tiene que elegir una clave propia
  const ctxCafe = await browser.newContext();
  const cafe = await ctxCafe.newPage();
  await ingresar(cafe, "dueño@tallerdelsur.test", clave);
  await expect(cafe).toHaveURL(/\/panel\/cafe\/clave$/);
  await expect(cafe.getByText("Entraste con una clave provisoria. Elegí una propia para seguir.")).toBeVisible();
  await cafe.goto("/panel/cafe");
  await expect(cafe).toHaveURL(/\/panel\/cafe\/clave$/); // no se puede saltear
  expect(await axe(cafe)).toEqual([]);

  await cafe.getByLabel("Clave actual").fill(clave);
  await cafe.getByLabel("Clave nueva", { exact: true }).fill("corta");
  await cafe.getByLabel("Repetí la clave nueva").fill("otra");
  await cafe.getByRole("button", { name: "Cambiar clave" }).click();
  await expect(cafe.getByText("Las dos claves nuevas no coinciden.")).toBeVisible();
  await cafe.getByLabel("Clave actual").fill(clave);
  await cafe.getByLabel("Clave nueva", { exact: true }).fill("corta1");
  await cafe.getByLabel("Repetí la clave nueva").fill("corta1");
  await cafe.getByRole("button", { name: "Cambiar clave" }).click();
  await expect(cafe.getByText("La clave tiene que tener al menos 10 caracteres.")).toBeVisible();
  await cafe.getByLabel("Clave actual").fill(clave);
  await cafe.getByLabel("Clave nueva", { exact: true }).fill("Mi-clave-propia-77");
  await cafe.getByLabel("Repetí la clave nueva").fill("Mi-clave-propia-77");
  await cafe.getByRole("button", { name: "Cambiar clave" }).click();
  await expect(cafe).toHaveURL(/\/panel\/cafe\?ok=clave$/);
  await expect(cafe.getByRole("heading", { level: 1, name: /Mis métricas|Café Taller del Sur/ })).toBeVisible();

  // Un café no puede ver el panel de la administración
  for (const ruta of ["/panel/admin", "/panel/admin/cafes", "/panel/admin/cafes/nuevo", "/panel/admin/cuentas", "/panel/admin/metricas"]) {
    await cafe.goto(ruta);
    await expect(cafe, ruta).toHaveURL(/\/panel\/cafe/);
  }

  // La administración la suspende: se corta el acceso en el próximo pedido
  await admin.goto("/panel/admin/cuentas");
  await admin.getByRole("button", { name: "Suspender la cuenta de dueño@tallerdelsur.test" }).click();
  await expect(admin.getByText("Cuenta suspendida.")).toBeVisible();
  await cafe.goto("/panel/cafe");
  await expect(cafe).toHaveURL(/\/panel\/ingresar/);
  await ingresar(cafe, "dueño@tallerdelsur.test", "Mi-clave-propia-77");
  await expect(cafe.getByText("Esta cuenta está suspendida.")).toBeVisible();

  // Reactivar y eliminar la cuenta (limpieza)
  await admin.goto("/panel/admin/cuentas");
  await admin.getByRole("button", { name: "Reactivar la cuenta de dueño@tallerdelsur.test" }).click();
  await expect(admin.getByText("Cuenta reactivada.")).toBeVisible();
  await admin.getByRole("button", { name: "Eliminar la cuenta de dueño@tallerdelsur.test" }).click();
  await admin.getByRole("button", { name: "Sí, eliminar la cuenta" }).click();
  await expect(admin.getByRole("rowheader", { name: "dueño@tallerdelsur.test" })).toHaveCount(0); // la fila desaparece
  await ingresar(cafe, "dueño@tallerdelsur.test", "Mi-clave-propia-77");
  await expect(cafe.getByText("El correo o la clave no son correctos.")).toBeVisible();
  await ctxCafe.close();
  await ctxAdmin.close();
});

test("pantallas del panel sin violaciones de accesibilidad", async ({ browser }) => {
  const { ctx, page } = await comoAdmin(browser);
  for (const ruta of ["/panel/admin", "/panel/admin/cafes", "/panel/admin/cafes/nuevo", "/panel/admin/cafes/cafe-nube-de-pan", "/panel/admin/cafes/cafe-nube-de-pan/metricas", "/panel/admin/cafes/cafe-nube-de-pan/metricas?dias=7", "/panel/admin/cuentas", "/panel/admin/metricas"]) {
    await page.goto(ruta);
    await page.waitForLoadState("networkidle");
    expect(await axe(page), ruta).toEqual([]);
  }
  await ctx.close();
});

test("métricas de un café: indicadores, gráficos con tabla, qué buscan, mapa de calor y privacidad", async ({ browser }) => {
  const { ctx, page } = await comoAdmin(browser);
  await page.goto("/panel/admin/cafes/cafe-nube-de-pan/metricas");
  await expect(page.getByRole("heading", { level: 1, name: /Métricas de Café Nube de Pan/ })).toBeVisible();
  await expect(page.getByText(/datos de ejemplo/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Visitas por día" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Qué buscan las personas que llegan a tu ficha" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cuándo hay más interés en tu ficha" })).toBeVisible();
  await expect(page.getByText(/Cómo cuidamos la privacidad/)).toBeVisible();
  // cambio de período
  await page.getByRole("link", { name: /7 días/ }).click();
  await expect(page).toHaveURL(/dias=7/);
  await expect(page.getByRole("heading", { level: 1, name: /Métricas de Café Nube de Pan/ })).toBeVisible();
  await ctx.close();
});
