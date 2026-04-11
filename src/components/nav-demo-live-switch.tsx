"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { AppDemoMode } from "@/lib/app-demo-mode";

/**
 * Demo / Live control — matches header nav links (pill, weight 500) with red / green active states.
 */
export function NavDemoLiveSwitch() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<AppDemoMode>("live");

  const refreshMode = useCallback(() => {
    void fetch("/api/preferences/app-mode", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { mode?: AppDemoMode }) => {
        if (d.mode === "demo" || d.mode === "live") setMode(d.mode);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshMode();
  }, [refreshMode]);

  function setAppMode(next: AppDemoMode) {
    startTransition(async () => {
      const res = await fetch("/api/preferences/app-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { mode?: AppDemoMode };
      if (data.mode === "demo" || data.mode === "live") setMode(data.mode);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("study-agent-app-mode"));
      }
      router.refresh();
    });
  }

  const isDemo = mode === "demo";
  const busy = pending;

  return (
    <>
      <div
        role="group"
        aria-label="App mode: demo or live"
        aria-busy={busy}
        className="nav-demo-live-group"
      >
        <button
          type="button"
          className="nav-demo-live-btn nav-demo-live-btn--demo"
          data-active={isDemo}
          disabled={busy || isDemo}
          onClick={() => setAppMode("demo")}
          title="Demo: presets, demo calendar overlay, placeholder content"
        >
          Demo
        </button>
        <button
          type="button"
          className="nav-demo-live-btn nav-demo-live-btn--live"
          data-active={!isDemo}
          disabled={busy || !isDemo}
          onClick={() => setAppMode("live")}
          title="Live: your data only"
        >
          Live
        </button>
      </div>
      <style>{`
        .nav-demo-live-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .nav-demo-live-group[aria-busy="true"] {
          opacity: 0.65;
          pointer-events: none;
        }
        .nav-demo-live-btn {
          border: none;
          font-weight: 500;
          padding: 12px 20px;
          border-radius: 9999px;
          font-size: 16px;
          transition: color 0.2s, background 0.2s;
          cursor: pointer;
        }
        .nav-demo-live-btn:disabled {
          cursor: not-allowed;
        }
        /* Inactive: same gray as .header-nav-link default */
        .nav-demo-live-btn--demo[data-active="false"] {
          color: #4b5563;
          background-color: transparent;
        }
        .nav-demo-live-btn--demo[data-active="false"]:hover:not(:disabled) {
          background-color: rgba(220, 38, 38, 0.15);
          color: #dc2626;
        }
        /* Active demo: red (parallel to blue nav active) */
        .nav-demo-live-btn--demo[data-active="true"] {
          color: #dc2626;
          background-color: rgba(220, 38, 38, 0.2);
        }
        .nav-demo-live-btn--live[data-active="false"] {
          color: #4b5563;
          background-color: transparent;
        }
        .nav-demo-live-btn--live[data-active="false"]:hover:not(:disabled) {
          background-color: rgba(5, 150, 105, 0.15);
          color: #059669;
        }
        .nav-demo-live-btn--live[data-active="true"] {
          color: #059669;
          background-color: rgba(5, 150, 105, 0.2);
        }
      `}</style>
    </>
  );
}
