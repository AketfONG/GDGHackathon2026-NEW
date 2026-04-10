import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo-user";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";

export async function POST() {
  if (isBackendDisabled()) return backendDisabledResponse();
  const user = await ensureDemoUser();
  const existingCount = await db.quiz.count();

  if (existingCount === 0) {
    await db.quiz.create({
      data: {
        title: "Arrays and Basics",
        topic: "DSA",
        difficulty: "easy",
        questions: {
          create: [
            {
              prompt: "What is the index of the first item in an array?",
              options: ["0", "1", "-1", "Depends on language"],
              correctIdx: 0,
              explanation: "Most modern programming languages use zero-based indexing.",
            },
            {
              prompt: "What is the time complexity of array access by index?",
              options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
              correctIdx: 0,
              explanation: "Array indexing is constant time due to contiguous memory addressing.",
            },
            {
              prompt: "Which operation is expensive in plain arrays?",
              options: [
                "Read by index",
                "Insert at beginning",
                "Append at end (amortized)",
                "Overwrite by index",
              ],
              correctIdx: 1,
              explanation: "Insert at the beginning shifts elements and costs O(n).",
            },
          ],
        },
      },
    });
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
