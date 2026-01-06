"use client";

import Image from "next/image";
import UserMenu from "@/components/UserMenu";

export function TopBar() {
    return (
        <header
            style={{
                height: 56,
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
                backgroundColor: "#ffffff",
            }}
        >
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center" }}>
                <Image
                    src="/brand/logo.svg"
                    alt="InsightFlow"
                    width={140}
                    height={32}
                    priority
                />
            </div>

            {/* User menu */}
            <UserMenu />
        </header>
    );
}
