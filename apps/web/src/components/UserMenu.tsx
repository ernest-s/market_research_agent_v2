"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: "ADMIN" | "MEMBER"; // ✅ added (read-only, from profile API)
};

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch current user from backend
  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user?.email) return null;

  const fallbackInitial = user.email[0].toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className="focus:outline-none cursor-pointer"
        aria-label="User menu"
      >
        <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center ring-1 ring-gray-300">
          <span className="text-sm font-medium text-gray-700">
            {fallbackInitial}
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-50">
          <div className="px-4 py-3 border-b">
            <p className="text-sm text-gray-500">Signed in as</p>
            <p className="text-sm font-medium truncate">
              {user.email}
            </p>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              router.push("/profile");
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
          >
            Account
          </button>

          {/* ✅ Admin entry (corporate admins only) */}
          {user.role === "ADMIN" && (
            <button
              onClick={() => {
                setOpen(false);
                router.push("/org-admin/users");
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
            >
              Admin
            </button>
          )}

          <a
            href="/auth/logout"
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
          >
            Logout
          </a>
        </div>
      )}
    </div>
  );
}
