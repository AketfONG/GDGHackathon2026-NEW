"use client";

import { useEffect, useState } from "react";
import type { AppDemoMode } from "@/lib/app-demo-mode";

/** Client mirror of cookie `study_agent_app_mode` via GET /api/preferences/app-mode */
export function useAppDemoMode() {
  const [mode, setMode] = useState<AppDemoMode>("live");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetch("/api/preferences/app-mode", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { mode?: AppDemoMode }) => {
        if (d.mode === "demo" || d.mode === "live") setMode(d.mode);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return {
    mode,
    isDemo: mode === "demo",
    loaded,
  };
}
