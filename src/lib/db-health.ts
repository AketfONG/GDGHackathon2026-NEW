type ErrorWithCode = {
  code?: string;
  name?: string;
  message?: string;
};

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as ErrorWithCode;
  const msg = (e.message ?? "").toLowerCase();

  return (
    e.code === "P1001" ||
    e.code === "P1000" ||
    e.code === "P1017" ||
    e.name === "PrismaClientInitializationError" ||
    msg.includes("can't reach database server") ||
    msg.includes("database") ||
    msg.includes("connection")
  );
}
