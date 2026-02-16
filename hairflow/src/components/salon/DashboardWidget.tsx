"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface DashboardStats {
    totalAnalysisCount: number;
    activeStaffCount: number;
    todayAnalysisCount: number;
    contributionStats: {
        designerId: string;
        name: string;
        avatarUrl: string | null;
        count: number;
        percentage: number;
    }[];
}

export default function DashboardWidget() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/organization/dashboard');
                if (res.ok) {
                    const { data } = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="h-40 animate-pulse bg-white/5 rounded-lg" />;
    if (!stats) return null;

    return (
        <div className="bg-charcoal/50 border border-gold/20 rounded-xl p-6 backdrop-blur-sm shadow-luxury-sm">
            <h3 className="font-heading text-2xl text-white mb-6 flex items-center gap-2">
                <span className="text-gold">Admin</span> Dashboard
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 p-4 rounded-lg text-center border border-white/5">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Total Analysis</div>
                    <div className="font-heading text-4xl text-gold">{stats.totalAnalysisCount}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg text-center border border-white/5">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Active Designer</div>
                    <div className="font-heading text-4xl text-white">{stats.activeStaffCount}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg text-center border border-white/5">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Today</div>
                    <div className="font-heading text-4xl text-gold-light">{stats.todayAnalysisCount}</div>
                </div>
            </div>

            <div>
                <h4 className="text-sm text-white/60 mb-4 uppercase tracking-wider">Top Contributors</h4>
                <div className="space-y-4">
                    {stats.contributionStats.slice(0, 3).map((staff, idx) => (
                        <div key={staff.designerId} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs border border-gold/30">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-sm text-white font-light">{staff.name}</span>
                                    <span className="text-xs text-gold">{staff.count} 건</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${staff.percentage}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-gradient-to-r from-gold to-gold-light"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
