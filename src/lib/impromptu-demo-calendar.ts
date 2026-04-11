import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expandIcsCalendarToOccurrences } from "@/lib/parse-ics";

export type CalendarEventJson = {
  uid: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
};

export type CalendarImportJson = {
  fileName: string;
  importedAt: string;
  events: CalendarEventJson[];
};

let impromptuCache: CalendarImportJson | null = null;

/** Expanded occurrences from bundled `ImpromptuDemo.ics` (HKUST-style timetable). */
export function getImpromptuDemoCalendarImport(): CalendarImportJson {
  if (impromptuCache) return impromptuCache;
  const path = join(process.cwd(), "src/lib/data/impromptu-demo.ics");
  const text = readFileSync(path, "utf8");
  const occurrences = expandIcsCalendarToOccurrences(text);
  impromptuCache = {
    fileName: "ImpromptuDemo.ics",
    importedAt: new Date().toISOString(),
    events: occurrences.map((e) => ({
      uid: e.uid,
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      location: e.location,
    })),
  };
  return impromptuCache;
}

function eventKey(e: CalendarEventJson): string {
  return `${e.uid}\t${e.start}`;
}

/**
 * In demo mode, user-uploaded events are merged with the Impromptu demo timetable (deduped).
 * In live mode, pass `demoMode: false` and only the user import is returned.
 */
export function mergeCalendarImportWithDemo(
  userImport: CalendarImportJson | null,
  demoMode: boolean,
): CalendarImportJson | null {
  if (!demoMode) {
    return userImport;
  }

  const demo = getImpromptuDemoCalendarImport();
  if (!userImport?.events.length) {
    return { ...demo };
  }

  const seen = new Set<string>();
  const merged: CalendarEventJson[] = [];

  for (const e of userImport.events) {
    const k = eventKey(e);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(e);
  }
  for (const e of demo.events) {
    const k = eventKey(e);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(e);
  }

  merged.sort((a, b) => a.start.localeCompare(b.start));

  return {
    fileName: `${userImport.fileName} + ${demo.fileName}`,
    importedAt: userImport.importedAt,
    events: merged,
  };
}
