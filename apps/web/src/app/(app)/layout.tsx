import { ReactNode } from "react"
import { requireAppSession } from "@/lib/requireAppSession"
import { AppShell } from "@/components/layout/AppShell"

export default async function AppLayout({
    children,
}: {
    children: ReactNode
}) {
    await requireAppSession()

    return <AppShell>{children}</AppShell>
}
