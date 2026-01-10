"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const bootstrappedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  /**
   * 1️⃣ Fetch dashboard data
   *
   * Assumptions:
   * - Session validity is enforced by layout + Providers
   * - Session conflicts are resolved before reaching this page
   * - Any non-200 here is unexpected and treated as fatal
   */
  const runBootstrap = async () => {
    try {
      const res = await fetch("/api/auth/bootstrap", {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Dashboard bootstrap failed", res.status);
        router.replace("/auth/logout");
        return;
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("Dashboard bootstrap error", err);
      router.replace("/auth/logout");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2️⃣ Run once on mount
   */
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    runBootstrap();
  }, []);

  /**
   * 🔒 Loading state (pure UI)
   */
  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  /**
   * 🔒 Safety guard
   * (Should never happen if architecture is respected)
   */
  if (!user) {
    return null;
  }

  /**
   * 3️⃣ Dashboard UI (CONTENT ONLY)
   */
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">
        Welcome{user.firstName ? `, ${user.firstName}` : ""}
      </h1>

      <p className="text-gray-600">
        This is your dashboard. Your studies will appear here.
      </p>
    </>
  );
}
