// Verifica que TODOS los textos del guion en src/config/script.ts figuren literalmente en el brief aprobado.
// Uso: node scripts/check-script.mjs
import { readFileSync } from "node:fs";
import * as S from "../src/config/script.ts";

const norm = (s) =>
  s
    .replace(/[“”"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const brief = norm(
  readFileSync(new URL("../docs/brief-original.txt", import.meta.url), "utf8") +
    " " +
    readFileSync(new URL("../docs/brief-v2.txt", import.meta.url), "utf8"),
);

const checks = [
  ["HOOK", S.HOOK],
  ...S.MESSAGES.map((m, i) => [`MESSAGES[${i}].text`, m.text]),
  ...S.MESSAGES.map((m, i) => [`MESSAGES[${i}].lines.join`, m.lines.join(" "), m.text]),
  ["TURN (1+2)", `${S.TURN.first} ${S.TURN.second}`],
  ["TURN firstLines", S.TURN.firstLines.join(" "), S.TURN.first],
  ["TURN secondLines", S.TURN.secondLines.join(" "), S.TURN.second],
  ["COMPANION_FULL", S.COMPANION_FULL],
  ["COMPANION_UNITS.join", S.COMPANION_UNITS.map((u) => u.lines.join(" ")).join(" "), S.COMPANION_FULL],
  ["CLOSING.message", S.CLOSING.message.join(" ")],
  ["CLOSING.date+campaign", `${S.CLOSING.dateLine} ${S.CLOSING.campaign}`],
  ["COVER.title", S.COVER.title],
  ["COVER.subtitle", S.COVER.subtitle],
  ["CHAT.contact", S.CHAT.contact],
  ["CHAT.received", S.CHAT.received],
  ["COMPANION_TEXT", S.COMPANION_TEXT],
  ["VOICEOVER_TEXT", S.VOICEOVER_TEXT],
];

let bad = 0;
for (const [name, got, expect] of checks) {
  const g = norm(got);
  const inBrief = brief.includes(g);
  const eq = expect === undefined ? true : norm(expect) === g;
  const ok = inBrief && eq;
  if (!ok) bad++;
  console.log(`${ok ? "OK " : "FAIL"} ${name}: ${g}`);
}
for (const u of S.COMPANION_UNITS) {
  for (const e of u.emphasis) {
    const ok = u.lines.join(" ").includes(e);
    if (!ok) bad++;
    console.log(`${ok ? "OK " : "FAIL"} énfasis "${e}" ⊂ unidad`);
  }
}
if (bad) {
  console.error(`\n${bad} verificación(es) fallida(s).`);
  process.exit(1);
}
console.log("\nGuion literal verificado contra el brief.");
