"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_USER_SETTINGS,
  USER_SETTINGS_CHANGED_EVENT,
  loadUserSettings,
  patchUserSettings,
  type UserSettingsV1,
} from "@/lib/user-settings";

export function useUserSettings(): readonly [
  UserSettingsV1,
  (patch: Partial<UserSettingsV1>) => void,
] {
  const [settings, setSettings] = useState<UserSettingsV1>(DEFAULT_USER_SETTINGS);

  useEffect(() => {
    setSettings(loadUserSettings());
    const onChange = () => setSettings(loadUserSettings());
    window.addEventListener(USER_SETTINGS_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(USER_SETTINGS_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const patch = useCallback((p: Partial<UserSettingsV1>) => {
    const next = patchUserSettings(p);
    setSettings(next);
  }, []);

  return [settings, patch] as const;
}
