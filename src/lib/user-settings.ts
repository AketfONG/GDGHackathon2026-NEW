export const USER_SETTINGS_STORAGE_KEY = "study-app-user-settings";
export const USER_SETTINGS_CHANGED_EVENT = "study-app-user-settings-changed";

export type ExplanationTiming = "after_submit" | "after_each";

export type UserSettingsV1 = {
  version: 1;
  shuffleQuestionOrder: boolean;
  shuffleAnswerChoices: boolean;
  explanationTiming: ExplanationTiming;
  /** 0 = Sunday, 1 = Monday (mini calendar on home dashboard). */
  calendarWeekStartsOn: 0 | 1;
  reducedMotion: boolean;
  rememberUploadSelections: boolean;
  uploadLastCourseId: string | null;
  uploadLastWeekId: string | null;
};

export const DEFAULT_USER_SETTINGS: UserSettingsV1 = {
  version: 1,
  shuffleQuestionOrder: false,
  shuffleAnswerChoices: false,
  explanationTiming: "after_submit",
  calendarWeekStartsOn: 0,
  reducedMotion: false,
  rememberUploadSelections: true,
  uploadLastCourseId: null,
  uploadLastWeekId: null,
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseUserSettings(raw: string | null): UserSettingsV1 {
  if (!raw) return { ...DEFAULT_USER_SETTINGS };
  try {
    const v = JSON.parse(raw) as unknown;
    if (!isRecord(v) || v.version !== 1) return { ...DEFAULT_USER_SETTINGS };
    return {
      ...DEFAULT_USER_SETTINGS,
      shuffleQuestionOrder: Boolean(v.shuffleQuestionOrder),
      shuffleAnswerChoices: Boolean(v.shuffleAnswerChoices),
      explanationTiming:
        v.explanationTiming === "after_each" ? "after_each" : "after_submit",
      calendarWeekStartsOn: v.calendarWeekStartsOn === 1 ? 1 : 0,
      reducedMotion: Boolean(v.reducedMotion),
      rememberUploadSelections: v.rememberUploadSelections !== false,
      uploadLastCourseId:
        typeof v.uploadLastCourseId === "string" ? v.uploadLastCourseId : null,
      uploadLastWeekId: typeof v.uploadLastWeekId === "string" ? v.uploadLastWeekId : null,
    };
  } catch {
    return { ...DEFAULT_USER_SETTINGS };
  }
}

export function loadUserSettings(): UserSettingsV1 {
  if (typeof window === "undefined") return { ...DEFAULT_USER_SETTINGS };
  return parseUserSettings(localStorage.getItem(USER_SETTINGS_STORAGE_KEY));
}

export function saveUserSettings(next: UserSettingsV1): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(USER_SETTINGS_CHANGED_EVENT));
}

export function patchUserSettings(patch: Partial<UserSettingsV1>): UserSettingsV1 {
  const merged: UserSettingsV1 = { ...loadUserSettings(), ...patch, version: 1 };
  saveUserSettings(merged);
  return merged;
}
