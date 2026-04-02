"use client";

import Image from "next/image";
import UserMenu from "@/components/UserMenu";
import type { AppSession } from "@/lib/requireSession";

export function TopBar({ session }: { session: AppSession }) {
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
            <Image
                src="/brand/logo.svg"
                alt="InsightFlow"
                width={140}
                height={32}
                priority
            />

            <UserMenu user={session.user} />
        </header>
    );
}
