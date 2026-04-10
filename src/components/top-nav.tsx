"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/upload", label: "Upload Materials" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/schedule", label: "Schedule" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const showLogin = pathname !== "/login";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navBtnClass = (href: string) =>
    `rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
      pathname === href
        ? "border-sky-300 bg-sky-100 text-sky-700"
        : "border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
    }`;

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-shadow ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-full bg-emerald-100 text-center leading-9">
            🌱
          </span>
          <span className="text-xl font-bold text-slate-800">StudyAgent</span>
        </Link>

        <button
          className="md:hidden rounded border border-slate-300 px-2 py-1 text-sm"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Open navigation menu"
        >
          Menu
        </button>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navBtnClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
          <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            v1.1
          </span>
          {showLogin ? (
            <Link
              href="/login"
              className="rounded-full border border-sky-500 bg-sky-500 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-1"
            >
              Login
            </Link>
          ) : null}
        </div>
      </nav>

      {mobileOpen ? (
        <div className="space-y-2 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block rounded border px-3 py-2 text-sm font-medium ${
                pathname === item.href
                  ? "border-sky-300 bg-sky-100 text-sky-700"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center justify-between pt-1">
            <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              v1.1
            </span>
            {showLogin ? (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-sky-500 bg-sky-500 px-3 py-1 text-sm font-semibold text-white"
              >
                Login
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
