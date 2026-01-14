"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SessionConflictPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleProceedHere = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const res = await fetch("/api/auth/session/override", {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Session override failed");
            }

            /**
             * IMPORTANT:
             * We hard-navigate to dashboard so Providers
             * re-runs revalidation with the NEW cookie.
             */
            window.location.href = "/dashboard";
        } catch (err) {
            console.error("Session override error:", err);
            setError("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        window.location.href = "/auth/logout";
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white w-full max-w-md rounded-lg border shadow p-6">
                <h1 className="text-xl font-semibold mb-3">
                    You’re already logged in elsewhere
                </h1>

                <p className="text-gray-600 mb-6">
                    Your account is active in another browser or device.
                    Continuing here will log out the other session.
                </p>

                {error && (
                    <p className="mb-4 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleProceedHere}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isSubmitting ? "Proceeding…" : "Proceed here"}
                    </button>
                </div>
            </div>
        </div>
    );
}
