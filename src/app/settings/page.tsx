"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { TopNav } from "@/components/top-nav";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { firebaseAuth } from "@/lib/firebase/client";
import { useUserSettings } from "@/hooks/use-user-settings";

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 pr-2">
        <label htmlFor={id} className="text-sm font-semibold text-slate-900">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-slate-600">{description}</p>
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function AccountCard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, setUser);
  }, []);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Account</h2>
      <p className="mt-1 text-sm text-slate-600">
        Google sign-in links quiz attempts and uploaded cold tests to your profile when the backend is enabled.
      </p>
      <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4">
        {firebaseAuth ? (
          user ? (
            <div className="space-y-1 text-sm text-slate-800">
              <p>
                <span className="font-medium text-slate-900">Signed in</span>
              </p>
              {user.email ? <p>{user.email}</p> : null}
              {user.displayName ? <p className="text-slate-600">{user.displayName}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-slate-600">You are not signed in.</p>
          )
        ) : (
          <p className="text-sm text-slate-600">
            Firebase is not configured. Add <code className="rounded bg-slate-200 px-1">NEXT_PUBLIC_FIREBASE_*</code>{" "}
            keys to enable login.
          </p>
        )}
        <div className="mt-4">
          <GoogleAuthButton />
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const [settings, patchSettings] = useUserSettings();

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          ← Back to Home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-2 text-slate-600">
          Preferences are stored in this browser only (<code className="rounded bg-slate-200 px-1 text-sm">localStorage</code>
          ). They apply to quizzes and the home calendar on this device.
        </p>

        <div className="mt-8 space-y-8">
          <AccountCard />

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Study & quizzes</h2>
            <p className="mt-1 text-sm text-slate-600">Control how practice quizzes are presented.</p>
            <div className="mt-4 space-y-3">
              <ToggleRow
                id="shuffle-questions"
                label="Shuffle question order"
                description="Random order for each attempt (retake draws a new order)."
                checked={settings.shuffleQuestionOrder}
                onChange={(shuffleQuestionOrder) => patchSettings({ shuffleQuestionOrder })}
              />
              <ToggleRow
                id="shuffle-options"
                label="Shuffle answer choices"
                description="Randomize A–D order. Saved attempts still map to the correct original answers on the server."
                checked={settings.shuffleAnswerChoices}
                onChange={(shuffleAnswerChoices) => patchSettings({ shuffleAnswerChoices })}
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
                <label htmlFor="explanation-timing" className="text-sm font-semibold text-slate-900">
                  Explanations
                </label>
                <p className="mt-0.5 text-xs text-slate-600">
                  Choose when to show the explanation text for each question.
                </p>
                <select
                  id="explanation-timing"
                  value={settings.explanationTiming}
                  onChange={(e) =>
                    patchSettings({
                      explanationTiming: e.target.value === "after_each" ? "after_each" : "after_submit",
                    })
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 sm:w-auto"
                >
                  <option value="after_submit">After submit (see all results at once)</option>
                  <option value="after_each">After each answer (while taking the quiz)</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Upload & calendar</h2>
            <div className="mt-4 space-y-3">
              <ToggleRow
                id="remember-upload"
                label="Remember course and week on Upload"
                description="Restores your last selected course and week on the Upload page."
                checked={settings.rememberUploadSelections}
                onChange={(rememberUploadSelections) => patchSettings({ rememberUploadSelections })}
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
                <label htmlFor="week-starts" className="text-sm font-semibold text-slate-900">
                  Home calendar: week starts on
                </label>
                <p className="mt-0.5 text-xs text-slate-600">Applies to the small calendar on the study dashboard.</p>
                <select
                  id="week-starts"
                  value={settings.calendarWeekStartsOn}
                  onChange={(e) =>
                    patchSettings({
                      calendarWeekStartsOn: e.target.value === "1" ? 1 : 0,
                    })
                  }
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 sm:w-auto"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Accessibility</h2>
            <div className="mt-4 space-y-3">
              <ToggleRow
                id="reduce-motion"
                label="Reduce motion"
                description="Shortens animations and transitions across the app."
                checked={settings.reducedMotion}
                onChange={(reducedMotion) => patchSettings({ reducedMotion })}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Data & privacy</h2>
            <ul className="mt-3 list-inside space-y-2 text-sm text-slate-600">
              <li>
                • <strong className="text-slate-800">Cold quizzes</strong> you generate are stored in the project database when
                MongoDB is connected; access is tied to your account (or demo scope).
              </li>
              <li>
                • <strong className="text-slate-800">Default scheduled quizzes</strong> (hot/review) run in the browser; scores
                are not saved to the server.
              </li>
              <li>
                • These <strong className="text-slate-800">settings</strong> never leave your device unless you clear site
                data.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
