'use client';

import Link from 'next/link';

export default function ApplicationsPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <Link href="/dashboard" className="text-xl font-bold text-violet-400">PlacementAI</Link>
                <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition">← Dashboard</Link>
                <Link href="/dashboard/knowledge"
                    className="bg-gray-900 border border-gray-800 hover:border-violet-500/50 rounded-2xl p-6 transition group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-400 text-sm">Knowledge Base</p>
                        <span className="text-2xl">📚</span>
                    </div>
                    <p className="text-4xl font-bold text-white">--</p>
                    <p className="text-gray-500 text-sm mt-1">Upload study materials</p>
                    <p className="text-violet-400 text-xs mt-3 group-hover:underline">Add documents →</p>
                </Link>
            </nav>
            <main className="max-w-3xl mx-auto px-6 py-20 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h1 className="text-3xl font-bold mb-2">Application Tracker</h1>
                <p className="text-gray-400 mb-6">Track all your job applications in one place</p>
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-sm">
                    Coming in Week 4
                </div>
            </main>
        </div>
    );
}