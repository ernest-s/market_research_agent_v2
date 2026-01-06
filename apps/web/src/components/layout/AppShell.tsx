import { ReactNode } from "react"
import { TopBar } from "./TopBar"
import { Sidebar } from "./Sidebar"

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f9fafb",
            }}
        >
            {/* Top navigation */}
            <TopBar />

            {/* Body */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    overflow: "hidden",
                }}
            >
                {/* Sidebar */}
                <Sidebar />

                {/* Main content */}
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
    )
}
