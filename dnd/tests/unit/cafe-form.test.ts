import { describe, expect, it } from "vitest";
import { entradaDesde, generarRecorrido, slugificar, validarCafe, type EntradaCafe } from "@/lib/cafe-form";
import { lugares } from "@/lib/datos";
import { fotosCreditos } from "@/lib/fotos";

const AHORA = new Date("2026-11-13T12:00:00-03:00");
const f = (slot: string) => fotosCreditos.find((x) => x.slot === slot)!.id;
const base: EntradaCafe = {
  nombre: "Café La Esquina Clara", estilo: "De barrio", barrio: "Villa Devoto", direccion: "Zona Plaza Arenales", lat: "-34.6", lng: "-58.5",
  descripcion: "Café de esquina con medialunas y salón luminoso.", horarios: "Lun a sáb 8 a 20 h",
  foto_fachada: f("fachada"), foto_interior: f("interior"), foto_mesa: f("mesa"),
};
const ok = (e: EntradaCafe, ocupados: string[] = []) => validarCafe(e, { idsOcupados: new Set(ocupados), ahora: AHORA });

describe("validar café", () => {
  it("acepta un café mínimo y todo lo no cargado queda 'sin información'", () => {
    const r = ok(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lugar).toMatchObject({ id: "cafe-la-esquina-clara", rubro: "cafe", estilo: "De barrio", patrocinado: false });
    expect(r.lugar.datos).toEqual({});
    expect(r.lugar.fotos).toHaveLength(3);
    expect(r.lugar.fotos[0].alt).toMatch(/Foto ilustrativa: no es Café La Esquina Clara/);
    expect(r.lugar.momentos).toHaveLength(4);
  });
  it("explica cada error en texto y dice qué campo es", () => {
    const r = ok({ ...base, nombre: "ab", estilo: "Bar", lat: "-40", lng: "0", descripcion: "corta", horarios: "", email: "no", web: "http://x.co", foto_mesa: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errores).sort()).toEqual(["descripcion", "email", "estilo", "foto_mesa", "horarios", "lat", "lng", "nombre", "web"]);
    expect(r.errores.lat).toMatch(/dentro de CABA/);
  });
  it("no permite repetir el nombre de un café existente ni uno eliminado", () => {
    const r = ok(base, ["cafe-la-esquina-clara"]);
    expect(r).toMatchObject({ ok: false, errores: { nombre: "Ya hay un café con ese nombre. Elegí otro." } });
  });
  it("al editar conserva el id aunque cambie el nombre", () => {
    const r = validarCafe({ ...base, nombre: "Otro nombre distinto" }, { idsOcupados: new Set(["cafe-original"]), idEditado: "cafe-original", ahora: AHORA });
    expect(r.ok && r.lugar.id).toBe("cafe-original");
  });
  it("un dato confirmado o 'no disponible' exige fuente y fecha, y la fecha no puede ser futura", () => {
    expect(ok({ ...base, c_rampa_estado: "confirmado" })).toMatchObject({ ok: false, errores: { c_rampa: "Elegí quién aportó el dato." } });
    expect(ok({ ...base, c_rampa_estado: "confirmado", c_rampa_fuente: "equipo" })).toMatchObject({ ok: false, errores: { c_rampa: "Elegí la fecha del dato." } });
    expect(ok({ ...base, c_rampa_estado: "confirmado", c_rampa_fuente: "equipo", c_rampa_fecha: "2027-01-01" })).toMatchObject({ ok: false, errores: { c_rampa: "La fecha del dato no puede ser futura." } });
    const r = ok({ ...base, c_rampa_estado: "confirmado", c_rampa_fuente: "equipo", c_rampa_fecha: "2026-11-01", c_rampa_valor: "Fija" });
    expect(r.ok && r.lugar.datos.rampa).toEqual({ estado: "confirmado", valor: "Fija", fuente: { tipo: "equipo", fecha: "2026-11-01" } });
  });
  it("los datos de visitantes piden la cantidad", () => {
    const e = { ...base, c_agua_estado: "confirmado", c_agua_fuente: "visitantes", c_agua_fecha: "2026-11-01" };
    expect(ok(e)).toMatchObject({ ok: false, errores: { c_agua: "Indicá cuántos visitantes lo reportaron (1 o más)." } });
    const r = ok({ ...e, c_agua_cant: "3" });
    expect(r.ok && r.lugar.datos.agua.fuente).toEqual({ tipo: "visitantes", fecha: "2026-11-01", cantidad: 3 });
  });
  it("el ancho de puerta confirmado exige un número", () => {
    const e = { ...base, c_ancho_puerta_estado: "confirmado", c_ancho_puerta_fuente: "comercio", c_ancho_puerta_fecha: "2026-11-02" };
    expect(ok(e)).toMatchObject({ ok: false });
    const r = ok({ ...e, c_ancho_puerta_valor: "92" });
    expect(r.ok && r.lugar.datos.ancho_puerta.valor).toBe(92);
  });
  it("los momentos tranquilos y el patrocinio se guardan", () => {
    const r = ok({ ...base, patrocinado: "on", mom_0_ruido: "1", mom_0_gente: "3", mom_3_ruido: "9" });
    expect(r.ok && r.lugar.patrocinado).toBe(true);
    expect(r.ok && r.lugar.momentos[0]).toMatchObject({ ruido: 1, concurrencia: 3 });
    expect(r.ok && r.lugar.momentos[3].ruido).toBe(2); // valor inválido → medio
  });
});

describe("recorrido generado", () => {
  it("el texto sale de los datos: escalones, rampa y baño", () => {
    const con = ok({
      ...base, recorrido: "on",
      c_ingreso_sin_escalones_estado: "no_disponible", c_ingreso_sin_escalones_fuente: "equipo", c_ingreso_sin_escalones_fecha: "2026-11-01",
      c_bano_accesible_estado: "confirmado", c_bano_accesible_fuente: "equipo", c_bano_accesible_fecha: "2026-11-01",
    });
    if (!con.ok) throw new Error("no validó");
    expect(con.lugar.recorrido).toHaveLength(5);
    expect(con.lugar.recorrido[1].descripcion).toMatch(/Hay escalones para entrar/);
    expect(con.lugar.recorrido[4].descripcion).toMatch(/barras y espacio para girar/);
    expect(con.lugar.recorrido[3].descripcion).toMatch(/No tenemos datos sobre la altura/);
    expect(con.lugar.recorrido.map((p) => p.tipo)).toEqual(["vereda", "ingreso", "interior", "mesa", "bano"]);
  });
  it("sin la casilla, el café no tiene recorrido", () => {
    const r = ok(base);
    expect(r.ok && r.lugar.recorrido).toEqual([]);
  });
  it("coincide con el recorrido de los cafés de demostración", () => {
    const nube = lugares.find((l) => l.id === "cafe-nube-de-pan")!;
    expect(generarRecorrido(nube).map((p) => p.descripcion)).toEqual(nube.recorrido.map((p) => p.descripcion));
  });
});

describe("edición", () => {
  it("un café existente vuelve a validar igual que estaba (ida y vuelta del formulario)", () => {
    for (const l of lugares.filter((x) => Object.keys(x.datos).length > 0).slice(0, 5)) {
      const r = validarCafe(entradaDesde(l), { idsOcupados: new Set(), idEditado: l.id, ahora: AHORA });
      expect(r.ok, l.id + ": " + (r.ok ? "" : JSON.stringify(r.errores))).toBe(true);
      if (r.ok) expect(r.lugar.datos).toEqual(l.datos);
    }
  });
  it("slugifica nombres con tildes", () => {
    expect(slugificar("Café Ñandú & Co.")).toBe("cafe-nandu-co");
  });
});
