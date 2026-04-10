import { ensureDemoUser } from "@/lib/demo-user";
import { TopNav } from "@/components/top-nav";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { InterventionActionModel } from "@/models/InterventionAction";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

export default async function InterventionsPage() {
  let dbOffline = isBackendDisabled();
  let rows: Awaited<ReturnType<typeof InterventionActionModel.find>> = [];

  if (!dbOffline) {
    try {
      await connectToDatabase();
      const user = await ensureDemoUser();
      const userId = new Types.ObjectId(String(user._id));
      rows = await InterventionActionModel.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
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
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Intervention Timeline</h1>
        {dbOffline ? <DbOfflineNotice /> : null}
        {!dbOffline ? (
          <ul className="mt-4 space-y-2">
            {rows.map((row) => (
              <li key={String(row._id)} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium">{row.type}</p>
                <p className="text-sm text-slate-600">{row.message}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}</p>
              </li>
            ))}
            {rows.length === 0 ? <li className="text-slate-600">No interventions yet.</li> : null}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
