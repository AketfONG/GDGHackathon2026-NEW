"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/lib/auth/client-token";

export function DeleteColdQuizButton({
  quizId,
  quizTitle,
}: {
  quizId: string;
  quizTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete() {
    const ok = window.confirm(
      `Delete “${quizTitle}” from your account? All saved attempts for this quiz will be removed. This cannot be undone.`,
    );
    if (!ok) return;
    setBusy(true);
    setErr(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/quizzes/${encodeURIComponent(quizId)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...headers },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || res.statusText || "Could not delete quiz");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      {err ? (
        <p className="text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="inline-flex w-fit items-center justify-center rounded-full border-2 border-red-200 bg-white px-4 py-1.5 text-sm font-semibold text-red-800 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Deleting…" : "Delete quiz"}
      </button>
    </div>
  );
}
