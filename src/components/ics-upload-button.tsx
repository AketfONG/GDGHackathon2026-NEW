"use client";

import { useRef, useTransition } from "react";

type Props = {
  onFile: (file: File) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  /** Larger, high-contrast style for dashboard */
  variant?: "primary" | "compact";
};

export function IcsUploadButton({
  onFile,
  disabled,
  label = "Upload .ics file",
  variant = "primary",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const busy = Boolean(disabled) || pending;

  const base =
    variant === "primary"
      ? "w-full justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      : "w-full justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".ics,text/calendar,application/ics"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          startTransition(() => {
            void Promise.resolve(onFile(f));
          });
        }}
      />
      <button
        type="button"
        className={`inline-flex items-center ${base}`}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Working…" : label}
      </button>
      <span className="text-center text-[11px] text-slate-500 sm:text-left">.ics from Google, Apple, or Outlook</span>
    </div>
  );
}
