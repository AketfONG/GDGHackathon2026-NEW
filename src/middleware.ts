import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { QUIZ_CLIENT_SCOPE_COOKIE } from "@/lib/quiz-client-scope";

export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  if (!request.cookies.get(QUIZ_CLIENT_SCOPE_COOKIE)?.value) {
    res.cookies.set(QUIZ_CLIENT_SCOPE_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export const config = {
  matcher: ["/quizzes", "/quizzes/:path*", "/upload", "/upload/:path*"],
};
