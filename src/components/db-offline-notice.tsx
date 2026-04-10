export function DbOfflineNotice() {
  return (
    <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <h2 className="text-lg font-semibold text-amber-900">Backend disabled / database unavailable</h2>
      <p className="mt-1 text-sm text-amber-800">
        Prototype mode is active or PostgreSQL is not reachable. Backend-driven features are intentionally unavailable.
      </p>
      <pre className="mt-3 overflow-x-auto rounded border border-amber-200 bg-white p-3 text-xs text-slate-800">
        npm run db:setup
      </pre>
      <p className="mt-2 text-xs text-amber-700">
        If you use your own DB, set <code>DATABASE_URL</code>, then run <code>npm run db:push</code>.
      </p>
    </section>
  );
}
