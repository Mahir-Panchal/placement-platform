'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    uploadResume,
    getResumes,
    getResumeStatus,
    getResumeSuggestions,
    deleteResume,
    type Resume,
    type AISuggestions,
} from '@/lib/auth';

// ── ATS Score Ring ────────────────────────────────────────────────────────
function ATSScoreRing({ score }: { score: number }) {
    const color =
        score >= 76 ? '#22c55e' : score >= 51 ? '#f59e0b' : '#ef4444';
    const label =
        score >= 76 ? 'Excellent' : score >= 51 ? 'Good' : 'Needs Work';

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10" />
                    <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={color} strokeWidth="10"
                        strokeDasharray={`${(score / 100) * 314} 314`}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{score}</span>
                    <span className="text-xs text-gray-400">/ 100</span>
                </div>
            </div>
            <span className="text-sm font-medium" style={{ color }}>{label}</span>
        </div>
    );
}

// ── Skill Badge ───────────────────────────────────────────────────────────
function SkillBadge({ skill }: { skill: string }) {
    return (
        <span className="px-2.5 py-1 bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs rounded-full">
            {skill}
        </span>
    );
}

// ── Resume Card ───────────────────────────────────────────────────────────
function ResumeCard({
    resume,
    onDelete,
    onViewSuggestions,
}: {
    resume: Resume;
    onDelete: (id: string) => void;
    onViewSuggestions: (id: string) => void;
}) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-white font-medium">{resume.original_filename}</p>
                    <p className="text-gray-500 text-xs mt-1">
                        {new Date(resume.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        })}
                    </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${resume.status === 'DONE' ? 'bg-green-500/15 text-green-400' :
                    resume.status === 'PROCESSING' ? 'bg-amber-500/15 text-amber-400' :
                        resume.status === 'FAILED' ? 'bg-red-500/15 text-red-400' :
                            'bg-gray-500/15 text-gray-400'
                    }`}>
                    {resume.status}
                </span>
            </div>

            {resume.status === 'DONE' && (
                <>
                    <div className="flex items-center gap-6 mb-4">
                        <ATSScoreRing score={resume.ats_score} />
                        <div className="flex-1">
                            <p className="text-gray-400 text-sm mb-2">Detected Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {resume.skills.slice(0, 8).map(skill => (
                                    <SkillBadge key={skill} skill={skill} />
                                ))}
                                {resume.skills.length > 8 && (
                                    <span className="text-gray-500 text-xs self-center">
                                        +{resume.skills.length - 8} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onViewSuggestions(resume.id)}
                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg transition"
                        >
                            View AI Suggestions
                        </button>
                        <button
                            onClick={() => onDelete(resume.id)}
                            className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition text-sm"
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}

            {resume.status === 'PROCESSING' && (
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Processing your resume...
                </div>
            )}
        </div>
    );
}

// ── AI Suggestions Panel ──────────────────────────────────────────────────
function SuggestionsPanel({
    suggestions,
    onClose,
}: {
    suggestions: any;
    onClose: () => void;
}) {
    const s: AISuggestions = suggestions.suggestions;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white font-semibold">AI Resume Analysis</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary */}
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                        <p className="text-violet-300 text-sm">{s.summary_feedback}</p>
                    </div>

                    {/* Strengths */}
                    {s.strengths?.length > 0 && (
                        <div>
                            <h3 className="text-green-400 font-medium mb-2">✓ Strengths</h3>
                            <ul className="space-y-1">
                                {s.strengths.map((item, i) => (
                                    <li key={i} className="text-gray-300 text-sm flex gap-2">
                                        <span className="text-green-400 mt-0.5">•</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Improvements */}
                    {s.improvements?.length > 0 && (
                        <div>
                            <h3 className="text-amber-400 font-medium mb-2">⚠ Improvements</h3>
                            <div className="space-y-3">
                                {s.improvements.map((item, i) => (
                                    <div key={i} className="bg-gray-800 rounded-xl p-4">
                                        <p className="text-amber-400 text-xs font-medium mb-1">{item.section}</p>
                                        <p className="text-gray-400 text-sm mb-2">{item.issue}</p>
                                        <p className="text-green-400 text-sm">→ {item.fix}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing Skills */}
                    {s.missing_skills?.length > 0 && (
                        <div>
                            <h3 className="text-red-400 font-medium mb-2">✗ Missing Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {s.missing_skills.map((skill, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-300 text-xs rounded-full">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Items */}
                    {s.action_items?.length > 0 && (
                        <div>
                            <h3 className="text-blue-400 font-medium mb-2">→ Action Items</h3>
                            <ul className="space-y-1">
                                {s.action_items.map((item, i) => (
                                    <li key={i} className="text-gray-300 text-sm flex gap-2">
                                        <span className="text-blue-400">{i + 1}.</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ResumePage() {
    const router = useRouter();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState<any>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Load resumes on mount
    useEffect(() => {
        getResumes()
            .then(setResumes)
            .catch(() => router.push('/login'));
    }, [router]);

    // Poll pending/processing resumes
    useEffect(() => {
        const pending = resumes.filter(
            r => r.status === 'PENDING' || r.status === 'PROCESSING'
        );
        if (pending.length === 0) return;

        const interval = setInterval(async () => {
            for (const resume of pending) {
                const status = await getResumeStatus(resume.id);
                if (status.status === 'DONE' || status.status === 'FAILED') {
                    // Refresh the full list
                    const updated = await getResumes();
                    setResumes(updated);
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [resumes]);

    const handleUpload = async (file: File) => {
        if (!file.name.endsWith('.pdf')) {
            setError('Only PDF files are allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('File must be under 5MB');
            return;
        }

        setError('');
        setUploading(true);
        try {
            const resume = await uploadResume(file);
            setResumes(prev => [resume, ...prev]);
        } catch (err: any) {
            setError(err.response?.data?.file?.[0] || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    }, []);

    const handleDelete = async (id: string) => {
        await deleteResume(id);
        setResumes(prev => prev.filter(r => r.id !== id));
    };

    const handleViewSuggestions = async (id: string) => {
        setLoadingSuggestions(true);
        try {
            const data = await getResumeSuggestions(id);
            setSuggestions(data);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navbar */}
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <Link href="/dashboard" className="text-xl font-bold text-violet-400">
                    PlacementAI
                </Link>
                <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition">
                    ← Dashboard
                </Link>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Resume Intelligence</h1>
                    <p className="text-gray-400 mt-1">Upload your resume for ATS scoring and AI-powered suggestions</p>
                </div>

                {/* Upload Zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition mb-8 ${dragOver
                        ? 'border-violet-500 bg-violet-500/5'
                        : 'border-gray-700 hover:border-gray-600'
                        }`}
                >
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-white font-medium mb-1">
                        {uploading ? 'Uploading...' : 'Drop your resume here'}
                    </p>
                    <p className="text-gray-500 text-sm mb-4">PDF only, max 5MB</p>

                    <label className={`cursor-pointer inline-block px-5 py-2.5 rounded-lg text-sm font-medium transition ${uploading
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-violet-600 hover:bg-violet-700 text-white'
                        }`}>
                        {uploading ? 'Processing...' : 'Choose File'}
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                        />
                    </label>

                    {error && (
                        <p className="text-red-400 text-sm mt-3">{error}</p>
                    )}
                </div>

                {/* Resume List */}
                {resumes.length > 0 ? (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-300">Your Resumes</h2>
                        {resumes.map(resume => (
                            <ResumeCard
                                key={resume.id}
                                resume={resume}
                                onDelete={handleDelete}
                                onViewSuggestions={handleViewSuggestions}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-600 py-10">
                        No resumes uploaded yet
                    </div>
                )}
            </main>

            {/* AI Suggestions Modal */}
            {loadingSuggestions && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="text-violet-400 text-lg">Loading AI analysis...</div>
                </div>
            )}
            {suggestions && (
                <SuggestionsPanel
                    suggestions={suggestions}
                    onClose={() => setSuggestions(null)}
                />
            )}
        </div>
    );
}