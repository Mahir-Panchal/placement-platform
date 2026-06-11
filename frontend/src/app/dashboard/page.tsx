'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { getMe, getResumes, getRoadmap, logout, type User, type Resume } from '@/lib/auth';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
    applied: '#6366f1',
    oa: '#f59e0b',
    interview_1: '#8b5cf6',
    interview_2: '#a78bfa',
    offer: '#10b981',
    rejected: '#f43f5e',
};

const STATUS_LABELS: Record<string, string> = {
    applied: 'Applied',
    oa: 'OA',
    interview_1: 'Interview R1',
    interview_2: 'Interview R2',
    offer: 'Offer',
    rejected: 'Rejected',
};

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [latestRoadmap, setLatestRoadmap] = useState<any>(null);
    const [appStats, setAppStats] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userData, resumeData] = await Promise.all([
                    getMe(),
                    getResumes(),
                ]);
                setUser(userData);
                setResumes(resumeData);

                try {
                    const roadmapData = await getRoadmap();
                    if (roadmapData && (roadmapData as any).id) {
                        setLatestRoadmap(roadmapData);
                    }
                } catch { }

                try {
                    const statsRes = await api.get('/api/tracker/stats/');
                    if (statsRes.data) setAppStats(statsRes.data);
                } catch { }

            } catch {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const latestResume = resumes.find(r => r.status === 'DONE');
    const activeResumes = resumes.filter(r => r.status === 'DONE').length;

    // ── Chart data ────────────────────────────────────────────────────────
    const statusChartData = appStats
        ? Object.entries(appStats.by_status as Record<string, number>)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => ({
                name: STATUS_LABELS[status] ?? status,
                count,
                color: STATUS_COLORS[status] ?? '#6366f1',
            }))
        : [];

    const weeklyData = appStats?.weekly_timeline ?? [];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 text-white">

            {/* ── Welcome ──────────────────────────────────────────────── */}
            <div className="mb-10">
                <h2 className="text-3xl font-bold">
                    Welcome back, {user?.full_name?.split(' ')[0]} 👋
                </h2>
                <p className="text-gray-400 mt-2">
                    Here's your placement preparation overview
                </p>
            </div>

            {/* ── Stat Cards ───────────────────────────────────────────── */}
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
                        {latestResume
                            ? `${latestResume.skills.length} skills detected`
                            : 'Upload your resume'}
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
                    <p className="text-4xl font-bold text-white">{appStats?.total || 0}</p>
                    <p className="text-gray-500 text-sm mt-1">
                        {appStats?.by_status?.offer > 0
                            ? `${appStats.by_status.offer} offer(s) received 🎉`
                            : 'Track your applications'}
                    </p>
                    <p className="text-violet-400 text-xs mt-3 group-hover:underline">
                        {appStats?.total > 0 ? 'View all →' : 'Add application →'}
                    </p>
                </Link>

                <Link href="/dashboard/roadmap"
                    className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-6 transition group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-400 text-sm">Roadmap</p>
                        <span className="text-2xl">🗺️</span>
                    </div>
                    <p className="text-4xl font-bold text-white">
                        {latestRoadmap ? '8' : '--'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                        {latestRoadmap
                            ? `Weeks for ${latestRoadmap.target_role}`
                            : 'Generate your roadmap'}
                    </p>
                    <p className="text-violet-400 text-xs mt-3 group-hover:underline">
                        {latestRoadmap ? 'View roadmap →' : 'Generate now →'}
                    </p>
                </Link>
            </div>

            {/* ── Charts (only when data exists) ───────────────────────── */}
            {appStats && appStats.total > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                    {/* Applications by Status — Bar Chart */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-white mb-1">
                            Applications by Status
                        </h3>
                        <p className="text-gray-500 text-xs mb-4">
                            Breakdown of all tracked applications
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={statusChartData} barSize={28}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#1f2937"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#6b7280', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#6b7280', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#111827',
                                        border: '1px solid #1f2937',
                                        borderRadius: 8,
                                        color: '#f9fafb',
                                        fontSize: 12,
                                    }}
                                    cursor={{ fill: '#ffffff08' }}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Applications"
                                    radius={[4, 4, 0, 0]}
                                >
                                    {statusChartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Weekly Applications — Line Chart */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-white mb-1">
                            Weekly Applications
                        </h3>
                        <p className="text-gray-500 text-xs mb-4">
                            Applications added over the last 8 weeks
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={weeklyData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#1f2937"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="week"
                                    tick={{ fill: '#6b7280', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#6b7280', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#111827',
                                        border: '1px solid #1f2937',
                                        borderRadius: 8,
                                        color: '#f9fafb',
                                        fontSize: 12,
                                    }}
                                />
                                <Legend
                                    formatter={(v) => (
                                        <span style={{ color: '#9ca3af', fontSize: 11 }}>{v}</span>
                                    )}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="applications"
                                    name="Applications"
                                    stroke="#7c3aed"
                                    strokeWidth={2}
                                    dot={{ fill: '#7c3aed', r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── Resume Analysis ───────────────────────────────────────── */}
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
                            <p className="text-5xl font-bold text-green-400">
                                {latestResume.ats_score}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">ATS Score</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-400 text-sm mb-2">
                                Detected Skills ({latestResume.skills.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {latestResume.skills.slice(0, 10).map((skill: string) => (
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

            {/* ── Quick Actions ─────────────────────────────────────────── */}
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

        </div>
    );
}