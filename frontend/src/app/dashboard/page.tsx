'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMe, getResumes, logout, type User, type Resume } from '@/lib/auth';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getMe(), getResumes()])
            .then(([userData, resumeData]) => {
                setUser(userData);
                setResumes(resumeData);
            })
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    const handleLogout = async () => {
        await logout();
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
    };

    const latestResume = resumes.find(r => r.status === 'DONE');
    const activeResumes = resumes.filter(r => r.status === 'DONE').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navbar */}
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-bold text-violet-400">PlacementAI</h1>
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/dashboard" className="text-white text-sm font-medium">
                            Dashboard
                        </Link>
                        <Link href="/dashboard/resume" className="text-gray-400 hover:text-white text-sm transition">
                            Resume
                        </Link>
                        <Link href="/dashboard/applications" className="text-gray-400 hover:text-white text-sm transition">
                            Applications
                        </Link>
                        <Link href="/dashboard/roadmap" className="text-gray-400 hover:text-white text-sm transition">
                            Roadmap
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-white text-sm font-medium">{user?.full_name}</span>
                        <span className="text-gray-500 text-xs">{user?.email}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* Welcome */}
                <div className="mb-10">
                    <h2 className="text-3xl font-bold">
                        Welcome back, {user?.full_name?.split(' ')[0]} 👋
                    </h2>
                    <p className="text-gray-400 mt-2">
                        Here's your placement preparation overview
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Link href="/dashboard/resume"
                        className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-6 transition group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-gray-400 text-sm">ATS Score</p>
                            <span className="text-2xl">📄</span>
                        </div>
                        <p className="text-4xl font-bold text-white">
                            {latestResume ? latestResume.ats_score : '--'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                            {latestResume ? `${latestResume.skills.length} skills detected` : 'Upload your resume'}
                        </p>
                        <p className="text-violet-400 text-xs mt-3 group-hover:underline">
                            {latestResume ? 'View analysis →' : 'Get started →'}
                        </p>
                    </Link>

                    <Link href="/dashboard/applications"
                        className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-6 transition group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-gray-400 text-sm">Applications</p>
                            <span className="text-2xl">🎯</span>
                        </div>
                        <p className="text-4xl font-bold text-white">0</p>
                        <p className="text-gray-500 text-sm mt-1">Track your applications</p>
                        <p className="text-violet-400 text-xs mt-3 group-hover:underline">Add application →</p>
                    </Link>

                    <Link href="/dashboard/roadmap"
                        className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-6 transition group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-gray-400 text-sm">Roadmap</p>
                            <span className="text-2xl">🗺️</span>
                        </div>
                        <p className="text-4xl font-bold text-white">--</p>
                        <p className="text-gray-500 text-sm mt-1">Generate your roadmap</p>
                        <p className="text-violet-400 text-xs mt-3 group-hover:underline">Generate now →</p>
                    </Link>
                </div>

                {/* Resume Section */}
                {latestResume && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Latest Resume Analysis</h3>
                            <Link href="/dashboard/resume"
                                className="text-violet-400 text-sm hover:underline">
                                View all →
                            </Link>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-5xl font-bold text-green-400">{latestResume.ats_score}</p>
                                <p className="text-gray-500 text-xs mt-1">ATS Score</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-400 text-sm mb-2">Detected Skills ({latestResume.skills.length})</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {latestResume.skills.slice(0, 10).map(skill => (
                                        <span key={skill}
                                            className="px-2 py-0.5 bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs rounded-full">
                                            {skill}
                                        </span>
                                    ))}
                                    {latestResume.skills.length > 10 && (
                                        <span className="text-gray-500 text-xs self-center">
                                            +{latestResume.skills.length - 10} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/dashboard/resume"
                        className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-5 transition">
                        <div className="w-10 h-10 bg-violet-500/15 rounded-xl flex items-center justify-center text-violet-400 text-xl">
                            📄
                        </div>
                        <div>
                            <p className="text-white font-medium">
                                {activeResumes > 0 ? 'Analyse Another Resume' : 'Upload Your Resume'}
                            </p>
                            <p className="text-gray-500 text-sm">Get ATS score and AI suggestions</p>
                        </div>
                    </Link>

                    <Link href="/dashboard/roadmap"
                        className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-5 transition">
                        <div className="w-10 h-10 bg-teal-500/15 rounded-xl flex items-center justify-center text-teal-400 text-xl">
                            🗺️
                        </div>
                        <div>
                            <p className="text-white font-medium">Generate Career Roadmap</p>
                            <p className="text-gray-500 text-sm">AI-powered preparation plan</p>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}