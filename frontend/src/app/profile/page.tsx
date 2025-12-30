"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Profile = {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
};

type AccountMeta = {
  accountType: "INDIVIDUAL" | "CORPORATE";
  isCompanyEditable: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const passwordSent = searchParams.get("passwordSent") === "1";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile>({
    firstName: "",
    lastName: "",
    companyName: "",
  });

  const [accountMeta, setAccountMeta] = useState<AccountMeta>({
    accountType: "INDIVIDUAL",
    isCompanyEditable: true,
  });

  /**
   * 1️⃣ Load account data
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

        setProfile({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          companyName: data.companyName ?? "",
        });

        setAccountMeta({
          accountType: data.accountType,
          isCompanyEditable: data.isCompanyEditable,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load account details.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  /**
   * 2️⃣ Save profile
   */
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="h-16 bg-white border-b flex items-center px-6 gap-4">
        <button
          onClick={() => router.replace("/dashboard")}
          className="text-sm text-gray-600 hover:text-black"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold">Account</h1>
      </header>

      <main className="max-w-3xl mx-auto p-8 space-y-8">
        {/* PROFILE */}
        <section className="bg-white border rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold">Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                First name
              </label>
              <input
                value={profile.firstName ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, firstName: e.target.value })
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Last name
              </label>
              <input
                value={profile.lastName ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, lastName: e.target.value })
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          {/* COMPANY */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Company
            </label>
            <input
              value={profile.companyName ?? ""}
              disabled={!accountMeta.isCompanyEditable}
              onChange={(e) =>
                setProfile({ ...profile, companyName: e.target.value })
              }
              className={`w-full border rounded-md px-3 py-2 ${
                !accountMeta.isCompanyEditable
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                  : ""
              }`}
            />
            {!accountMeta.isCompanyEditable && (
              <p className="text-xs text-gray-500 mt-1">
                Managed by your organization
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>

        {/* SECURITY */}
        <section className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Security</h2>

          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">Password</p>

              {passwordSent ? (
                <p className="text-sm text-green-700 mt-1">
                  Password reset email sent. Please check your inbox.
                </p>
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  Change your account password.
                </p>
              )}
            </div>

            {!passwordSent && (
              <a
                href="/auth/change-password"
                className="text-sm underline"
              >
                Change password
              </a>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
