/** Shared with `/schedule` and the home dashboard so task types and calendar day hues stay consistent. */

export function getScheduleTaskTypeColor(type: string) {
  switch (type) {
    case "hot_quiz":
      return { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" };
    case "cold_quiz":
      return { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" };
    case "review_quiz":
      return { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" };
    case "study_topic":
      return { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" };
  }
}

export function getScheduleTaskTypeLabel(type: string) {
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
}
