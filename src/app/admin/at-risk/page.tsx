import { TopNav } from "@/components/top-nav";
import { DbOfflineNotice } from "@/components/db-offline-notice";
import { isDatabaseUnavailableError } from "@/lib/db-health";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { DriftAssessmentModel } from "@/models/DriftAssessment";
import { UserModel } from "@/models/User";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";

export default async function AtRiskAdminPage() {
  let dbOffline = isBackendDisabled();
  let rows: Array<{
    id: string;
    user: { name: string; email: string };
    riskLevel: string;
    riskScore: number;
    assessedAt: Date;
  }> = [];

  if (!dbOffline) {
    try {
      await connectToDatabase();
      const assessments = await DriftAssessmentModel.find({})
        .sort({ assessedAt: -1 })
        .limit(100)
        .lean();
      const userIds = Array.from(new Set(assessments.map((a) => String(a.userId))));
      const users = await UserModel.find({
        _id: { $in: userIds.map((id) => new Types.ObjectId(id)) },
      })
        .lean()
        .then((items) => new Map(items.map((u) => [String(u._id), u])));

      const latestByUser = new Map<string, (typeof assessments)[number]>();
      for (const item of assessments) {
        const userId = String(item.userId);
        if (!latestByUser.has(userId) && item.riskLevel !== "LOW") {
          latestByUser.set(userId, item);
        }
      }

      rows = Array.from(latestByUser.values())
        .sort((a, b) => b.riskScore - a.riskScore)
        .map((item) => ({
          id: String(item._id),
          user: {
            name: users.get(String(item.userId))?.name ?? "Unknown",
            email: users.get(String(item.userId))?.email ?? "Unknown",
          },
          riskLevel: item.riskLevel,
          riskScore: item.riskScore,
          assessedAt: item.assessedAt,
        }));
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
        <h1 className="text-2xl font-semibold">Admin: At-Risk Students</h1>
        {dbOffline ? <DbOfflineNotice /> : null}
        {!dbOffline ? (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-100">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Risk</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200">
                    <td className="px-3 py-2">{row.user.name}</td>
                    <td className="px-3 py-2">{row.user.email}</td>
                    <td className="px-3 py-2">{row.riskLevel}</td>
                    <td className="px-3 py-2">{row.riskScore}</td>
                    <td className="px-3 py-2">{new Date(row.assessedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      No high or medium risk students yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </main>
    </div>
  );
}
