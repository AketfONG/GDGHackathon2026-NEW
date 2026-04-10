"use client";

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { QuizTodoList } from "@/components/quiz-todo-list";
import { StudyCalendar } from "@/components/study-calendar";
import { useState } from "react";

// Mock quiz data organized by course
const MOCK_QUIZZES_BY_COURSE = [
  {
    course: "Biology",
    quizzes: [
      { id: "1", title: "Introduction to Biology", topic: "Biology", difficulty: "EASY" },
      { id: "2", title: "Cell Biology Advanced", topic: "Biology", difficulty: "HARD" },
    ],
  },
  {
    course: "Mathematics",
    quizzes: [
      { id: "3", title: "Calculus Basics", topic: "Mathematics", difficulty: "MEDIUM" },
    ],
  },
  {
    course: "Chemistry",
    quizzes: [
      { id: "4", title: "Organic Chemistry", topic: "Chemistry", difficulty: "HARD" },
    ],
  },
];

// Mock unclear concepts from student's previous quizzes
const MOCK_UNCLEAR_CONCEPTS = [
  { topic: "Photosynthesis", course: "Biology" },
  { topic: "Electron Configuration", course: "Chemistry" },
  { topic: "Integration by Parts", course: "Mathematics" },
];

// Mock review questions data (MC questions only)
const MOCK_REVIEW_QUESTIONS = [
  { question: "What is the difference between mitosis and meiosis?", course: "Biology", attempts: 3, type: "MC" },
  { question: "Explain the law of conservation of energy", course: "Physics", attempts: 2, type: "MC" },
  { question: "Define oxidation-reduction reactions", course: "Chemistry", attempts: 4, type: "MC" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        {/* Header */}
        <section className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Study Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Track your progress, identify unclear concepts, and review challenging topics.
          </p>
        </section>

        {/* Main Layout: Calendar (left) and Content (right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Calendar - Left (spans 1 column) */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Study Schedule</h2>
            <StudyCalendar />
          </div>

          {/* Content - Right (spans 3 columns) */}
          <div className="space-y-6 lg:col-span-3">
            {/* Quiz To-Do List by Course */}
            {MOCK_QUIZZES_BY_COURSE.map((courseGroup) => (
              <div key={courseGroup.course} className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">{courseGroup.course} - Quizzes</h2>
                <QuizTodoList quizzes={courseGroup.quizzes} loading={false} />
              </div>
            ))}

            {/* Unclear Concepts Preview */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Areas to Review</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MOCK_UNCLEAR_CONCEPTS.map((concept, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100"
                  >
                    <p className="font-medium text-amber-900">{concept.topic}</p>
                    <p className="text-sm text-amber-700">{concept.course}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard"
                className="mt-4 inline-block rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                View All →
              </Link>
            </div>

            {/* Review Questions Preview */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Multiple Choice Questions to Review</h2>
              <div className="space-y-3">
                {MOCK_REVIEW_QUESTIONS.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 hover:bg-blue-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">{item.question}</p>
                      <div className="mt-1 flex gap-2">
                        <span className="inline-block rounded bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {item.course}
                        </span>
                        <span className="inline-block rounded bg-purple-200 px-2 py-0.5 text-xs font-medium text-purple-800">
                          MC
                        </span>
                        <span className="text-xs text-blue-700">{item.attempts} attempts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/interventions"
                className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                View All →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Access</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:bg-blue-50 hover:border-blue-300"
              href="/dashboard"
            >
              <div className="font-semibold text-slate-900">View Dashboard</div>
              <div className="mt-1 text-sm text-slate-600">Track your performance</div>
            </Link>
            <Link
              className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:bg-blue-50 hover:border-blue-300"
              href="/quizzes"
            >
              <div className="font-semibold text-slate-900">All Quizzes</div>
              <div className="mt-1 text-sm text-slate-600">Browse quiz library</div>
            </Link>
            <Link
              className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:bg-blue-50 hover:border-blue-300"
              href="/schedule"
            >
              <div className="font-semibold text-slate-900">My Schedule</div>
              <div className="mt-1 text-sm text-slate-600">Manage your timetable</div>
            </Link>
            <Link
              className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:bg-blue-50 hover:border-blue-300"
              href="/upload"
            >
              <div className="font-semibold text-slate-900">Upload Materials</div>
              <div className="mt-1 text-sm text-slate-600">Add your courses</div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
