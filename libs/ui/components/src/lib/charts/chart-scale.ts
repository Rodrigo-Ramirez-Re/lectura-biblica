/**
 * The top of a value axis: the smallest "round" number (1, 2 or 5 × 10ⁿ per tick) at or above
 * `max`, so the gridlines fall on numbers people read at a glance.
 */
export function niceScale(max: number, ticks = 4): { top: number; step: number } {
  if (max <= 0) return { top: ticks, step: 1 };
  const raw = max / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const factor = [1, 2, 5, 10].find((f) => f * magnitude >= raw) ?? 10;
  const step = Math.max(1, factor * magnitude);
  return { top: step * Math.ceil(max / step), step };
}
