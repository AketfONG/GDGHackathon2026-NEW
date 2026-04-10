const DEMO_EMAIL = "student@gdghack.local";
const DEMO_FIREBASE_UID = "demo-firebase-uid";

/** Everyone not logged in resolves to the same Mongo user — do not grant access from ownerUserId alone. */
export function isSharedDemoUser(user: {
  email?: string | null;
  firebaseUid?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  return (
    String(user.email ?? "").toLowerCase() === DEMO_EMAIL ||
    String(user.firebaseUid ?? "") === DEMO_FIREBASE_UID
  );
}

/**
 * Upload-created quizzes: real accounts match ownerUserId; every browser matches quizClientScope.
 * Demo Mongo user is shared, so scope is required for “not logged in” flows.
 */
export function viewerCanAccessQuiz(
  quiz: {
    ownerUserId?: unknown;
    quizClientScope?: string | null;
  },
  viewer: { userId?: unknown; scope?: string | null; viewerIsDemo: boolean },
): boolean {
  const qOwner = quiz.ownerUserId != null ? String(quiz.ownerUserId) : "";
  const qScope = quiz.quizClientScope?.trim() ?? "";
  const uId = viewer.userId != null ? String(viewer.userId) : "";
  const scope = viewer.scope?.trim() ?? "";
  if (!viewer.viewerIsDemo && qOwner && uId && qOwner === uId) return true;
  if (qScope && scope && qScope === scope) return true;
  return false;
}
