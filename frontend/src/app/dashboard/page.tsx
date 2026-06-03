'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, logout } from '@/lib/auth';
import type { User } from '@/lib/auth';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMe()
            .then(setUser)
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    const handleLogout = async () => {
        await logout();
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-violet-400 text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navbar */}
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-violet-400">PlacementAI</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-400 hover:text-white transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold">
                        Welcome, {user?.full_name} 👋
                    </h2>
                    <p className="text-gray-400 mt-2">
                        Your placement preparation dashboard
                    </p>
                </div>

                {/* Placeholder cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'Resume Score', value: '--', desc: 'Upload your resume' },
                        { title: 'Applications', value: '0', desc: 'Track your applications' },
                        { title: 'Roadmap', value: '--', desc: 'Generate your roadmap' },
                    ].map((card) => (
                        <div
                            key={card.title}
                            className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
                        >
                            <p className="text-gray-400 text-sm">{card.title}</p>
                            <p className="text-4xl font-bold text-white mt-2">{card.value}</p>
                            <p className="text-gray-500 text-sm mt-1">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}