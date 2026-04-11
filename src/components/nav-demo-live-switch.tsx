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
        className="nav-demo-live-shell"
        title="Switch between demo sample content and live data"
      >
        <span id="nav-app-mode-label" className="nav-demo-live-shell__label">
          Mode
        </span>
        <div
          role="group"
          aria-labelledby="nav-app-mode-label"
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
      </div>
      <style>{`
        .nav-demo-live-shell {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          padding: 6px 8px 6px 12px;
          border-radius: 9999px;
          border: 1px solid #cbd5e1;
          background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.85),
            0 0 0 1px rgba(226, 232, 240, 0.95);
        }
        .nav-demo-live-shell__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          user-select: none;
        }
        @media (max-width: 639px) {
          .nav-demo-live-shell__label {
            display: none;
          }
          .nav-demo-live-shell {
            padding-left: 8px;
          }
        }
        .nav-demo-live-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding: 4px 6px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.65);
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
