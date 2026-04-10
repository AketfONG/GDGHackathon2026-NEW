"use client";

import { useEffect } from "react";
import { useUserSettings } from "@/hooks/use-user-settings";

/** Applies accessibility-related settings to the document root. */
export function SettingsSync() {
  const [settings] = useUserSettings();

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = settings.reducedMotion ? "true" : "false";
  }, [settings.reducedMotion]);

  return null;
}
