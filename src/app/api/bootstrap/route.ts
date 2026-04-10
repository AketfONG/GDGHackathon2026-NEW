import { NextResponse } from "next/server";
import { ensureDemoUser } from "@/lib/demo-user";
import { backendDisabledResponse, isBackendDisabled } from "@/lib/backend-toggle";
import { connectToDatabase } from "@/lib/mongodb";
import { QuizModel } from "@/models/Quiz";

export async function POST() {
  if (isBackendDisabled()) return backendDisabledResponse();
  await connectToDatabase();
  const user = await ensureDemoUser();
  const existingCount = await QuizModel.countDocuments();

  if (existingCount === 0) {
    await QuizModel.create({
      title: "Arrays and Basics",
      topic: "DSA",
      difficulty: "easy",
      questions: [
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
    });
  }

  return NextResponse.json({ ok: true, userId: String(user._id) });
}
