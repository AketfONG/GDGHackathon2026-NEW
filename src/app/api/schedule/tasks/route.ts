import { NextResponse } from "next/server";
import { isBackendDisabled } from "@/lib/backend-toggle";
import { getMergedScheduleTasksForViewer } from "@/lib/dynamic-schedule-loader";
import { getScheduledStudyTasks } from "@/lib/scheduled-quizzes";

export async function GET() {
  if (isBackendDisabled()) {
    return NextResponse.json({ tasks: getScheduledStudyTasks() });
  }
  try {
    const tasks = await getMergedScheduleTasksForViewer();
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ tasks: getScheduledStudyTasks() });
  }
}
