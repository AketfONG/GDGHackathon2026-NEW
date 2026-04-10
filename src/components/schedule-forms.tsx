"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/auth/client-token";

export function ScheduleForms() {
  const [status, setStatus] = useState("");

  async function createBlock(formData: FormData) {
    const payload = {
      title: String(formData.get("title") ?? ""),
      goalTag: String(formData.get("goalTag") ?? ""),
      dayOfWeek: Number(formData.get("dayOfWeek") ?? 1),
      startMinutes: Number(formData.get("startMinutes") ?? 540),
      endMinutes: Number(formData.get("endMinutes") ?? 600),
      nonSkippable: false,
    };
    const res = await fetch("/api/schedule/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? "Study block created." : "Failed to create study block.");
  }

  async function createObligation(formData: FormData) {
    const payload = {
      title: String(formData.get("o-title") ?? ""),
      dayOfWeek: Number(formData.get("o-dayOfWeek") ?? 1),
      startMinutes: Number(formData.get("o-startMinutes") ?? 480),
      endMinutes: Number(formData.get("o-endMinutes") ?? 540),
      nonSkippable: true,
    };
    const res = await fetch("/api/obligations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? "Obligation created." : "Failed to create obligation.");
  }

  async function submitAdherence(formData: FormData) {
    const payload = {
      plannedMinutes: Number(formData.get("plannedMinutes") ?? 120),
      actualMinutes: Number(formData.get("actualMinutes") ?? 90),
    };
    const res = await fetch("/api/schedule/adherence", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
      body: JSON.stringify(payload),
    });
    setStatus(res.ok ? "Adherence logged and drift evaluated." : "Failed to log adherence.");
  }

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <form action={createBlock} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">Add Study Block</h2>
        <input name="title" placeholder="Block title" className="mb-2 w-full rounded border border-slate-300 p-2 text-sm" />
        <input name="goalTag" placeholder="Goal tag (e.g. DSA)" className="mb-2 w-full rounded border border-slate-300 p-2 text-sm" />
        <input name="dayOfWeek" type="number" min="0" max="6" className="mb-2 w-full rounded border border-slate-300 p-2 text-sm" />
        <input name="startMinutes" type="number" className="mb-2 w-full rounded border border-slate-300 p-2 text-sm" />
        <input name="endMinutes" type="number" className="mb-3 w-full rounded border border-slate-300 p-2 text-sm" />
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">Create Block</button>
      </form>

      <form action={createObligation} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">Add Obligation</h2>
        <input name="o-title" placeholder="Obligation title" className="mb-2 w-full rounded border border-slate-300 p-2 text-sm" />
        <input name="o-dayOfWeek" type="number" min="0" max="6" className="mb-2 w-full rounded border border-slate-300 p-2 text-sm" />
        <input name="o-startMinutes" type="number" className="mb-2 w-full rounded border border-slate-300 p-2 text-sm" />
        <input name="o-endMinutes" type="number" className="mb-3 w-full rounded border border-slate-300 p-2 text-sm" />
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">Create Obligation</button>
      </form>

      <form action={submitAdherence} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">Log Adherence</h2>
        <input name="plannedMinutes" type="number" placeholder="Planned minutes" className="mb-2 w-full rounded border border-slate-300 p-2 text-sm" />
        <input name="actualMinutes" type="number" placeholder="Actual minutes" className="mb-3 w-full rounded border border-slate-300 p-2 text-sm" />
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">Submit</button>
      </form>

      {status ? <p className="md:col-span-3 text-sm text-slate-700">{status}</p> : null}
    </section>
  );
}
