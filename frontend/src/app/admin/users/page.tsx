"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  status: string;
};

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Suspend modal state
  const [suspendUser, setSuspendUser] = useState<User | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [suspending, setSuspending] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  /**
   * Load users
   */
  const loadUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((res) => {
        if (res.status === 403) {
          router.replace("/dashboard");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.users) setUsers(data.users);
      })
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  };

  /**
   * Load current admin profile (for self-protection)
   */
  const loadCurrentUser = () => {
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email) setCurrentUserEmail(data.email);
      })
      .catch(() => {
        /* ignore */
      });
  };

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, [router]);

  /**
   * Search + pagination (client-side)
   */
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;

    return users.filter((u) => {
      const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      return u.email.toLowerCase().includes(q) || name.includes(q);
    });
  }, [users, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE)
  );

  const pagedUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /**
   * Invite user
   */
  const handleInvite = async () => {
    setInviteError(null);
    setInviteSuccess(null);

    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }

    setInviting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          firstName: inviteFirstName.trim() || undefined,
          lastName: inviteLastName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data?.error || "Failed to invite user");
        return;
      }

      setInviteSuccess(`Invitation sent to ${inviteEmail}`);

      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");

      loadUsers();
    } catch {
      setInviteError("Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  /**
   * Suspend user
   */
  const handleSuspend = async () => {
    if (!suspendUser) return;

    setSuspendError(null);

    if (confirmEmail.trim().toLowerCase() !== suspendUser.email.toLowerCase()) {
      setSuspendError("Email does not match. Please type the exact email.");
      return;
    }

    setSuspending(true);

    try {
      const res = await fetch(
        `/api/admin/users/${suspendUser.id}/suspend`,
        { method: "POST" }
      );

      const data = await res.json();

      if (!res.ok) {
        setSuspendError(data?.error || "Failed to suspend user");
        return;
      }

      setSuspendUser(null);
      setConfirmEmail("");
      loadUsers();
    } catch {
      setSuspendError("Failed to suspend user");
    } finally {
      setSuspending(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading users…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard")}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Corporate Users</h1>

        <button
          onClick={() => {
            setInviteError(null);
            setInviteSuccess(null);
            setShowInvite(true);
          }}
          className="px-4 py-2 bg-black text-white rounded-md"
        >
          Add user
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by email or name"
        className="w-full max-w-sm border rounded-md px-3 py-2"
      />

      {/* Users table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedUsers.map((u) => {
              const isSelf =
                currentUserEmail &&
                u.email.toLowerCase() ===
                  currentUserEmail.toLowerCase();

              return (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    {u.firstName || u.lastName
                      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">{u.status}</td>
                  <td className="px-4 py-2">
                    {u.status === "ACTIVE" && !isSelf ? (
                      <button
                        onClick={() => {
                          setSuspendUser(u);
                          setConfirmEmail("");
                          setSuspendError(null);
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Suspend
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {pagedUsers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between max-w-sm">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="text-sm disabled:opacity-50"
        >
          ← Previous
        </button>

        <span className="text-sm">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="text-sm disabled:opacity-50"
        >
          Next →
        </button>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Invite user</h2>

            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email"
              className="w-full border rounded-md px-3 py-2"
            />

            <input
              value={inviteFirstName}
              onChange={(e) => setInviteFirstName(e.target.value)}
              placeholder="First name (optional)"
              className="w-full border rounded-md px-3 py-2"
            />

            <input
              value={inviteLastName}
              onChange={(e) => setInviteLastName(e.target.value)}
              placeholder="Last name (optional)"
              className="w-full border rounded-md px-3 py-2"
            />

            {inviteError && (
              <p className="text-sm text-red-600">{inviteError}</p>
            )}

            {inviteSuccess && (
              <p className="text-sm text-green-600">{inviteSuccess}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowInvite(false)}
                className="text-sm"
                disabled={inviting}
              >
                Cancel
              </button>

              <button
                onClick={handleInvite}
                disabled={inviting}
                className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
              >
                {inviting ? "Inviting…" : "Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend modal */}
      {suspendUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-red-600">
              Suspend user
            </h2>

            <p className="text-sm text-gray-700">
              To confirm suspension, type the user’s email:
            </p>

            <p className="text-sm font-medium">{suspendUser.email}</p>

            <input
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Type email to confirm"
              className="w-full border rounded-md px-3 py-2"
            />

            {suspendError && (
              <p className="text-sm text-red-600">{suspendError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSuspendUser(null)}
                className="text-sm"
                disabled={suspending}
              >
                Cancel
              </button>

              <button
                onClick={handleSuspend}
                disabled={suspending}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
              >
                {suspending ? "Suspending…" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
