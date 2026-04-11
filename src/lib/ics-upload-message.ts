/** Success copy after POST /api/calendar/ics (stored import is always one file per user — new upload replaces the last). */
export function formatIcsUploadSuccessMessage(count: number, replacedPrevious: boolean): string {
  const n = Math.max(0, Math.floor(count));
  const base = `Imported ${n} event${n === 1 ? "" : "s"}`;
  if (replacedPrevious) {
    return `${base}. Replaced your previously imported calendar.`;
  }
  return `${base}.`;
}
