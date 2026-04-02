import { ReactNode } from "react";
import { AppSession } from "@/lib/requireSession";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

export type AppShellProps = {
    children: ReactNode;
    session: AppSession;
};

export function AppShell({ children, session }: AppShellProps) {
    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f9fafb",
            }}
        >
            <TopBar session={session} />

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    overflow: "hidden",
                }}
            >
                <Sidebar />

                <main
                    style={{
                        flex: 1,
                        padding: 32,
                        overflowY: "auto",
                    }}
                >
                    <div
                        style={{
                            maxWidth: 960,
                            margin: "0 auto",
                            backgroundColor: "#ffffff",
                            borderRadius: 8,
                            padding: 32,
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
