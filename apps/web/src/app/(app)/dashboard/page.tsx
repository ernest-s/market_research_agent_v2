"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

type ActiveSessionInfo = {
  createdAt?: string;
  lastSeenAt?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const bootstrappedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sessionConflict, setSessionConflict] =
    useState<ActiveSessionInfo | null>(null);

  /**
   * 1️⃣ Bootstrap logic (extractable & re-runnable)
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

      if (res.status === 409) {
        const data = await res.json();
        setSessionConflict(data.activeSession || {});
        setLoading(false);
        return;
      }

      if (!res.ok) {
        console.error("Bootstrap failed");
        router.replace("/login");
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setSessionConflict(null);
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
   * 3️⃣ Proceed here (override session)
   */
  const handleProceedHere = async () => {
    try {
      const res = await fetch("/api/auth/session/override", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Session override failed");
      }

      // 🔑 Clear conflict + re-bootstrap cleanly
      setSessionConflict(null);
      setLoading(true);
      await runBootstrap();
    } catch (err) {
      console.error("Session override error:", err);
      window.location.href = "/auth/logout";
    }
  };

  /**
   * 4️⃣ Cancel → logout
   */
  const handleCancel = () => {
    window.location.href = "/auth/logout";
  };

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
   * ⚠️ Session conflict modal
   */
  if (sessionConflict) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white max-w-md w-full p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-3">
            You’re already logged in elsewhere
          </h2>

          <p className="text-gray-600 mb-4">
            You’re currently logged in from another device or browser.
            If you continue here, your other session will be logged out
            and any unsaved work will be lost.
          </p>

          <div className="space-y-3 text-sm text-gray-700">
            {sessionConflict.userAgent && (
              <p>
                <strong>Device:</strong> {sessionConflict.userAgent}
              </p>
            )}
            {sessionConflict.lastSeenAt && (
              <p>
                <strong>Last active:</strong>{" "}
                {new Date(sessionConflict.lastSeenAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleProceedHere}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Proceed here
            </button>
          </div>
        </div>
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
   * 5️⃣ Dashboard UI (CONTENT ONLY)
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
