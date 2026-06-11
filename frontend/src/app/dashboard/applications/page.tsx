'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Application {
    id: string;
    company_name: string;
    role: string;
    status: string;
    applied_date: string;
    notes: string;
    created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    applied: { label: 'Applied', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    oa: { label: 'OA', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    interview_1: { label: 'Interview 1', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    interview_2: { label: 'Interview 2', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
    offer: { label: 'Offer 🎉', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
    rejected: { label: 'Rejected', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [form, setForm] = useState({
        company_name: '',
        role: '',
        status: 'applied',
        applied_date: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [editId, setEditId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadData = async () => {
        try {
            const [appsRes, statsRes] = await Promise.all([
                api.get('/api/tracker/'),
                api.get('/api/tracker/stats/'),
            ]);
            setApplications(appsRes.data.results || appsRes.data);
            setStats(statsRes.data);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async () => {
        try {
            if (editId) {
                await api.patch(`/api/tracker/${editId}/`, form);
            } else {
                await api.post('/api/tracker/', form);
            }
            setShowForm(false);
            setEditId(null);
            setForm({
                company_name: '',
                role: '',
                status: 'applied',
                applied_date: new Date().toISOString().split('T')[0],
                notes: '',
            });
            await loadData();
        } catch { }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/api/tracker/${deleteId}/`);
            setDeleteId(null);
            await loadData();
        } catch { }
        finally { setDeleting(false); }
    };

    const handleEdit = (app: Application) => {
        setForm({
            company_name: app.company_name,
            role: app.role,
            status: app.status,
            applied_date: app.applied_date,
            notes: app.notes,
        });
        setEditId(app.id);
        setShowForm(true);
    };

    const filtered = applications
        .filter(a => !filterStatus || a.status === filterStatus)
        .filter(a => !search ||
            a.company_name.toLowerCase().includes(search.toLowerCase()) ||
            a.role.toLowerCase().includes(search.toLowerCase())
        );

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-6 py-10 text-white">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Application Tracker</h1>
                    <p className="text-gray-400 mt-1">Track all your placement applications</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditId(null); }}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                >
                    + Add Application
                </button>
            </div>

            {/* ── Stats ──────────────────────────────────────────────────── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total', value: stats.total, color: 'text-white' },
                        { label: 'This Week', value: stats.this_week, color: 'text-blue-400' },
                        { label: 'Offers', value: stats.by_status?.offer || 0, color: 'text-green-400' },
                        { label: 'Offer Rate', value: `${stats.offer_rate}%`, color: 'text-violet-400' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filters ────────────────────────────────────────────────── */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search company or role..."
                    className="flex-1 min-w-48 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition"
                />
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                >
                    <option value="">All Status</option>
                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* ── Applications List ───────────────────────────────────────── */}
            {filtered.length > 0 ? (
                <div className="space-y-3">
                    {filtered.map(app => (
                        <div key={app.id}
                            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-lg font-bold text-gray-400">
                                    {app.company_name[0]}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{app.company_name}</p>
                                    <p className="text-gray-500 text-sm">{app.role}</p>
                                    <p className="text-gray-600 text-xs mt-0.5">{app.applied_date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_CONFIG[app.status]?.color}`}>
                                    {STATUS_CONFIG[app.status]?.label}
                                </span>
                                <button
                                    onClick={() => handleEdit(app)}
                                    className="text-gray-400 hover:text-white text-sm transition"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setDeleteId(app.id)}
                                    className="text-red-400 hover:text-red-300 text-sm transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-600">
                    <div className="text-5xl mb-3">🎯</div>
                    <p>{search || filterStatus ? 'No matching applications' : 'No applications yet — add your first one!'}</p>
                </div>
            )}

            {/* ── Add / Edit Modal ────────────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold">
                                {editId ? 'Edit Application' : 'Add Application'}
                            </h2>
                            <button
                                onClick={() => { setShowForm(false); setEditId(null); }}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Company Name"
                                value={form.company_name}
                                onChange={e => setForm({ ...form, company_name: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition"
                            />
                            <input
                                type="text"
                                placeholder="Role (e.g. SDE-1)"
                                value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition"
                            />
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                            >
                                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={form.applied_date}
                                onChange={e => setForm({ ...form, applied_date: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                            />
                            <textarea
                                placeholder="Notes (optional)"
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition resize-none"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={!form.company_name || !form.role}
                                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition"
                            >
                                {editId ? 'Update Application' : 'Add Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ───────────────────────────────── */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 text-center">
                        <span className="text-4xl">🗑️</span>
                        <h2 className="text-lg font-semibold text-white mt-3">Delete Application?</h2>
                        <p className="text-gray-400 text-sm mt-2 mb-6">
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium transition"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}