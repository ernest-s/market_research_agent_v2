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
   * 1️⃣ Bootstrap user data
   */
  const runBootstrap = async () => {
    try {
      const res = await fetch("/api/auth/bootstrap", {
        method: "POST",
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (res.status === 403) {
        const data = await res.json();

        if (data?.error === "ACCOUNT_SUSPENDED") {
          router.replace("/account-suspended");
          return;
        }

        // Default 403 = email verification
        router.replace("/verify-email");
        return;
      }

      if (!res.ok) {
        console.error("Bootstrap failed");
        router.replace("/login");
        return;
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("Bootstrap error", err);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2️⃣ Initial bootstrap (run once)
   */
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    runBootstrap();
  }, []);

  /**
   * 🔒 Loading guard
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
