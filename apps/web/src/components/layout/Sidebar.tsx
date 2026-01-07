"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
    label: string;
    href?: string;
    children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
    },
    {
        label: "Quantitative Research",
        href: "/quantitative",
    },
    {
        label: "Qualitative Research",
        children: [
            {
                label: "Pricing Research",
                href: "/qualitative/pricing",
            },
            {
                label: "Concept Testing",
                href: "/qualitative/concept-testing",
            },
        ],
    },
    {
        label: "Create Study",
        href: "/create-study",
    },
    {
        label: "Live Interview Agent",
        href: "/live-agent",
    },
    {
        label: "Analysis & Reports",
        href: "/analysis",
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
                    const isActive =
                        item.href && pathname.startsWith(item.href);

                    const isHovered = hoveredItem === item.label;

                    return (
                        <div
                            key={item.label}
                            style={{
                                marginBottom: 6,
                                marginTop: index === 1 ? 8 : 0, // subtle spacing after Dashboard
                            }}
                            onMouseEnter={() => setHoveredItem(item.label)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            {/* Parent item */}
                            {item.href ? (
                                <Link
                                    href={item.href}
                                    style={{
                                        display: "block",
                                        padding: "10px 12px",
                                        borderRadius: 8,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        textDecoration: "none",
                                        color: "#111827",
                                        backgroundColor: isActive
                                            ? "#e5e7eb"
                                            : "transparent",
                                    }}
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <div
                                    style={{
                                        padding: "10px 12px",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: "#111827",
                                        cursor: "default",
                                    }}
                                >
                                    {item.label}
                                </div>
                            )}

                            {/* Sub-menu (hover only) */}
                            {item.children && isHovered && (
                                <div
                                    style={{
                                        marginLeft: 12,
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
                                                    display: "block",
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
                                                {child.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
