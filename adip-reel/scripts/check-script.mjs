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
    readFileSync(new URL("../docs/brief-v2.txt", import.meta.url), "utf8") +
    " " +
    readFileSync(new URL("../docs/brief-v3.txt", import.meta.url), "utf8"),
);

const checks = [
  ["HOOK", S.HOOK],
  ...S.MESSAGES.map((m, i) => [`MESSAGES[${i}].text`, m.text]),
  ...S.MESSAGES.map((m, i) => [`MESSAGES[${i}].lines.join`, m.lines.join(" "), m.text]),
  ["TURN (1+2)", `${S.TURN.first} ${S.TURN.second}`],
  ["TURN firstLines", S.TURN.firstLines.join(" "), S.TURN.first],
  ["TURN secondLines", S.TURN.secondLines.join(" "), S.TURN.second],
  ["COMPANION_FULL", S.COMPANION_FULL],
  ["CLOSING.message", S.CLOSING.message.join(" ")],
  ["CLOSING.date+campaign", `${S.CLOSING.dateLine} ${S.CLOSING.campaign}`],
  ["COVER.title", S.COVER.title],
  ["COVER.subtitle", S.COVER.subtitle],
  ["CHAT.contact", S.CHAT.contact],
  ["CHAT.received", S.CHAT.received],
  ["COMPANION_TEXT", S.COMPANION_TEXT],
  ["CHAT.reply", S.CHAT.reply],
  ["SIGNATURE (2 bloques)", S.SIGNATURE_BLOCKS.map((b) => b.text).join(" "), S.COMPANION_FULL],
  ...S.SIGNATURE_BLOCKS.map((b, i) => [`SIGNATURE_BLOCKS[${i}].lines.join`, b.lines.join(" "), b.text]),
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
for (const bl of S.SIGNATURE_BLOCKS) {
  for (const e of bl.emphasis) {
    const ok = bl.lines.join(" ").includes(e);
    if (!ok) bad++;
    console.log(`${ok ? "OK " : "FAIL"} énfasis "${e}" ⊂ bloque`);
  }
}
if (bad) {
  console.error(`\n${bad} verificación(es) fallida(s).`);
  process.exit(1);
}
console.log("\nGuion literal verificado contra el brief.");
