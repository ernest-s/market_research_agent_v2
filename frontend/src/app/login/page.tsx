"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Attempt silent login
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        // ignore – user not logged in
      });
  }, [router]);

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="w-1/2 bg-black text-white flex flex-col justify-center px-16">
        <h1 className="text-4xl font-bold mb-4">
          Qualitative Research Platform
        </h1>
        <p className="text-lg opacity-80">
          Design, manage, and analyze qualitative studies with intelligent agent assistance.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 bg-white flex flex-col justify-center px-20">
        <h2 className="text-3xl font-semibold mb-8 text-black">
          Login to your account
        </h2>

        {/* BUTTON CONTAINER */}
        <div className="max-w-sm">
          <a
            href="/auth/login"
            className="block w-full bg-black text-white py-3 rounded-md text-center mb-4 transition hover:bg-gray-800"
          >
            Login with Auth0
          </a>

          <div className="text-center text-gray-600 mb-4">
            or
          </div>

          <a
            href="/auth/login?screen_hint=signup"
            className="block w-full border border-black text-black py-3 rounded-md text-center transition hover:bg-gray-100"
          >
            Create a new account
          </a>
        </div>
      </div>
    </div>
  );
}
