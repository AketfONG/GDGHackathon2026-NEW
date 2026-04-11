"use client";

import { IcsUploadButton } from "@/components/ics-upload-button";
import { useCalendarIcsUpload } from "@/hooks/use-calendar-ics-upload";

type Props = {
  calendarStorageReady: boolean;
};

/** Visible import strip at the top of the dashboard (same API as Calendar & quizzes below). */
export function DashboardCalendarImportBar({ calendarStorageReady }: Props) {
  const { uploadCalendarIcs, pending, message } = useCalendarIcsUpload();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900">Import calendar</p>
        <p className="text-xs text-slate-600">
          Upload an <code className="rounded bg-slate-100 px-1">.ics</code> file (Google, Apple, Outlook). Recurring events are expanded into
          individual dates. In live mode, each new import replaces your previously stored calendar.
        </p>
      </div>
      <div className="flex min-w-[12rem] flex-col gap-1 sm:items-end">
        <IcsUploadButton
          variant="primary"
          disabled={pending || !calendarStorageReady}
          label="Choose .ics file"
          onFile={(file) => uploadCalendarIcs(file, calendarStorageReady)}
        />
        {message ? (
          <p
            className={`max-w-md text-right text-xs ${message.kind === "ok" ? "text-emerald-800" : "text-rose-700"}`}
            role="status"
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
