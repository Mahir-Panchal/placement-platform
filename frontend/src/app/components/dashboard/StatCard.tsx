interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: string;
    accent?: string;
    loading?: boolean;
}

export default function StatCard({
    label, value, sub, icon, accent = "#6366f1", loading = false,
}: StatCardProps) {
    if (loading) {
        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse">
                <div className="h-3 w-20 bg-white/10 rounded mb-4" />
                <div className="h-8 w-16 bg-white/10 rounded mb-2" />
                <div className="h-3 w-24 bg-white/10 rounded" />
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                    {label}
                </span>
                <span className="text-xl">{icon}</span>
            </div>
            <span className="text-3xl font-bold text-white tabular-nums" style={{ color: accent }}>
                {value}
            </span>
            {sub && <span className="text-xs text-slate-500 mt-1">{sub}</span>}
            <div
                className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 blur-2xl"
                style={{ background: accent }}
            />
        </div>
    );
}