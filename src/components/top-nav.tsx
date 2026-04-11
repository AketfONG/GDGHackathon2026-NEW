"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { syncSessionCookie } from "@/lib/auth/session-sync";
import { NavDemoLiveSwitch } from "@/components/nav-demo-live-switch";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload Materials" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/schedule", label: "Schedule" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState<"none" | "in" | "out">("none");
  const showLogin = pathname !== "/login";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen && menuAnimating !== "out") return;
    const handle = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('[aria-label="Open navigation menu"]') &&
        !target.closest("[data-mobile-menu]")
      ) {
        setMenuAnimating("out");
        setTimeout(() => {
          setMenuAnimating("none");
          setMobileOpen(false);
        }, 180);
      }
    };
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [mobileOpen, menuAnimating]);

  useEffect(() => {
    if (!firebaseAuth) return;
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      setIsLoggedIn(Boolean(user));
    });
    return () => unsub();
  }, []);

  async function handleLogout() {
    if (!firebaseAuth) return;
    const confirmed = window.confirm("Do you want to log out?");
    if (!confirmed) return;
    await signOut(firebaseAuth);
    await syncSessionCookie(null);
    router.refresh();
  }

  const isActive = (path: string) => pathname === path;
  const linkStyle = (path: string): React.CSSProperties => ({
    color: isActive(path) ? "#3498db" : "#4b5563",
    backgroundColor: isActive(path) ? "rgba(52, 152, 219, 0.2)" : "transparent",
    border: "none",
    fontWeight: 500,
    padding: "12px 20px",
    borderRadius: "9999px",
    transition: "color 0.2s, background 0.2s",
    textDecoration: "none",
  });

  return (
    <>
      <header
        className={`header-bar ${isScrolled ? "scrolled" : ""}`}
        style={{ width: "100%" }}
      >
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            height: "64px",
            maxWidth: "1280px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              position: "relative",
              zIndex: 50,
            }}
          >
            <Link href="/" aria-label="Go to home">
              <button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 focus:outline-none"
                style={{ background: "#d1fae5", border: "none" }}
              >
                <span className="text-emerald-600 font-bold text-lg">🌱</span>
              </button>
            </Link>
            <Link
              href="/"
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#1f2937",
                textDecoration: "none",
              }}
            >
              StudyAgent
            </Link>
          </div>

          <div className="header-mobile" style={{ display: "flex", alignItems: "center", zIndex: 50 }}>
            <button
              type="button"
              style={{
                position: "relative",
                width: 40,
                height: 40,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              onClick={() => {
                if (!mobileOpen) {
                  setMobileOpen(true);
                  setMenuAnimating("in");
                } else {
                  setMenuAnimating("out");
                  setTimeout(() => {
                    setMenuAnimating("none");
                    setMobileOpen(false);
                  }, 180);
                }
              }}
              aria-label="Open navigation menu"
            >
              <span style={{ display: "block", width: 24, height: 2, backgroundColor: "#111", borderRadius: 2 }} />
              <span style={{ display: "block", width: 24, height: 2, backgroundColor: "#111", borderRadius: 2 }} />
              <span style={{ display: "block", width: 24, height: 2, backgroundColor: "#111", borderRadius: 2 }} />
            </button>
          </div>

          <div className="header-desktop" style={{ display: "none", alignItems: "center", gap: "12px" }}>
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="header-nav-link"
                style={linkStyle(item.href)}
                data-active={isActive(item.href)}
              >
                {item.label}
              </Link>
            ))}
            <NavDemoLiveSwitch />
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  border: "2px solid #d1d5db",
                  color: "#111",
                  padding: "12px 28px",
                  fontSize: "16px",
                  borderRadius: "9999px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "transparent",
                  transition: "border-color 0.2s, color 0.2s",
                }}
              >
                Logout
              </button>
            ) : showLogin ? (
              <Link href="/login">
                <button
                  type="button"
                  style={{
                    backgroundColor: "#3498db",
                    color: "white",
                    padding: "12px 28px",
                    fontSize: "16px",
                    borderRadius: "9999px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                >
                  Login
                </button>
              </Link>
            ) : null}
          </div>
        </nav>

        {(mobileOpen || menuAnimating === "out") && (
          <div
            ref={menuRef}
            data-mobile-menu
            className={`header-mobile-menu ${menuAnimating === "out" ? "out" : ""}`}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "white",
              borderBottomLeftRadius: "24px",
              borderBottomRightRadius: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 16px",
              gap: "16px",
              zIndex: 40,
            }}
            onAnimationEnd={() => {
              if (menuAnimating === "out") {
                setMenuAnimating("none");
                setMobileOpen(false);
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
              <NavDemoLiveSwitch />
            </div>
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ ...linkStyle(item.href), textAlign: "center", padding: "12px 20px" }}
                onClick={() => {
                  setMenuAnimating("out");
                  setTimeout(() => {
                    setMenuAnimating("none");
                    setMobileOpen(false);
                  }, 180);
                }}
              >
                {item.label}
              </Link>
            ))}
            {!isLoggedIn && showLogin ? (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <button
                  type="button"
                  style={{
                    backgroundColor: "#3498db",
                    color: "white",
                    padding: "12px 28px",
                    fontSize: "16px",
                    borderRadius: "9999px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Login
                </button>
              </Link>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await handleLogout();
                  setMobileOpen(false);
                }}
                style={{
                  border: "2px solid #d1d5db",
                  color: "#111",
                  padding: "12px 28px",
                  fontSize: "16px",
                  borderRadius: "9999px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "transparent",
                }}
              >
                Logout
              </button>
            )}
          </div>
        )}

        <style>{`
          .header-nav-link:hover {
            background-color: rgba(52, 152, 219, 0.15) !important;
            color: #3498db !important;
          }
          .header-nav-link[data-active="true"] {
            background-color: rgba(52, 152, 219, 0.2) !important;
            color: #3498db !important;
          }
          .header-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(8px);
            z-index: 50;
            transition: box-shadow 0.3s ease;
          }
          .header-bar.scrolled {
            box-shadow: 0 10px 18px rgba(0,0,0,0.08);
          }
          @media (min-width: 1024px) {
            .header-mobile { display: none !important; }
            .header-desktop { display: flex !important; }
          }
          @media (max-width: 1023px) {
            .header-desktop { display: none !important; }
          }
        `}</style>
      </header>
      <div style={{ height: 64 }} aria-hidden="true" />
    </>
  );
}
