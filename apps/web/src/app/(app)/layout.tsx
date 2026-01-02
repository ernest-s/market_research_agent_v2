import { ReactNode } from "react";
import { requireAppSession } from "@/lib/requireAppSession";

export default async function AppLayout({
    children,
}: {
    children: ReactNode;
}) {
    // Enforce authentication for all app routes
    // Will redirect to /login if session is invalid or missing
    await requireAppSession();

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {children}
        </div>
    );
}
