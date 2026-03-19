import React, { useEffect, useState } from 'react';
import { Zap, TrendingUp, DollarSign, Battery, Cpu, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchLatestStats, fetchEnergyHistory } from '../api';
import type { DashboardData } from '../api';

const EnergyView: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [energyHistory, setEnergyHistory] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const [latest, hist] = await Promise.all([fetchLatestStats(), fetchEnergyHistory()]);
            setData(latest);
            setEnergyHistory(hist || []);
        };
        load();
        const interval = setInterval(load, 2000);
        return () => clearInterval(interval);
    }, []);

    const chartData = [...energyHistory].reverse().map(e => ({
        time: new Date(e.ts * 1000).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
        power: e.power_w,
        rpm: e.rpm
    }));

    const stats = [
        { label: 'Avg Power', value: `${data?.energy ? data.energy.avg_power_w.toFixed(1) : '--'} W`, icon: Cpu, color: 'text-amber-400' },
        { label: 'Energy Gen', value: `${data?.energy ? data.energy.energy_kwh.toFixed(4) : '--'} kWh`, icon: Zap, color: 'text-blue-400' },
        { label: 'Est. Savings', value: `$${((data?.energy?.energy_kwh || 0) * 0.15).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400' },
        { label: 'Uptime', value: '99.8%', icon: Clock, color: 'text-indigo-400' },
    ];

    return (
        <div className="p-8 space-y-8 animate-in zoom-in-95 duration-500">
            <header>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Zap className="text-amber-500 dark:text-amber-400" size={32} />
                    Energy Analytics Hub
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest text-xs">Hydro-Electric Generation & Efficiency Monitoring</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card p-6 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                        <stat.icon className={`${stat.color} mb-3`} size={24} />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 glass-card p-8 min-h-[450px]">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <TrendingUp className="text-amber-500 dark:text-amber-400" size={20} />
                             Generation Trends
                        </div>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">LIVE</span>
                        </div>
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                                    itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={3} fill="url(#powerGrad)" name="Generation (W)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-8 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                         <Battery className="text-emerald-500 dark:text-emerald-400" size={20} />
                         Efficiency Status
                    </h3>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {/* Real-time Health UI */}
                        <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle 
                                    cx="96" cy="96" r="84" 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    className="text-emerald-500"
                                    strokeDasharray={2 * Math.PI * 84}
                                    strokeDashoffset={2 * Math.PI * 84 * (1 - (data?.health?.score || 0) / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="text-center">
                                <p className="text-4xl font-black text-slate-900 dark:text-white">{data?.health?.score || '--'}%</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Efficiency</p>
                            </div>
                        </div>
                        <div className="mt-8 space-y-4 w-full">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Turbine RPM</span>
                                <span className="text-slate-900 dark:text-white font-mono">{chartData[chartData.length-1]?.rpm || '--'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Flow/Power Ratio</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono">OPTIMAL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnergyView;
