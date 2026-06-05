'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    generateRoadmap,
    getRoadmap,
    getRoadmapStatus,
    getResumes,
    type Roadmap,
    type RoadmapWeek,
    type Resume,
} from '@/lib/auth';

// ── Week Card ─────────────────────────────────────────────────────────────
function WeekCard({ week, isOpen, onToggle }: {
    week: RoadmapWeek;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-500/15 border border-violet-500/30 rounded-xl flex items-center justify-center">
                        <span className="text-violet-400 font-bold text-sm">W{week.week}</span>
                    </div>
                    <div className="text-left">
                        <p className="text-white font-medium">{week.theme}</p>
                        <p className="text-gray-500 text-sm">{week.focus}</p>
                    </div>
                </div>
                <span className="text-gray-400 text-lg transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▾
                </span>
            </button>

            {isOpen && (
                <div className="px-6 pb-6 space-y-5 border-t border-gray-800 pt-5">
                    {/* Goal */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                        <p className="text-green-400 text-xs font-medium mb-1">🎯 Weekly Goal</p>
                        <p className="text-gray-300 text-sm">{week.goal}</p>
                    </div>

                    {/* Daily Tasks */}
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-2">📋 Daily Tasks</p>
                        <ul className="space-y-2">
                            {week.daily_tasks.map((task, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-violet-400 text-xs mt-1 flex-shrink-0">
                                        {i + 1}.
                                    </span>
                                    <p className="text-gray-300 text-sm">{task}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    {week.resources?.length > 0 && (
                        <div>
                            <p className="text-gray-400 text-sm font-medium mb-2">📚 Resources</p>
                            <ul className="space-y-1">
                                {week.resources.map((resource, i) => (
                                    <li key={i} className="text-gray-300 text-sm flex gap-2">
                                        <span className="text-amber-400">•</span> {resource}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Skills Covered */}
                    {week.skills_covered?.length > 0 && (
                        <div>
                            <p className="text-gray-400 text-sm font-medium mb-2">🛠 Skills Covered</p>
                            <div className="flex flex-wrap gap-2">
                                {week.skills_covered.map((skill, i) => (
                                    <span key={i}
                                        className="px-2.5 py-1 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs rounded-full">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function RoadmapPage() {
    const router = useRouter();
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [targetRole, setTargetRole] = useState('SDE-1 at product startup');
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]));
    const [error, setError] = useState('');
    const [pendingRoadmapId, setPendingRoadmapId] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getRoadmap(), getResumes()])
            .then(([roadmapData, resumeData]) => {
                if (roadmapData && (roadmapData as any).id) {
                    setRoadmap(roadmapData as Roadmap);
                }
                setResumes(resumeData);
                if (resumeData.length > 0) {
                    const doneResume = resumeData.find(r => r.status === 'DONE');
                    if (doneResume) setSelectedResumeId(doneResume.id);
                }
            })
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    // Poll pending roadmap
    useEffect(() => {
        if (!pendingRoadmapId) return;

        const interval = setInterval(async () => {
            const status = await getRoadmapStatus(pendingRoadmapId);
            if (status.status === 'DONE') {
                const { getRoadmapById } = await import('@/lib/auth');
                const done = await getRoadmapById(pendingRoadmapId);
                setRoadmap(done);
                setGenerating(false);
                setPendingRoadmapId(null);
                clearInterval(interval);
            } else if (status.status === 'FAILED') {
                setError('Roadmap generation failed. Please try again.');
                setGenerating(false);
                setPendingRoadmapId(null);
                clearInterval(interval);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [pendingRoadmapId]);

    const handleGenerate = async () => {
        if (!targetRole.trim()) {
            setError('Please enter a target role');
            return;
        }
        setError('');
        setGenerating(true);

        try {
            const newRoadmap = await generateRoadmap(
                targetRole,
                selectedResumeId || undefined
            );
            setPendingRoadmapId(newRoadmap.id);
        } catch (err: any) {
            setError('Failed to start roadmap generation');
            setGenerating(false);
        }
    };

    const toggleWeek = (weekNum: number) => {
        setOpenWeeks(prev => {
            const next = new Set(prev);
            if (next.has(weekNum)) next.delete(weekNum);
            else next.add(weekNum);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navbar */}
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <Link href="/dashboard" className="text-xl font-bold text-violet-400">PlacementAI</Link>
                <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition">
                    ← Dashboard
                </Link>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">AI Career Roadmap</h1>
                    <p className="text-gray-400 mt-1">
                        Get a personalised 8-week preparation plan for your target role
                    </p>
                </div>

                {/* Generate Form */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">
                        {roadmap ? 'Generate New Roadmap' : 'Generate Your Roadmap'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Target Role
                            </label>
                            <input
                                type="text"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition"
                                placeholder="e.g. SDE-1 at product startup, Backend Engineer at fintech"
                                disabled={generating}
                            />
                        </div>

                        {resumes.filter(r => r.status === 'DONE').length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Base on Resume (optional)
                                </label>
                                <select
                                    value={selectedResumeId}
                                    onChange={(e) => setSelectedResumeId(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition"
                                    disabled={generating}
                                >
                                    <option value="">No resume selected</option>
                                    {resumes
                                        .filter(r => r.status === 'DONE')
                                        .map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.original_filename} (ATS: {r.ats_score})
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
                        >
                            {generating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating your roadmap...
                                </>
                            ) : (
                                roadmap ? '🔄 Regenerate Roadmap' : '🗺️ Generate Roadmap'
                            )}
                        </button>
                    </div>
                </div>

                {/* Roadmap Display */}
                {roadmap && roadmap.status === 'DONE' && roadmap.content?.weeks?.length > 0 && (
                    <div>
                        {/* Summary */}
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-violet-400 font-medium">
                                    {roadmap.content.target_role}
                                </span>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-400 text-sm">8-week plan</span>
                            </div>
                            <p className="text-gray-300 text-sm">{roadmap.content.summary}</p>
                        </div>

                        {/* Key Topics */}
                        {roadmap.content.key_topics?.length > 0 && (
                            <div className="mb-6">
                                <p className="text-gray-400 text-sm font-medium mb-2">Key Topics</p>
                                <div className="flex flex-wrap gap-2">
                                    {roadmap.content.key_topics.map((topic, i) => (
                                        <span key={i}
                                            className="px-3 py-1 bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-full">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weeks Accordion */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-semibold">Weekly Breakdown</h2>
                                <button
                                    onClick={() => setOpenWeeks(
                                        openWeeks.size === roadmap.content.weeks.length
                                            ? new Set()
                                            : new Set(roadmap.content.weeks.map(w => w.week))
                                    )}
                                    className="text-violet-400 text-sm hover:underline"
                                >
                                    {openWeeks.size === roadmap.content.weeks.length
                                        ? 'Collapse all'
                                        : 'Expand all'}
                                </button>
                            </div>
                            {roadmap.content.weeks.map(week => (
                                <WeekCard
                                    key={week.week}
                                    week={week}
                                    isOpen={openWeeks.has(week.week)}
                                    onToggle={() => toggleWeek(week.week)}
                                />
                            ))}
                        </div>

                        {/* Interview Tips */}
                        {roadmap.content.interview_tips?.length > 0 && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                                <p className="text-amber-400 font-medium mb-3">💡 Interview Tips</p>
                                <ul className="space-y-2">
                                    {roadmap.content.interview_tips.map((tip, i) => (
                                        <li key={i} className="text-gray-300 text-sm flex gap-2">
                                            <span className="text-amber-400 flex-shrink-0">{i + 1}.</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {!roadmap && !generating && (
                    <div className="text-center py-12 text-gray-600">
                        <div className="text-5xl mb-3">🗺️</div>
                        <p>No roadmap yet — generate one above!</p>
                    </div>
                )}
            </main>
        </div>
    );
}