"use client";

import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { QuizTodoList } from "@/components/quiz-todo-list";
import { StudyCalendar } from "@/components/study-calendar";
import { GoogleAuthButton } from "@/components/google-auth-button";
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
  { topic: "Photosynthesis", course: "Biology", unclearPoints: ["Difficulty understanding the difference between light-dependent and light-independent reactions", "Electron transport chain mechanism needs reinforcement"] },
  { topic: "Electron Configuration", course: "Chemistry", unclearPoints: ["Struggling with orbital filling order and quantum number assignments", "Pauli exclusion principle and Hund's rule applications need practice"] },
  { topic: "Integration by Parts", course: "Mathematics", unclearPoints: ["Confusion with LIATE rule selection and when to apply formula", "Multiple integration steps not fully grasped"] },
];

// Mock study plan from schedule
const MOCK_STUDY_PLAN = [
  {
    id: "1",
    date: "2026-04-13",
    title: "Hot Quiz: Photosynthesis",
    type: "hot_quiz",
    topic: "Biology",
    priority: "high",
    time: "09:00 AM",
    duration: "15 mins",
    topicsCovered: ["Light-dependent reactions", "Calvin cycle", "Chlorophyll function", "Electron transport chain"],
  },
  {
    id: "2",
    date: "2026-04-14",
    title: "Cold Quiz: Cell Structure",
    type: "cold_quiz",
    topic: "Biology",
    priority: "high",
    time: "02:00 PM",
    duration: "15 mins",
    unclearConcepts: ["Mitochondrial function", "Ribosome assembly", "Nucleus structure"],
  },
  {
    id: "3",
    date: "2026-04-14",
    title: "Study: Electron Configuration",
    type: "study_topic",
    topic: "Chemistry",
    priority: "medium",
    time: "03:00 PM",
    duration: "45 mins",
    topicsCovered: ["Aufbau principle", "Hund's rule", "Pauli exclusion principle"],
    unclearConcepts: ["Orbital filling order", "Electron spin pairing", "Valence electron concept"],
  },
  {
    id: "4",
    date: "2026-04-15",
    title: "Review Quiz: Photosynthesis",
    type: "review_quiz",
    topic: "Biology",
    priority: "medium",
    time: "10:00 AM",
    duration: "20 mins",
    topicsCovered: ["Light-dependent reactions", "Calvin cycle", "Chlorophyll function", "Electron transport chain"],
  },
  {
    id: "5",
    date: "2026-04-16",
    title: "Hot Quiz: Organic Chemistry",
    type: "hot_quiz",
    topic: "Chemistry",
    priority: "high",
    time: "11:00 AM",
    duration: "15 mins",
    topicsCovered: ["Alkanes and alkenes", "Functional groups", "Isomerism", "Reaction mechanisms"],
  },
  {
    id: "6",
    date: "2026-04-17",
    title: "Cold Quiz: Photosynthesis",
    type: "cold_quiz",
    topic: "Biology",
    priority: "medium",
    time: "04:00 PM",
    duration: "15 mins",
    unclearConcepts: ["Light-dependent reactions mechanism", "ATP synthesis", "NADPH role"],
  },
  {
    id: "7",
    date: "2026-04-18",
    title: "Review Quiz: Cell Structure",
    type: "review_quiz",
    topic: "Biology",
    priority: "low",
    time: "02:00 PM",
    duration: "20 mins",
    topicsCovered: ["Organelle functions", "Cell membrane structure", "Protein synthesis"],
  },
  {
    id: "8",
    date: "2026-04-20",
    title: "Hot Quiz: Thermodynamics",
    type: "hot_quiz",
    topic: "Chemistry",
    priority: "high",
    time: "10:00 AM",
    duration: "15 mins",
    topicsCovered: ["Enthalpy", "Entropy", "Gibbs free energy", "Spontaneity"],
  },
  {
    id: "9",
    date: "2026-04-21",
    title: "Study: DNA Replication",
    type: "study_topic",
    topic: "Biology",
    priority: "high",
    time: "11:00 AM",
    duration: "60 mins",
    unclearConcepts: ["Helicase function", "Primer synthesis", "Okazaki fragments"],
    topicsCovered: ["DNA polymerase types", "Replication fork", "Leading vs lagging strand"],
  },
  {
    id: "10",
    date: "2026-04-22",
    title: "Cold Quiz: Organic Chemistry",
    type: "cold_quiz",
    topic: "Chemistry",
    priority: "medium",
    time: "03:00 PM",
    duration: "15 mins",
    unclearConcepts: ["Reaction mechanisms", "Activation energy", "Catalysis"],
  },
  {
    id: "11",
    date: "2026-04-23",
    title: "Review Quiz: Thermodynamics",
    type: "review_quiz",
    topic: "Chemistry",
    priority: "medium",
    time: "02:00 PM",
    duration: "25 mins",
    topicsCovered: ["Enthalpy calculations", "Entropy and disorder", "Equilibrium constants"],
  },
  {
    id: "12",
    date: "2026-04-24",
    title: "Hot Quiz: Genetics",
    type: "hot_quiz",
    topic: "Biology",
    priority: "high",
    time: "09:00 AM",
    duration: "15 mins",
    topicsCovered: ["Mendel's laws", "Punnett squares", "Genetic linkage", "Chi-square analysis"],
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "hot_quiz":
      return { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", label: "bg-red-100" };
    case "cold_quiz":
      return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", label: "bg-blue-100" };
    case "review_quiz":
      return { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", label: "bg-green-100" };
    case "study_topic":
      return { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", label: "bg-purple-100" };
    default:
      return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", label: "bg-slate-100" };
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "hot_quiz":
      return "Hot Quiz";
    case "cold_quiz":
      return "Cold Quiz";
    case "review_quiz":
      return "Review Quiz";
    case "study_topic":
      return "Study";
    default:
      return "Task";
  }
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
          <div className="mt-3">
            <GoogleAuthButton loginOnly />
          </div>
        </section>

        {/* Main Layout: Calendar (left) and Content (right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Calendar - Left (spans 1 column) */}
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Study Schedule</h2>
                <Link
                  href="/schedule"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Full Schedule →
                </Link>
              </div>
              <StudyCalendar 
                tasks={MOCK_STUDY_PLAN} 
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>

            {/* Task Preview for Selected Date */}
            {selectedDate && (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-base font-semibold text-slate-900">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { 
                    weekday: "short", 
                    month: "short", 
                    day: "numeric" 
                  })}
                </h3>
                <div className="space-y-2">
                  {MOCK_STUDY_PLAN.filter(task => task.date === selectedDate).map((task) => {
                    const colors = getTypeColor(task.type);
                    return (
                      <div key={task.id} className={`rounded border p-2 ${colors.bg}`}>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${colors.label} ${colors.text}`}>
                            {getTypeLabel(task.type)}
                          </span>
                          <p className="text-sm font-medium text-slate-900 flex-1">{task.title}</p>
                          <span className="text-xs text-slate-600">{task.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Review Tests by Course */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Review Tests by Course</h2>
              <div className="space-y-3">
                {MOCK_QUIZZES_BY_COURSE.map((courseGroup) => (
                  <div key={courseGroup.course}>
                    <p className="mb-2 font-medium text-slate-900">{courseGroup.course}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/quizzes?type=review"
                        className="rounded-md bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-800 hover:bg-green-200 transition-colors"
                      >
                        Review Tests
                      </Link>
                      <Link
                        href="/quizzes?type=hot"
                        className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-800 hover:bg-red-200 transition-colors"
                      >
                        Hot Tests
                      </Link>
                      <Link
                        href="/quizzes?type=cold"
                        className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        Cold Tests
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/quizzes"
                className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                View All Quizzes →
              </Link>
            </div>
          </div>

          {/* Content - Right (spans 1 column) */}
          <div className="space-y-6 lg:col-span-1">
            {/* Quiz To-Do List by Course */}
            {MOCK_QUIZZES_BY_COURSE.map((courseGroup) => (
              <div key={courseGroup.course} className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">{courseGroup.course} - Quizzes</h2>
                <QuizTodoList quizzes={courseGroup.quizzes} loading={false} />
              </div>
            ))}

            {/* Unclear Concepts Preview */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Unclear Concepts</h2>
              <div className="space-y-3">
                {MOCK_UNCLEAR_CONCEPTS.map((concept, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{concept.topic}</p>
                        <p className="text-xs text-slate-600 mt-1">{concept.course}</p>
                      </div>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {concept.unclearPoints.map((point, pointIdx) => (
                        <li key={pointIdx} className="flex gap-2">
                          <span>•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
