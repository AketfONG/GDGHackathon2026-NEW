/** 24 hex chars — matches how quiz take pages recognize Mongo-backed quizzes. */
export function isMongoObjectIdString(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}
