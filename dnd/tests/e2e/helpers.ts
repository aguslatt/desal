import { expect, type Locator, type Page } from "@playwright/test";

/** Avanza con Tab hasta que el foco cae en el elemento. Falla si no aparece (foco atrapado o inalcanzable). */
export async function tabHasta(page: Page, objetivo: Locator, maximo = 80) {
  const el = await objetivo.elementHandle();
  expect(el, "el elemento existe").not.toBeNull();
  for (let i = 0; i < maximo; i++) {
    const enfocado = await page.evaluate((e) => document.activeElement === e, el);
    if (enfocado) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`No se llegó con Tab a: ${objetivo}`);
}
