"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Routes that do NOT require session revalidation.
 */
const PUBLIC_ROUTE_PREFIXES = [
  "/",                // landing / marketing
  "/login",
  "/verify-email",
  "/account-suspended",
  "/auth",             // /auth/login, /auth/logout, etc.
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;

  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => prefix !== "/" && pathname.startsWith(prefix)
  );
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const lastPathRef = useRef<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  useEffect(() => {
    // Initial mount
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      return;
    }

    // No actual navigation
    if (lastPathRef.current === pathname) {
      return;
    }

    lastPathRef.current = pathname;

    // Public routes render immediately
    if (isPublicRoute(pathname)) {
      setIsCheckingSession(false);
      return;
    }

    // 🔒 Protected route → block render until revalidated
    setIsCheckingSession(true);

    const revalidateSession = async () => {
      try {
        const res = await fetch("/api/auth/revalidate", {
          method: "POST",
          credentials: "include",
        });

        if (res.status === 401) {
          window.location.href = "/auth/logout";
          return;
        }

        if (res.status === 403) {
          router.replace("/account-suspended");
          return;
        }

        // ✅ Session valid → allow render
        setIsCheckingSession(false);
      } catch (err) {
        console.error("Session revalidation failed", err);
        window.location.href = "/auth/logout";
      }
    };

    revalidateSession();
  }, [pathname, router]);

  /**
   * ⛔ Block rendering protected pages during session check
   */
  if (isCheckingSession) {
    return null; // or a global spinner if you prefer
  }

  return <>{children}</>;
}
