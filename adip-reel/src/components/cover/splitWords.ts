/**
 * Parte un texto del guion en líneas de diseño SOLO por palabras (no se reescribe nada).
 * `wordsPerLine` indica cuántas palabras lleva cada línea; si sobran palabras, van a la última línea,
 * de modo que `lines.join(" ") === text` siempre se cumple.
 */
export const splitWords = (text: string, wordsPerLine: readonly number[]): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let at = 0;
  for (let i = 0; i < wordsPerLine.length && at < words.length; i++) {
    const take = i === wordsPerLine.length - 1 ? words.length - at : wordsPerLine[i];
    lines.push(words.slice(at, at + take).join(" "));
    at += take;
  }
  return lines;
};
