import React, { useEffect, useState } from 'react';
import { Droplets, Activity, GitBranch, RefreshCw, Layers } from 'lucide-react';
import FiltrationDiagram from './FiltrationDiagram';
import WaterGauge from './WaterGauge';
import MaintenanceForecast from './MaintenanceForecast';
import { fetchLatestStats } from '../api';
import type { DashboardData } from '../api';

const WaterView: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        const load = async () => {
            const latest = await fetchLatestStats();
            setData(latest);
        };
        load();
        const interval = setInterval(load, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Droplets className="text-blue-500 dark:text-blue-400" size={32} />
                        Water Infrastructure
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest text-xs">Purification & Distribution Network</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-8">
                    {/* Mechanical Deep Dive */}
                    <div className="glass-card p-1">
                        <FiltrationDiagram data={data?.filtration || null} />
                    </div>

                    {/* Predictive Intelligence */}
                    <MaintenanceForecast data={data?.filtration || null} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Chemical Integrity */}
                        <div className="glass-card p-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                                <Layers className="text-blue-500 dark:text-blue-400" size={20} />
                                Chemical Integrity
                            </h3>
                            <div className="space-y-8">
                                <WaterGauge
                                    title="pH Balance"
                                    value={data?.water?.ph || 7.0}
                                    min={0} max={14} unit="" color="199 89% 48%"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Temperature</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{data?.water ? data.water.temperature_c.toFixed(1) : '--'}°C</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Turbidity</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{data?.water ? data.water.turbidity_ntu.toFixed(2) : '--'} NTU</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Distribution Network Simulation */}
                        <div className="glass-card p-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                                <GitBranch className="text-indigo-500 dark:text-indigo-400" size={20} />
                                Routing Engine
                            </h3>
                            <div className="h-[200px] flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-indigo-500/5 rounded-full animate-pulse" />
                                <div className="z-10 text-center">
                                    <GitBranch className="text-indigo-600 dark:text-indigo-500 mx-auto mb-4" size={48} />
                                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Dijkstra Engine Active</p>
                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">Calculating optimal paths...</p>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 gap-4 h-full">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Active Nodes</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">12 Locations</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pressure</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">4.2 bar</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Automation Logs */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="glass-card p-6 min-h-[600px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Automation Logs</h3>
                            <RefreshCw size={16} className="text-slate-500 animate-spin-slow" />
                        </div>
                        <div className="flex-1 space-y-4 font-mono text-xs">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg">
                                [O:42:11] SYSTEM: Backwash cycle completed successfully.
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs leading-relaxed">
                                [0:42:08] INTAKE: Net debris load below threshold. Resetting gears.
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 rounded-lg">
                                [0:41:55] FLOW: Current intake stabilized at 45.2 LPM.
                            </div>
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="p-3 text-slate-500 dark:text-slate-600 border-l border-slate-200 dark:border-white/5">
                                    [{(10-i)*3}:22:01] TELEMETRY: Sample sequence #{420+i} processed.
                                </div>
                            ))}
                        </div>
                        <button className="mt-6 w-full py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold rounded-xl transition-colors border border-slate-300 dark:border-white/10 flex items-center justify-center gap-2">
                            <Activity size={16} />
                            Full System Audit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaterView;
