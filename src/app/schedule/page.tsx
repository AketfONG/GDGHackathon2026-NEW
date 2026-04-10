import { ensureDemoUser } from "@/lib/demo-user";
import { TopNav } from "@/components/top-nav";
import { ScheduleForms } from "@/components/schedule-forms";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { TimetableBlockModel } from "@/models/TimetableBlock";
import { ObligationModel } from "@/models/Obligation";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  let dbOffline = isBackendDisabled();
  let blocks: Awaited<ReturnType<typeof TimetableBlockModel.find>> = [];
  let obligations: Awaited<ReturnType<typeof ObligationModel.find>> = [];

  if (!dbOffline) {
    try {
      await connectToDatabase();
      const user = await ensureDemoUser();
      const userId = new Types.ObjectId(String(user._id));
      [blocks, obligations] = await Promise.all([
        TimetableBlockModel.find({ userId }).sort({ dayOfWeek: 1, startMinutes: 1 }).lean(),
        ObligationModel.find({ userId }).sort({ dayOfWeek: 1, startMinutes: 1 }).lean(),
      ]);

    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        dbOffline = true;
      } else {
        throw error;
      }
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Timetable and Obligations</h1>
        {dbOffline ? <DbOfflineNotice /> : null}
        {!dbOffline ? (
          <>
            <ScheduleForms />
            <section className="grid gap-4 md:grid-cols-2">
              <ListCard
                title="Study Blocks"
                rows={blocks.map((b) => `${day(b.dayOfWeek)} ${fmt(b.startMinutes)}-${fmt(b.endMinutes)} · ${b.title}`)}
              />
              <ListCard
                title="Non-skippable Obligations"
                rows={obligations.map((o) => `${day(o.dayOfWeek)} ${fmt(o.startMinutes)}-${fmt(o.endMinutes)} · ${o.title}`)}
              />
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function ListCard({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {rows.map((r, idx) => (
          <li key={`${title}-${idx}`} className="rounded border border-slate-200 bg-slate-50 p-2">
            {r}
          </li>
        ))}
        {rows.length === 0 ? <li className="text-slate-500">No entries yet.</li> : null}
      </ul>
    </section>
  );
}

function day(value: number) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][value] ?? "N/A";
}

function fmt(totalMins: number) {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
