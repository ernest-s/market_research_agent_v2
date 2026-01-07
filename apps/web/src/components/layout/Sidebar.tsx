"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
    label: string;
    href?: string;
    icon?: string;
    children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: "🏠",
    },
    {
        label: "Quantitative Research",
        href: "/quantitative",
        icon: "📊",
    },
    {
        label: "Qualitative Research",
        icon: "🧠",
        children: [
            {
                label: "Pricing Research",
                href: "/qualitative/pricing",
                icon: "💰",
            },
            {
                label: "Concept Testing",
                href: "/qualitative/concept-testing",
                icon: "🧪",
            },
        ],
    },
    {
        label: "Create Study",
        href: "/create-study",
        icon: "➕",
    },
    {
        label: "Live Interview Agent",
        href: "/live-agent",
        icon: "🎧",
    },
    {
        label: "Analysis & Reports",
        href: "/analysis",
        icon: "📈",
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    return (
        <aside
            style={{
                width: 260,
                borderRight: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                paddingTop: 16,
            }}
        >
            <nav style={{ padding: "0 12px" }}>
                {NAV_ITEMS.map((item, index) => {
                    const isDirectActive =
                        item.href && pathname.startsWith(item.href);

                    const isChildActive =
                        item.children?.some(
                            (child) =>
                                pathname === child.href ||
                                pathname.startsWith(child.href + "/")
                        ) ?? false;

                    const isActive = isDirectActive || isChildActive;
                    const isHovered = hoveredItem === item.label;

                    return (
                        <div key={item.label}>
                            {/* Divider after Dashboard */}
                            {index === 1 && (
                                <div
                                    style={{
                                        height: 1,
                                        backgroundColor: "#e5e7eb",
                                        margin: "12px 8px",
                                    }}
                                />
                            )}

                            <div
                                style={{ marginBottom: 6 }}
                                onMouseEnter={() => setHoveredItem(item.label)}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                {/* Parent item */}
                                {item.href ? (
                                    <Link
                                        href={item.href}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "10px 12px",
                                            borderRadius: 8,
                                            fontSize: 14,
                                            fontWeight: isActive ? 700 : 600,
                                            textDecoration: "none",
                                            color: "#111827",
                                            backgroundColor: isActive
                                                ? "#e5e7eb"
                                                : "transparent",
                                        }}
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                ) : (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "10px 12px",
                                            fontSize: 14,
                                            fontWeight: isActive ? 700 : 600,
                                            color: "#111827",
                                            backgroundColor: isActive
                                                ? "#e5e7eb"
                                                : "transparent",
                                            borderRadius: 8,
                                            cursor: "default",
                                        }}
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </div>
                                )}

                                {/* Sub-menu (hover or active) */}
                                {item.children && (isHovered || isActive) && (
                                    <div
                                        style={{
                                            marginLeft: 28,
                                            marginTop: 4,
                                            borderLeft: "2px solid #e5e7eb",
                                            paddingLeft: 8,
                                        }}
                                    >
                                        {item.children.map((child) => {
                                            const isChildActive =
                                                pathname === child.href ||
                                                pathname.startsWith(child.href + "/");

                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href!}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        padding: "8px 12px",
                                                        borderRadius: 6,
                                                        fontSize: 13,
                                                        marginBottom: 4,
                                                        textDecoration: "none",
                                                        color: "#374151",
                                                        backgroundColor: isChildActive
                                                            ? "#eef2ff"
                                                            : "transparent",
                                                        fontWeight: isChildActive ? 600 : 400,
                                                    }}
                                                >
                                                    <span>{child.icon}</span>
                                                    <span>{child.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
