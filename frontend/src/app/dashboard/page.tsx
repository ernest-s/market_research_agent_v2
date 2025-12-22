"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UserMenu from "@/components/UserMenu";

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
   * 1️⃣ Bootstrap user (backend-auth only)
   */
  useEffect(() => {
    const bootstrap = async () => {
      if (bootstrappedRef.current) return;
      bootstrappedRef.current = true;

      try {
        const res = await fetch("/api/auth/bootstrap", {
          method: "POST",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (res.status === 403) {
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

    bootstrap();
  }, [router]);

  /**
   * 🔒 Render guard
   */
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  /**
   * 2️⃣ Dashboard UI
   */
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold">
          Qualitative Research Platform
        </h1>
        <UserMenu />
      </header>

      <main className="p-8">
        <h2 className="text-2xl font-bold mb-2">
          Welcome{user.firstName ? `, ${user.firstName}` : ""}
        </h2>
        <p className="text-gray-600">
          This is your dashboard. Your studies will appear here.
        </p>
      </main>
    </div>
  );
}
