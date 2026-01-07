"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Prevent double calls on initial mount
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip first render
    console.log(
      "[Providers] useEffect fired",
      "prev =", lastPathRef.current,
      "current =", pathname
    );

    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      console.log("[Providers] initial mount, skipping");
      return;
    }

    // Skip if pathname didn't actually change
    if (lastPathRef.current === pathname) {
      console.log("[Providers] same pathname, skipping");
      return;
    }

    lastPathRef.current = pathname;
    console.log("[Providers] pathname changed, calling revalidate");

    const revalidateSession = async () => {
      try {
        const res = await fetch("/api/auth/revalidate", {
          method: "POST",
          credentials: "include",
        });

        console.log("[Providers] revalidate response status =", res.status);

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (res.status === 403) {
          router.replace("/account-suspended");
          return;
        }

        // 200 → session valid, nothing else to do
      } catch (err) {
        console.error("Session revalidation failed", err);
        router.replace("/login");
      }
    };

    revalidateSession();
  }, [pathname, router]);

  return <>{children}</>;
}
