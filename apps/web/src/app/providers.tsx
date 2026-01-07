"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Routes that do NOT require session revalidation.
 * These are public or unauthenticated pages.
 */
const PUBLIC_ROUTE_PREFIXES = [
  "/",                // landing / marketing
  "/login",
  "/verify-email",
  "/account-suspended",
  "/auth",             // /auth/login, /auth/logout, /auth/change-password, etc.
];

/**
 * Returns true if the current pathname is public.
 */
function isPublicRoute(pathname: string): boolean {
  // Exact "/" match
  if (pathname === "/") return true;

  return PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    prefix !== "/" && pathname.startsWith(prefix)
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

    // ✅ Skip revalidation for public routes
    if (isPublicRoute(pathname)) {
      return;
    }

    const revalidateSession = async () => {
      try {
        const res = await fetch("/api/auth/revalidate", {
          method: "POST",
          credentials: "include",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (res.status === 403) {
          router.replace("/account-suspended");
          return;
        }

        // 200 → session valid, sliding window already refreshed
      } catch (err) {
        console.error("Session revalidation failed", err);
        router.replace("/login");
      }
    };

    revalidateSession();
  }, [pathname, router]);

  return <>{children}</>;
}
