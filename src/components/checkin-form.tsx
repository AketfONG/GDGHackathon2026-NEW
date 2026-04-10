"use client";

import { useState } from "react";

export function CheckInForm() {
  const [status, setStatus] = useState("");

  async function submit(formData: FormData) {
    const payload = {
      focusLevel: Number(formData.get("focusLevel") ?? 3),
      mood: Number(formData.get("mood") ?? 3),
      confidence: Number(formData.get("confidence") ?? 3),
      note: String(formData.get("note") ?? ""),
    };
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("Failed to submit check-in.");
      return;
    }
    setStatus(
      `Saved. Risk: ${data.assessment?.riskLevel ?? "N/A"} (${data.assessment?.riskScore ?? 0})`,
    );
  }

  return (
    <form action={submit} className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <label className="mb-2 block text-sm">
        Focus level (1-5)
        <input name="focusLevel" type="number" min="1" max="5" defaultValue={3} className="mt-1 w-full rounded border border-slate-300 p-2" />
      </label>
      <label className="mb-2 block text-sm">
        Mood (1-5)
        <input name="mood" type="number" min="1" max="5" defaultValue={3} className="mt-1 w-full rounded border border-slate-300 p-2" />
      </label>
      <label className="mb-2 block text-sm">
        Confidence (1-5)
        <input name="confidence" type="number" min="1" max="5" defaultValue={3} className="mt-1 w-full rounded border border-slate-300 p-2" />
      </label>
      <label className="mb-3 block text-sm">
        Note
        <textarea name="note" rows={3} className="mt-1 w-full rounded border border-slate-300 p-2" />
      </label>
      <button className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">Submit Check-in</button>
      {status ? <p className="mt-2 text-sm text-slate-700">{status}</p> : null}
    </form>
  );
}
