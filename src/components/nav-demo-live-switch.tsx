"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { AppDemoMode } from "@/lib/app-demo-mode";

/**
 * Demo / Live segmented control — same outer size as Login (16px font, 12px vertical padding, pill).
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
        window.dispatchEvent(new CustomEvent("impromptu-app-mode"));
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
        title="Switch between demo sample content and live data"
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
        /* Match TopNav Login height; equal-width segments via grid */
        .nav-demo-live-group {
          display: inline-grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          width: 12.5rem;
          align-items: stretch;
          flex-shrink: 0;
          border: 2px solid #d1d5db;
          border-radius: 9999px;
          background: #fff;
          box-sizing: border-box;
          overflow: hidden;
        }
        .nav-demo-live-group[aria-busy="true"] {
          opacity: 0.65;
          pointer-events: none;
        }
        .nav-demo-live-btn {
          border: none;
          font-weight: 600;
          font-size: 16px;
          line-height: 1.25;
          padding: 12px 10px;
          margin: 0;
          text-align: center;
          width: 100%;
          min-width: 0;
          transition: color 0.2s, background 0.2s;
          cursor: pointer;
          box-sizing: border-box;
        }
        .nav-demo-live-btn:disabled {
          cursor: not-allowed;
        }
        .nav-demo-live-btn--demo[data-active="false"] {
          color: #4b5563;
          background-color: #f8fafc;
        }
        .nav-demo-live-btn--demo[data-active="false"]:hover:not(:disabled) {
          background-color: rgba(220, 38, 38, 0.12);
          color: #dc2626;
        }
        .nav-demo-live-btn--demo[data-active="true"] {
          color: #dc2626;
          background-color: rgba(220, 38, 38, 0.18);
        }
        .nav-demo-live-btn--live[data-active="false"] {
          color: #4b5563;
          background-color: #f8fafc;
        }
        .nav-demo-live-btn--live[data-active="false"]:hover:not(:disabled) {
          background-color: rgba(5, 150, 105, 0.12);
          color: #059669;
        }
        .nav-demo-live-btn--live[data-active="true"] {
          color: #059669;
          background-color: rgba(5, 150, 105, 0.18);
        }
        .nav-demo-live-btn--live {
          border-left: 1px solid #e2e8f0;
        }
      `}</style>
    </>
  );
}
