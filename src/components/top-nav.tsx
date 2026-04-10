"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload Materials" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/schedule", label: "Schedule" },
  { href: "/checkin", label: "Check-in" },
  { href: "/interventions", label: "Interventions" },
  { href: "/admin/at-risk", label: "Admin" },
];

export function TopNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-slate-900">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">D</span>
            <span className="text-[#FBBC04]">G</span>
            <span className="ml-2 text-slate-800">StudyAgent</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:border-[#4285F4] hover:text-[#1a73e8]"
            >
              {item.label}
            </Link>
          ))}

          {/* Login/Logout Button */}
          <div className="ml-auto">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 hover:border-red-400 hover:bg-red-100"
              >
                Log Out
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 hover:border-blue-400 hover:bg-blue-100"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
