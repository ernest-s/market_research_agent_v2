import { ReactNode } from "react";
import { requireAppSession } from "@/lib/requireAppSession";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await requireAppSession();
    return <AppShell session={session}>{children}</AppShell>;
}
