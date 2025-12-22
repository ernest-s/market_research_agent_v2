"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 1️⃣ Load profile from backend (auth enforced server-side)
   */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (res.status === 403) {
          router.replace("/verify-email");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load profile");
        }

        const data = await res.json();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setCompanyName(data.companyName || "");
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  /**
   * 2️⃣ Save handler
   */
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          companyName,
        }),
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
        throw new Error("Failed to save profile");
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error("Save profile error:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * 🔒 Unified loading guard
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  /**
   * 3️⃣ Profile UI
   */
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 bg-white border-b flex items-center px-6">
        <h1 className="text-xl font-semibold">Update Profile</h1>
      </header>

      <main className="max-w-xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-gray-200"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-gray-200"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Company
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-gray-200"
              placeholder="Optional"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={() => router.replace("/dashboard")}
              className="px-5 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-black text-white px-5 py-2 rounded-md
                hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
