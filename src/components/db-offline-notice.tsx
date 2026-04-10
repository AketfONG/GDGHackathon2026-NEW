type Props = {
  /** Last driver error message (safe to show; does not include the password). */
  detail?: string;
};

export function DbOfflineNotice({ detail }: Props) {
  return (
    <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <h2 className="text-lg font-semibold text-amber-900">
        Backend disabled / database unavailable
      </h2>
      <p className="mt-1 text-sm text-amber-800">
        Backend is disabled or MongoDB authentication/connection failed.
      </p>
      {detail ? (
        <pre className="mt-3 overflow-x-auto rounded border border-amber-200 bg-white p-3 text-xs text-slate-800 whitespace-pre-wrap">
          {detail}
        </pre>
      ) : null}
      <pre className="mt-3 overflow-x-auto rounded border border-amber-200 bg-white p-3 text-xs text-slate-800">
        Check MONGODB_URI in .env.local and restart npm run dev
      </pre>
      <p className="mt-2 text-xs text-amber-700">
        In Atlas: Database → Database Users — username and password must match the URI. Special
        characters in the password must be URL-encoded in the connection string.
      </p>
    </section>
  );
}
