"use client";

import { useState } from "react";

export default function AccountSuspendedPage() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);

    /**
     * IMPORTANT:
     * Auth/logout must be a top-level navigation,
     * NOT a fetch, to correctly clear cookies and
     * Auth0 session state.
     */
    window.location.href = "/auth/logout";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white border rounded-lg shadow-sm p-8 text-center space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Account Suspended
        </h1>

        <p className="text-gray-600">
          Your account is currently suspended and you no longer have access to
          the dashboard.
        </p>

        <p className="text-gray-600">
          Please contact the support team for assistance.
        </p>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
        >
          {loggingOut ? "Signing out…" : "Go to login"}
        </button>
      </div>
    </div>
  );
}
