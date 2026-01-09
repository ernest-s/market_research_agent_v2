"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Home,
    BarChart,
    Brain,
    DollarSign,
    FlaskConical,
    Plus,
    Headphones,
    LineChart,
    ChevronDown,
} from "lucide-react";

type NavItem = {
    label: string;
    href?: string;
    icon: React.ReactNode;
    children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: <Home size={18} />,
    },
    {
        label: "Quantitative Research",
        href: "/quantitative",
        icon: <BarChart size={18} />,
    },
    {
        label: "Qualitative Research",
        icon: <Brain size={18} />,
        children: [
            {
                label: "Pricing Research",
                href: "/qualitative/pricing",
                icon: <DollarSign size={16} />,
            },
            {
                label: "Concept Testing",
                href: "/qualitative/concept-testing",
                icon: <FlaskConical size={16} />,
            },
        ],
    },
    {
        label: "Create Study",
        href: "/create-study",
        icon: <Plus size={18} />,
    },
    {
        label: "Live Interview Agent",
        href: "/live-agent",
        icon: <Headphones size={18} />,
    },
    {
        label: "Analysis & Reports",
        href: "/analysis",
        icon: <LineChart size={18} />,
    },
];

const STORAGE_KEY = "sidebar-expanded";

export function Sidebar() {
    const pathname = usePathname();

    const [expanded, setExpanded] = useState<string[]>([]);

    /**
     * Load persisted expanded state
     */
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setExpanded(JSON.parse(stored));
        }
    }, []);

    /**
     * Persist expanded state
     */
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
    }, [expanded]);

    /**
     * Ensure active parent is expanded
     */
    useEffect(() => {
        NAV_ITEMS.forEach((item) => {
            if (
                item.children?.some(
                    (child) =>
                        pathname === child.href ||
                        pathname.startsWith(child.href + "/")
                )
            ) {
                setExpanded((prev) =>
                    prev.includes(item.label) ? prev : [...prev, item.label]
                );
            }
        });
    }, [pathname]);

    const toggleExpand = (label: string) => {
        setExpanded((prev) =>
            prev.includes(label)
                ? prev.filter((l) => l !== label)
                : [...prev, label]
        );
    };

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
                    const isExpanded = expanded.includes(item.label);

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
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => toggleExpand(item.label)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            toggleExpand(item.label);
                                        }
                                    }}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px 12px",
                                        borderRadius: 8,
                                        fontSize: 14,
                                        fontWeight: isActive ? 700 : 600,
                                        backgroundColor: isActive
                                            ? "#e5e7eb"
                                            : "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#111827",
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        {item.icon}
                                        {item.label}
                                    </span>

                                    <ChevronDown
                                        size={16}
                                        style={{
                                            transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    />
                                </button>
                            )}

                            {/* Sub-menu */}
                            {item.children && (
                                <div
                                    style={{
                                        maxHeight: isExpanded ? 500 : 0,
                                        overflow: "hidden",
                                        transition: "max-height 0.25s ease",
                                    }}
                                >
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
                                                    {child.icon}
                                                    <span>{child.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
