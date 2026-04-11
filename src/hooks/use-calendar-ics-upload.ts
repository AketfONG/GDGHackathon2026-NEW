"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatIcsUploadSuccessMessage } from "@/lib/ics-upload-message";

export function useCalendarIcsUpload() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function uploadCalendarIcs(file: File, calendarStorageReady: boolean) {
    if (!calendarStorageReady) return;
    setMessage(null);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await fetch("/api/calendar/ics", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        count?: number;
        backendDisabled?: boolean;
        message?: string;
        replacedPrevious?: boolean;
      };
      if (!res.ok) {
        const err =
          data.backendDisabled && data.message
            ? data.message
            : data.error ?? "Upload failed (is the database running?)";
        setMessage({ kind: "err", text: err });
        return;
      }
      setMessage({
        kind: "ok",
        text: formatIcsUploadSuccessMessage(data.count ?? 0, Boolean(data.replacedPrevious)),
      });
      router.refresh();
    });
  }

  return { uploadCalendarIcs, pending, message, setMessage };
}
