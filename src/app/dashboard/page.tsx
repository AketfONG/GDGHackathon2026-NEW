import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo-user";
import { TopNav } from "@/components/top-nav";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let dbOffline = isBackendDisabled();
  let latestAssessment: Awaited<ReturnType<typeof db.driftAssessment.findFirst>> = null;
  let attempts: Awaited<ReturnType<typeof db.quizAttempt.findMany>> = [];
  let interventions: Awaited<ReturnType<typeof db.interventionAction.findMany>> = [];
  let adherence: Awaited<ReturnType<typeof db.scheduleAdherence.findFirst>> = null;

  if (!dbOffline) {
    try {
    const user = await ensureDemoUser();
    [latestAssessment, attempts, interventions, adherence] = await Promise.all([
      db.driftAssessment.findFirst({ where: { userId: user.id }, orderBy: { assessedAt: "desc" } }),
      db.quizAttempt.findMany({ where: { userId: user.id }, orderBy: { submittedAt: "desc" }, take: 5 }),
      db.interventionAction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
      db.scheduleAdherence.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    ]);
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        dbOffline = true;
      } else {
        throw error;
      }
    }
  }

  const avgScore =
    attempts.length === 0
      ? 0
      : Math.round((attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length) * 100);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>
        {dbOffline ? <DbOfflineNotice /> : null}
        {!dbOffline ? (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              <Card title="Risk Level" value={latestAssessment?.riskLevel ?? "N/A"} />
              <Card title="Risk Score" value={String(latestAssessment?.riskScore ?? 0)} />
              <Card title="Avg Quiz Score" value={`${avgScore}%`} />
              <Card title="Schedule Adherence" value={`${Math.round((adherence?.adherenceScore ?? 1) * 100)}%`} />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="font-semibold">Latest Risk Reasons</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.isArray(latestAssessment?.reasons) && latestAssessment.reasons.length > 0 ? (
                  latestAssessment.reasons.map((reason) => (
                    <span key={String(reason)} className="rounded border border-slate-300 bg-slate-100 px-2 py-1 text-sm">
                      {String(reason)}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-600">No risk reasons yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="font-semibold">Recent Interventions</h2>
              <ul className="mt-2 space-y-2">
                {interventions.map((item) => (
                  <li key={item.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-sm">
                    <p className="font-medium">{item.type}</p>
                    <p className="text-slate-600">{item.message}</p>
                  </li>
                ))}
                {interventions.length === 0 ? <li className="text-slate-600">No interventions yet.</li> : null}
              </ul>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
