import type { ChapterSpan } from '@lectura/reading-domain';

/**
 * Today's reading as a person would say it: "Salmos 4–6", "Rut 4 y Rut 1–2", and for a
 * one-chapter book read several times, "Abdías 1, 3 veces".
 */
export function describeReading(bookName: string, spans: readonly ChapterSpan[]): string {
  if (!spans.length) return '';
  const [first] = spans;
  const sameChapter = spans.every((span) => span.from === first.from && span.to === first.from);
  if (sameChapter && spans.length > 1)
    return $localize`:@@reading.today.repeated:${bookName}:book: ${first.from}:chapter:, ${spans.length}:times: veces`;

  const parts = spans.map((span) =>
    span.from === span.to ? `${bookName} ${span.from}` : `${bookName} ${span.from}–${span.to}`,
  );
  if (parts.length === 1) return parts[0];
  const and = $localize`:@@reading.today.and:y`;
  return `${parts.slice(0, -1).join(', ')} ${and} ${parts[parts.length - 1]}`;
}
