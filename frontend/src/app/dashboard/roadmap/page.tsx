'use client';

import Link from 'next/link';

export default function RoadmapPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <Link href="/dashboard" className="text-xl font-bold text-violet-400">PlacementAI</Link>
                <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition">← Dashboard</Link>
            </nav>
            <main className="max-w-3xl mx-auto px-6 py-20 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h1 className="text-3xl font-bold mb-2">AI Career Roadmap</h1>
                <p className="text-gray-400 mb-6">Get a personalised preparation roadmap based on your resume</p>
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-sm">
                    Coming in Week 3
                </div>
            </main>
        </div>
    );
}