"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /**
   * Auth + verification guard
   *
   * - 401 → not logged in → /login
   * - 403 → not verified → stay here
   * - 200 → verified → /dashboard
   */
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/auth/bootstrap", {
          method: "POST",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (res.status === 200) {
          router.replace("/dashboard");
          return;
        }

        // 403 → email not verified → stay on this page
      } catch {
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [router]);

  async function handleResend() {
    try {
      setSending(true);
      setMessage(null);

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (!res.ok) {
        setMessage("Failed to resend verification email.");
        return;
      }

      setMessage("Verification email sent. Please check your inbox.");
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow border">
        <h1 className="text-2xl font-semibold mb-4">
          Verify your email
        </h1>

        <p className="text-gray-600 mb-6">
          Please verify your email address before continuing.
          Check your inbox for a verification link. Once verified,
          log out and log in again.
        </p>

        {message && (
          <p className="text-sm text-gray-700 mb-4">
            {message}
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={sending}
            className="w-full bg-black text-white py-2 rounded-md
              hover:bg-gray-800 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Resend verification email"}
          </button>

          <a
            href="/auth/logout"
            className="block w-full border py-2 rounded-md text-gray-700
              hover:bg-gray-100 text-center"
          >
            Logout
          </a>
        </div>
      </div>
    </div>
  );
}
