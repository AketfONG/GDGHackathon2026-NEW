import { expandRecurringEvent, parseICS } from "node-ical";

export type ParsedIcsEvent = {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  location: string | null;
};

const MAX_OCCURRENCES = 8000;

/** Wide window so recurring series (incl. past UNTIL / future COUNT) still yield instances for the app. */
function expansionWindow(): { from: Date; to: Date } {
  const from = new Date();
  from.setFullYear(from.getFullYear() - 15);
  const to = new Date();
  to.setFullYear(to.getFullYear() + 10);
  return { from, to };
}

function paramToString(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v && typeof v === "object" && v !== null && "val" in v) {
    const val = (v as { val?: unknown }).val;
    if (typeof val === "string") return val.trim();
  }
  return "";
}

function formatUtcIcsDateTime(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${mo}${da}T${h}${mi}${s}Z`;
}

/**
 * If RRULE stayed a raw string (node-ical only converts it at END:VEVENT when DTSTART is already set;
 * some exports order RRULE before DTSTART so the rule never compiles), rebuild a minimal ICS with
 * DTSTART/DTEND before RRULE and re-parse so `rrule` becomes RRuleCompatWrapper.
 */
function tryCoerceStringRruleToParsedEvent(ev: Record<string, unknown>): Record<string, unknown> | null {
  const rruleRaw = ev.rrule;
  if (typeof rruleRaw !== "string") return null;

  const start = ev.start;
  if (!start || !(start instanceof Date)) return null;

  const end = ev.end instanceof Date ? ev.end : null;
  const uid = typeof ev.uid === "string" && ev.uid.length > 0 ? ev.uid : "coerced-uid";
  const dateOnly = Boolean(ev.datetype === "date" || (start as { dateOnly?: boolean }).dateOnly);

  let dtstart: string;
  let dtend: string;
  if (dateOnly) {
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, "0");
    const d = String(start.getDate()).padStart(2, "0");
    dtstart = `DTSTART;VALUE=DATE:${y}${m}${d}`;
    const e = end ?? new Date(y, start.getMonth(), start.getDate() + 1);
    const ye = e.getFullYear();
    const me = String(e.getMonth() + 1).padStart(2, "0");
    const de = String(e.getDate()).padStart(2, "0");
    dtend = `DTEND;VALUE=DATE:${ye}${me}${de}`;
  } else {
    dtstart = `DTSTART:${formatUtcIcsDateTime(start)}`;
    const e = end ?? new Date(start.getTime() + 60 * 60 * 1000);
    dtend = `DTEND:${formatUtcIcsDateTime(e)}`;
  }

  const trimmed = rruleRaw.trim();
  const rruleLine = trimmed.startsWith("RRULE:") ? trimmed : `RRULE:${trimmed.replace(/^RRULE:/i, "")}`;

  const snippet = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//study-agent//ics-coerce//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid.replace(/[\r\n]/g, "")}`,
    dtstart,
    dtend,
    rruleLine,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  try {
    const data = parseICS(snippet) as Record<string, unknown>;
    const found = Object.values(data).find(
      (x): x is Record<string, unknown> =>
        Boolean(x && typeof x === "object" && (x as { type?: string }).type === "VEVENT"),
    );
    return found ?? null;
  } catch {
    return null;
  }
}

function expandOneEvent(
  raw: Record<string, unknown>,
  from: Date,
  to: Date,
): Array<{ start: Date; end: Date; summary?: unknown }> {
  let ev = raw;
  if (typeof ev.rrule === "string") {
    const coerced = tryCoerceStringRruleToParsedEvent(ev);
    if (coerced) ev = coerced;
  }

  try {
    const instances = expandRecurringEvent(ev as Parameters<typeof expandRecurringEvent>[0], {
      from,
      to,
      includeOverrides: true,
      excludeExdates: true,
      expandOngoing: true,
    });
    if (instances.length > 0) return instances;
  } catch {
    const coerced = tryCoerceStringRruleToParsedEvent(raw);
    if (coerced) {
      try {
        return expandRecurringEvent(coerced as Parameters<typeof expandRecurringEvent>[0], {
          from,
          to,
          includeOverrides: true,
          excludeExdates: true,
          expandOngoing: true,
        });
      } catch {
        /* fall through */
      }
    }
  }

  return [];
}

/** Expand RRULE/EXDATE/recurrence overrides into concrete instances for MongoDB storage and UI. */
export function expandIcsCalendarToOccurrences(icsText: string): ParsedIcsEvent[] {
  const data = parseICS(icsText) as Record<string, { type?: string; uid?: unknown; summary?: unknown; location?: unknown }>;

  const { from, to } = expansionWindow();

  const out: ParsedIcsEvent[] = [];

  for (const key of Object.keys(data)) {
    const ev = data[key] as Record<string, unknown> | null;
    if (!ev || ev.type !== "VEVENT") continue;

    const baseUid = typeof ev.uid === "string" && ev.uid.length > 0 ? ev.uid : key;
    const locationRaw = ev.location;
    const location =
      typeof locationRaw === "string" && locationRaw.trim().length > 0 ? locationRaw.trim() : null;

    const instances = expandOneEvent(ev, from, to);

    const summaryFallback =
      typeof ev.summary === "string" ? ev.summary.trim() : paramToString(ev.summary);

    for (const inst of instances) {
      const title =
        paramToString(inst.summary) ||
        summaryFallback ||
        "Event";
      const start = inst.start instanceof Date ? inst.start : new Date(inst.start);
      const end = inst.end instanceof Date ? inst.end : new Date(inst.end);
      out.push({
        uid: `${baseUid}:${start.getTime()}`,
        title,
        start,
        end,
        location,
      });
      if (out.length >= MAX_OCCURRENCES) break;
    }
    if (out.length >= MAX_OCCURRENCES) break;
  }

  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  return out;
}
