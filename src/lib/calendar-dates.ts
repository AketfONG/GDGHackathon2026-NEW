/** Local calendar YYYY-MM-DD from a Date (uses the environment’s local timezone). */
export function dateToLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add days to an existing YYYY-MM-DD string in local calendar arithmetic. */
export function addDaysToLocalYmd(ymd: string, deltaDays: number): string {
  const parts = ymd.split("-").map((x) => parseInt(x, 10));
  const y = parts[0]!;
  const mo = parts[1]!;
  const da = parts[2]!;
  const d = new Date(y, mo - 1, da);
  d.setDate(d.getDate() + deltaDays);
  return dateToLocalYmd(d);
}

/** Add days to a Date using its local calendar date as the starting day. */
export function addDaysFromDateToLocalYmd(d: Date, deltaDays: number): string {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  base.setDate(base.getDate() + deltaDays);
  return dateToLocalYmd(base);
}

/** Start of local calendar day for YYYY-MM-DD (for comparing against submission times). */
export function localYmdToStartOfDay(ymd: string): Date {
  const parts = ymd.split("-").map((x) => parseInt(x, 10));
  const y = parts[0]!;
  const mo = parts[1]!;
  const da = parts[2]!;
  return new Date(y, mo - 1, da, 0, 0, 0, 0);
}
