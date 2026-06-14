'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    full_name: string;
    email: string;
}

type Section = 'profile' | 'password' | 'notifications' | 'danger';

export default function SettingsPage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<Section>('profile');

    // Profile form
    const [profileForm, setProfileForm] = useState({ full_name: '' });
    const [profileMsg, setProfileMsg] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [passwordMsg, setPasswordMsg] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    // Notifications
    const [weeklyEmail, setWeeklyEmail] = useState(true);
    const [staleReminder, setStaleReminder] = useState(true);
    const [savingNotifs, setSavingNotifs] = useState(false);
    const [notifMsg, setNotifMsg] = useState('');

    // Danger zone
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/auth/me/');
                setUser(res.data);
                setProfileForm({ full_name: res.data.full_name ?? '' });
            } catch {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    // ── Profile update ──────────────────────────────────────────────────────
    const handleProfileSave = async () => {
        setSavingProfile(true);
        setProfileMsg('');
        try {
            await api.patch('/api/auth/me/', profileForm);
            setProfileMsg('Profile updated successfully!');
            setUser(u => u ? { ...u, ...profileForm } : u);
        } catch {
            setProfileMsg('Failed to update profile.');
        } finally {
            setSavingProfile(false);
            setTimeout(() => setProfileMsg(''), 3000);
        }
    };

    // ── Password change ─────────────────────────────────────────────────────
    const handlePasswordChange = async () => {
        setPasswordError('');
        setPasswordMsg('');

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setPasswordError('New passwords do not match');
            return;
        }
        if (passwordForm.new_password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        setSavingPassword(true);
        try {
            const refresh = localStorage.getItem('refresh_token');
            await api.patch('/api/auth/me/password/', {
                old_password: passwordForm.old_password,
                new_password: passwordForm.new_password,
                refresh_token: refresh,
            });
            setPasswordMsg('Password changed! Please log in again.');
            setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
            // Log out after password change
            setTimeout(() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setPasswordError(
                err?.response?.data?.error ?? 'Failed to change password'
            );
        } finally {
            setSavingPassword(false);
        }
    };

    // ── Notifications (local state only — no backend yet) ───────────────────
    const handleNotifSave = async () => {
        setSavingNotifs(true);
        await new Promise(r => setTimeout(r, 500)); // simulate save
        setNotifMsg('Preferences saved!');
        setSavingNotifs(false);
        setTimeout(() => setNotifMsg(''), 3000);
    };

    // ── Account deletion ────────────────────────────────────────────────────
    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETE') return;
        setDeleting(true);
        try {
            await api.delete('/api/auth/me/');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            router.push('/login');
        } catch {
            setDeleting(false);
        }
    };

    const SIDEBAR_ITEMS: { key: Section; label: string; icon: string }[] = [
        { key: 'profile', label: 'Profile', icon: '→' },
        { key: 'password', label: 'Password', icon: '→' },
        { key: 'notifications', label: 'Notifications', icon: '→' },
        { key: 'danger', label: 'Danger Zone', icon: '→' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-6 py-10 text-white">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-400 text-sm mt-1">
                    Manage your account and preferences
                </p>
            </div>

            <div className="flex gap-6">

                {/* ── Settings Sidebar ─────────────────────────────────────── */}
                <aside className="w-48 shrink-0">
                    <nav className="space-y-1">
                        {SIDEBAR_ITEMS.map(item => (
                            <button
                                key={item.key}
                                onClick={() => setActiveSection(item.key)}
                                className={`
                                        w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition
                                        border-l-2
                                        ${activeSection === item.key
                                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                                        : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'}
                                        ${item.key === 'danger'
                                        ? '<mt-2></mt-2> hover:text-rose-400 hover:bg-rose-500/5 hover:border-rose-500' : ''}
                                    `}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* ── Content ──────────────────────────────────────────────── */}
                <div className="flex-1">

                    {/* ── Profile ────────────────────────────────────────────── */}
                    {activeSection === 'profile' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-6">Profile Information</h2>

                            {/* Avatar */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-2xl font-bold">
                                    {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{user?.full_name}</p>
                                    <p className="text-gray-500 text-sm">{user?.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.full_name}
                                        onChange={e => setProfileForm({ full_name: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email ?? ''}
                                        disabled
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-500 text-sm cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
                                </div>

                                {profileMsg && (
                                    <p className="text-sm text-emerald-400">{profileMsg}</p>
                                )}

                                <button
                                    onClick={handleProfileSave}
                                    disabled={savingProfile}
                                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                                >
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>

                            {/* Connected accounts */}
                            <div className="mt-8 pt-6 border-t border-gray-800">
                                <h3 className="text-sm font-semibold text-white mb-4">
                                    Connected Accounts
                                </h3>
                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">🔵</span>
                                        <div>
                                            <p className="text-sm font-medium text-white">Google</p>
                                            <p className="text-xs text-gray-500">
                                                {user?.email ?? 'Not connected'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                        Connected
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Password ────────────────────────────────────────────── */}
                    {activeSection === 'password' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-6">Change Password</h2>
                            <div className="space-y-4 max-w-sm">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.old_password}
                                        onChange={e => setPasswordForm(f => ({ ...f, old_password: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.new_password}
                                        onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirm_password}
                                        onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-sm text-rose-400">{passwordError}</p>
                                )}
                                {passwordMsg && (
                                    <p className="text-sm text-emerald-400">{passwordMsg}</p>
                                )}

                                <button
                                    onClick={handlePasswordChange}
                                    disabled={savingPassword || !passwordForm.old_password || !passwordForm.new_password}
                                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                                >
                                    {savingPassword ? 'Changing...' : 'Change Password'}
                                </button>

                                <p className="text-xs text-gray-600">
                                    You will be logged out after changing your password.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Notifications ───────────────────────────────────────── */}
                    {activeSection === 'notifications' && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>

                            <div className="space-y-4">
                                {/* Weekly summary toggle */}
                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Weekly Placement Summary
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Receive a weekly email with your application stats every Monday
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setWeeklyEmail(v => !v)}
                                        className={`
                                            relative w-11 h-6 rounded-full transition-colors duration-200
                                            ${weeklyEmail ? 'bg-violet-600' : 'bg-gray-700'}
                                        `}
                                    >
                                        <span className={`
                                            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
                                            transition-transform duration-200
                                            ${weeklyEmail ? 'translate-x-5' : 'translate-x-0'}
                                        `} />
                                    </button>
                                </div>

                                {/* Stale reminder toggle */}
                                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Stale Application Reminders
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Get reminded about applications with no update in 7+ days
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setStaleReminder(v => !v)}
                                        className={`
                                            relative w-11 h-6 rounded-full transition-colors duration-200
                                            ${staleReminder ? 'bg-violet-600' : 'bg-gray-700'}
                                        `}
                                    >
                                        <span className={`
                                            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
                                            transition-transform duration-200
                                            ${staleReminder ? 'translate-x-5' : 'translate-x-0'}
                                        `} />
                                    </button>
                                </div>
                            </div>

                            {notifMsg && (
                                <p className="text-sm text-emerald-400 mt-4">{notifMsg}</p>
                            )}

                            <button
                                onClick={handleNotifSave}
                                disabled={savingNotifs}
                                className="mt-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                            >
                                {savingNotifs ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    )}

                    {/* ── Danger Zone ─────────────────────────────────────────── */}
                    {activeSection === 'danger' && (
                        <div className="bg-gray-900 border border-rose-500/20 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-rose-400 mb-2">
                                Danger Zone
                            </h2>
                            <p className="text-gray-500 text-sm mb-6">
                                These actions are irreversible. Please proceed with caution.
                            </p>

                            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-white">Delete Account</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Permanently deactivate your account. All your data will be retained
                                            but you won't be able to log in.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-xl transition"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete Account Modal ────────────────────────────────────── */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6">
                        <div className="text-center mb-6">
                            <span className="text-4xl">⚠️</span>
                            <h2 className="text-lg font-semibold text-white mt-3">
                                Delete your account?
                            </h2>
                            <p className="text-gray-400 text-sm mt-2">
                                Type <span className="text-rose-400 font-mono font-bold">DELETE</span> to confirm.
                            </p>
                        </div>

                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500 transition mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirm !== 'DELETE' || deleting}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium transition"
                            >
                                {deleting ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}