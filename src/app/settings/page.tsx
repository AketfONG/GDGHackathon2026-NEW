import { TopNav } from "@/components/top-nav";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-semibold text-slate-900">User Settings</h1>
          <p className="mt-2 text-slate-600">
            Manage your account preferences and study-agent settings here.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Profile settings placeholder
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Notification settings placeholder
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Privacy settings placeholder
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
