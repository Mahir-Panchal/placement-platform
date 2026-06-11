"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/dashboard/resume", label: "Resume", icon: "📄" },
    { href: "/dashboard/roadmap", label: "Career Roadmap", icon: "🗺️" },
    { href: "/dashboard/knowledge", label: "Knowledge Base", icon: "🧠" },
    { href: "/dashboard/applications", label: "Applications", icon: "💼" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

interface User {
    full_name: string;
    email: string;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/login');
            return;
        }
        // Only fetch once — guard with a flag
        let cancelled = false;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (r.status === 401) {
                    router.push('/login');
                    return null;
                }
                return r.json();
            })
            .then((data) => {
                if (!cancelled && data) setUser(data);
            })
            .catch(() => {
                if (!cancelled) router.push('/login');
            });
        return () => { cancelled = true; };
    }, []);

    const initials = user?.full_name
        ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout/`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch { }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-950 flex">

            {/* ── Sidebar ────────────────────────────────────────────────────── */}
            <aside
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
                className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          bg-gray-900 border-r border-gray-800
          transition-all duration-300 ease-in-out
          ${expanded ? "w-56" : "w-14"}
        `}
            >
                {/* Logo */}
                <div className="flex items-center h-16 px-3 border-b border-gray-800 overflow-hidden">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-xs">
                        AI
                    </div>
                    {expanded && (
                        <div className="ml-3 overflow-hidden whitespace-nowrap">
                            <p className="text-white font-semibold text-sm">Placement</p>
                            <p className="text-gray-500 text-xs">Intelligence</p>
                        </div>
                    )}
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-4 space-y-1 px-2 overflow-hidden">
                    {NAV_LINKS.map((link) => {
                        const isActive =
                            link.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`
                  flex items-center gap-3 px-2 py-2.5 rounded-lg
                  transition-colors duration-150 whitespace-nowrap overflow-hidden
                  ${isActive
                                        ? "bg-violet-500/15 text-violet-400"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                                    }
                `}
                            >
                                <span className="text-lg shrink-0 w-5 text-center">{link.icon}</span>
                                {expanded && (
                                    <span className="text-sm font-medium">{link.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User footer */}
                <div className="px-2 py-4 border-t border-gray-800 overflow-hidden">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
                        <div className="w-7 h-7 shrink-0 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold">
                            {initials}
                        </div>
                        {expanded && (
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">
                                    {user?.full_name ?? "..."}
                                </p>
                                <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                    {expanded && (
                        <button
                            onClick={handleLogout}
                            className="w-full mt-1 text-xs text-gray-500 hover:text-rose-400 transition-colors py-1.5 rounded-lg hover:bg-rose-500/5 text-left px-2"
                        >
                            → Sign out
                        </button>
                    )}
                </div>
            </aside>

            {/* ── Main content — offset by collapsed sidebar width ───────────── */}
            <div className="flex-1 flex flex-col min-w-0 ml-14">
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>

        </div>
    );
}