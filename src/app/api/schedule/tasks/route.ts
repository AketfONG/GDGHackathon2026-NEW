import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { getMergedScheduleTasksForViewer } from "@/lib/dynamic-schedule-loader";
import { getScheduledStudyTasks } from "@/lib/scheduled-quizzes";
import { getDemoModeFromCookieStore, isPresetDemoContentEnabled } from "@/lib/app-demo-mode";

export async function GET() {
  const cookieStore = await cookies();
  const presets = isPresetDemoContentEnabled(getDemoModeFromCookieStore(cookieStore));
  const presetOpts = { includePresetQuizzes: presets } as const;

  if (isBackendDisabled()) {
    return NextResponse.json({ tasks: getScheduledStudyTasks(undefined, presetOpts) });
  }
  try {
    const tasks = await getMergedScheduleTasksForViewer();
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ tasks: getScheduledStudyTasks(undefined, presetOpts) });
  }
}
