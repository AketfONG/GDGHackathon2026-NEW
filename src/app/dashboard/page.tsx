import { cookies } from "next/headers";
import { ensureDemoUser } from "@/lib/demo-user";
import { getDemoModeFromCookieStore, isPresetDemoContentEnabled } from "@/lib/app-demo-mode";
import { mergeCalendarImportWithDemo, type CalendarImportJson } from "@/lib/impromptu-demo-calendar";
import { TopNav } from "@/components/top-nav";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { DashboardCalendarImportBar } from "@/components/dashboard-calendar-import-bar";
import { DashboardCalendarAndQuizzes } from "@/components/dashboard-calendar-quizzes";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { CalendarImportModel } from "@/models/CalendarImport";
import { DriftAssessmentModel } from "@/models/DriftAssessment";
import { QuizAttemptModel } from "@/models/QuizAttempt";
import { InterventionActionModel } from "@/models/InterventionAction";
import { ScheduleAdherenceModel } from "@/models/ScheduleAdherence";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const appMode = getDemoModeFromCookieStore(cookieStore);

  let dbOffline = isBackendDisabled();
  let latestAssessment: Awaited<ReturnType<typeof DriftAssessmentModel.findOne>> = null;
  let attempts: Awaited<ReturnType<typeof QuizAttemptModel.find>> = [];
  let interventions: Awaited<ReturnType<typeof InterventionActionModel.find>> = [];
  let adherence: Awaited<ReturnType<typeof ScheduleAdherenceModel.findOne>> = null;
  let calendarImport: Awaited<ReturnType<typeof CalendarImportModel.findOne>> = null;

  if (!dbOffline) {
    try {
      await connectToDatabase();
      const user = await ensureDemoUser();
      const userId = new Types.ObjectId(String(user._id));
      [latestAssessment, attempts, interventions, adherence, calendarImport] = await Promise.all([
        DriftAssessmentModel.findOne({ userId }).sort({ assessedAt: -1 }).lean(),
        QuizAttemptModel.find({ userId })
          .sort({ submittedAt: -1 })
          .limit(15)
          .populate("quizId", "title")
          .lean(),
        InterventionActionModel.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
        ScheduleAdherenceModel.findOne({ userId }).sort({ createdAt: -1 }).lean(),
        CalendarImportModel.findOne({ userId }).lean(),
      ]);
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        dbOffline = true;
      } else {
        throw error;
      }
    }
  }

  const avgAttempts = attempts.slice(0, 5);
  const avgScore =
    avgAttempts.length === 0
      ? 0
      : Math.round((avgAttempts.reduce((acc, curr) => acc + curr.score, 0) / avgAttempts.length) * 100);
  const reasonList = Array.isArray(latestAssessment?.reasons)
    ? (latestAssessment.reasons as string[])
    : [];

  const quizAttemptViews = attempts.map((a) => {
    const quiz = a.quizId as { title?: string } | Types.ObjectId | undefined;
    const title =
      quiz && typeof quiz === "object" && "title" in quiz && typeof quiz.title === "string"
        ? quiz.title
        : "Quiz";
    return {
      id: String(a._id),
      title,
      submittedAt: (a.submittedAt instanceof Date ? a.submittedAt : new Date(a.submittedAt)).toISOString(),
      scorePct: Math.round(Number(a.score) * 100),
    };
  });

  const userImportJson: CalendarImportJson | null = calendarImport
    ? {
        fileName: calendarImport.fileName,
        importedAt: (
          calendarImport.importedAt instanceof Date
            ? calendarImport.importedAt
            : new Date(calendarImport.importedAt)
        ).toISOString(),
        events: calendarImport.events.map(
          (e: { uid: string; title: string; start: Date; end: Date; location: string | null | undefined }) => ({
            uid: e.uid,
            title: e.title,
            start: (e.start instanceof Date ? e.start : new Date(e.start)).toISOString(),
            end: (e.end instanceof Date ? e.end : new Date(e.end)).toISOString(),
            location: e.location ?? null,
          }),
        ),
      }
    : null;

  const calendarImportProps = mergeCalendarImportWithDemo(userImportJson, isPresetDemoContentEnabled(appMode));

  const calendarStorageReady = !dbOffline;

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>
        <DashboardCalendarImportBar calendarStorageReady={calendarStorageReady} />
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
                {reasonList.length > 0 ? (
                  reasonList.map((reason) => (
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
                  <li key={String(item._id)} className="rounded border border-slate-200 bg-slate-50 p-2 text-sm">
                    <p className="font-medium">{item.type}</p>
                    <p className="text-slate-600">{item.message}</p>
                  </li>
                ))}
                {interventions.length === 0 ? <li className="text-slate-600">No interventions yet.</li> : null}
              </ul>
            </section>
          </>
        ) : null}

        <DashboardCalendarAndQuizzes
          initialImport={calendarImportProps}
          quizAttempts={quizAttemptViews}
          calendarStorageReady={calendarStorageReady}
        />
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
