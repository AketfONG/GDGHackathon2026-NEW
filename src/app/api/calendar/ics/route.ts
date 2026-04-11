import { NextRequest, NextResponse } from "next/server";
import { getDemoModeFromCookieStore, isPresetDemoContentEnabled } from "@/lib/app-demo-mode";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { verifyRequestToken } from "@/lib/auth/verify-token";
import { connectToDatabase } from "@/lib/mongodb";
import { CalendarImportModel } from "@/models/CalendarImport";
import { mergeCalendarImportWithDemo, type CalendarImportJson } from "@/lib/impromptu-demo-calendar";
import { expandIcsCalendarToOccurrences } from "@/lib/parse-ics";

const MAX_BYTES = 2 * 1024 * 1024;

export async function GET(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;
  await connectToDatabase();

  const doc = await CalendarImportModel.findOne({ userId: auth.user._id }).lean();

  const demo = isPresetDemoContentEnabled(getDemoModeFromCookieStore(req.cookies));

  const userImport: CalendarImportJson | null = doc
    ? {
        fileName: doc.fileName,
        importedAt: (doc.importedAt instanceof Date ? doc.importedAt : new Date(doc.importedAt)).toISOString(),
        events: doc.events.map(
          (e: { uid: string; title: string; start: Date; end: Date; location: string | null }) => ({
            uid: e.uid,
            title: e.title,
            start: e.start.toISOString(),
            end: e.end.toISOString(),
            location: e.location,
          }),
        ),
      }
    : null;

  const merged = mergeCalendarImportWithDemo(userImport, demo);
  return NextResponse.json({ import: merged });
}

export async function POST(req: NextRequest) {
  if (isBackendDisabled()) return backendDisabledResponse();
  const auth = await verifyRequestToken(req);
  if (!auth.ok) return auth.response;

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field "file"' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 2 MB)" }, { status: 400 });
  }

  const name = file.name || "calendar.ics";
  if (!name.toLowerCase().endsWith(".ics") && file.type !== "text/calendar") {
    return NextResponse.json({ error: "Please upload an .ics file" }, { status: 400 });
  }

  const text = await file.text();
  let events;
  try {
    events = expandIcsCalendarToOccurrences(text);
  } catch {
    return NextResponse.json({ error: "Could not parse ICS file" }, { status: 400 });
  }

  if (events.length === 0) {
    return NextResponse.json({ error: "No events found in this calendar" }, { status: 400 });
  }

  await connectToDatabase();
  await CalendarImportModel.findOneAndUpdate(
    { userId: auth.user._id },
    {
      userId: auth.user._id,
      fileName: name,
      importedAt: new Date(),
      events: events.map((e) => ({
        uid: e.uid,
        title: e.title,
        start: e.start,
        end: e.end,
        location: e.location,
      })),
    },
    { upsert: true, new: true },
  );

  return NextResponse.json({
    ok: true,
    count: events.length,
    fileName: name,
  });
}
