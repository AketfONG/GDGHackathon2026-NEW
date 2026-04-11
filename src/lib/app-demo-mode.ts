/** HttpOnly-safe cookie: `demo` = show preset/placeholder content; `live` = real product only. */
export const APP_DEMO_MODE_COOKIE = "impromptu_app_mode";

export type AppDemoMode = "demo" | "live";

/** Default when cookie is missing: live (no preset quizzes or placeholders). */
export function parseDemoModeCookie(value: string | undefined): AppDemoMode {
  return value === "demo" ? "demo" : "live";
}

export function getDemoModeFromCookieStore(store: {
  get(name: string): { value: string } | undefined;
}): AppDemoMode {
  return parseDemoModeCookie(store.get(APP_DEMO_MODE_COOKIE)?.value);
}

export function isPresetDemoContentEnabled(mode: AppDemoMode): boolean {
  return mode === "demo";
}
