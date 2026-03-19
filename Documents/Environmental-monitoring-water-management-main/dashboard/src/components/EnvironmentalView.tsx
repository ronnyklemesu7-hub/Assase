import React, { useEffect, useState } from 'react';
import { Trees, Map, AlertTriangle, Scan } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchLatestStats, fetchHistory } from '../api';
import type { DashboardData } from '../api';

const EnvironmentalView: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const [latest, hist] = await Promise.all([fetchLatestStats(), fetchHistory()]);
            setData(latest);
            setHistory(hist.env || []);
        };
        load();
        const interval = setInterval(load, 2000);
        return () => clearInterval(interval);
    }, []);

    const chartData = [...history].reverse().map(e => ({
        time: new Date(e.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        green: (e.green_ratio * 100).toFixed(1),
    }));

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Scan className="text-emerald-500 dark:text-emerald-400" size={32} />
                        Environmental Intelligence
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest text-xs">Computer Vision & Satellite Analysis</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-6 border-emerald-500/20">
                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <Map size={16} />
                        Site Statistics
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Cover Ratio</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white">{data?.env ? (data.env.green_ratio * 100).toFixed(1) : '--'}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 dark:text-slate-500">Deviation</span>
                            <span className={`font-bold ${data?.env && data.env.cover_change_pct < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {data?.env ? data.env.cover_change_pct.toFixed(2) : '0.00'}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-500"
                                animate={{ width: `${(data?.env?.green_ratio || 0) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 border-amber-500/20">
                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Anomalies Detected
                    </h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                            <span className="text-xs text-slate-500 dark:text-slate-300">Excavation Hits</span>
                            <span className="px-2 py-0.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded text-[10px] font-black">{data?.env?.excavation_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                            <span className="text-xs text-slate-500 dark:text-slate-300">Movement Alerts</span>
                            <span className="px-2 py-0.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-black">{data?.env?.activity_count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card p-8 h-[400px]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                    <Trees className="text-emerald-500 dark:text-emerald-400" size={20} />
                    Historical Canopy Performance
                </h3>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="envGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="green" stroke="#10b981" strokeWidth={3} fill="url(#envGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default EnvironmentalView;
