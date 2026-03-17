import React, { useEffect, useState } from 'react';
import { Droplets, Trees, AlertTriangle, Zap, Activity } from 'lucide-react';
import StatCard from './StatCard';
import WaterGauge from './WaterGauge';
import FiltrationDiagram from './FiltrationDiagram';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchLatestStats, fetchHistory, fetchEnergyHistory, fetchDistributionLatest } from '../api';
import DistributionView from './DistributionView';
import MaintenanceForecast from './MaintenanceForecast';
import type { DashboardData } from '../api';


const Dashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData>({ env: null, water: null, filtration: null, energy: null, health: null });
    const [history, setHistory] = useState<any>({ env: [], water: [], energy: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const [latest, hist, energyHist, distLatest] = await Promise.all([
                fetchLatestStats(), 
                fetchHistory(),
                fetchEnergyHistory(),
                fetchDistributionLatest()
            ]);
            setData({ ...latest, distribution: distLatest });

            setHistory({ ...hist, energy: energyHist });
            setLoading(false);
            setError(null);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError('Unable to connect to EcoGuard API. Please ensure the backend server is running on port 5000.');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 3000); // Poll every 3 seconds for smoother updates
        return () => clearInterval(interval);
    }, []);

    if (loading && !data.env && !data.water) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 animate-pulse">Initializing Data Streams...</p>
                </div>
            </div>
        );
    }

    if (error && !data.env && !data.water) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-white p-6 text-center">
                <div className="max-w-md glass-card p-8 border-red-500/20">
                    <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                    <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => { setLoading(true); loadData(); }}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    // Format history for charts
    const envChartData = history.env.map((e: any) => ({
        time: new Date(e.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tree: (e.green_ratio * 100).toFixed(1),
    })).reverse();

    const energyChartData = history.energy.map((e: any) => ({
        time: new Date(e.ts * 1000).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
        power: e.power_w,
        rpm: e.rpm
    })).reverse();

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Activity className="text-emerald-400" size={32} />
                        System Overview
                    </h2>
                    <p className="text-slate-400 mt-2 uppercase tracking-widest text-xs">Live Intelligence Snapshot</p>
                </div>
                <div className="flex gap-4">
                    {data.health && (
                        <div className={`px-4 py-2 rounded-xl flex items-center gap-4 border ${
                            data.health.status === 'EXCELLENT' ? 'bg-emerald-500/10 border-emerald-500/20' :
                            data.health.status === 'GOOD' ? 'bg-blue-500/10 border-blue-500/20' :
                            data.health.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20' :
                            'bg-red-500/10 border-red-500/20 animate-pulse'
                        }`}>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Health Index</span>
                                <span className={`text-sm font-black ${
                                    data.health.status === 'EXCELLENT' ? 'text-emerald-400' :
                                    data.health.status === 'GOOD' ? 'text-blue-400' :
                                    data.health.status === 'WARNING' ? 'text-amber-400' :
                                    'text-red-400'
                                }`}>{data.health.score}%</span>
                            </div>
                        </div>
                    )}
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE
                    </div>
                </div>
            </header>

            <main className="dashboard-grid">
                {/* Top Stats */}
                <StatCard
                    title="Tree Cover"
                    value={data.env ? (data.env.green_ratio * 100).toFixed(1) : '--'}
                    unit="%"
                    icon={<Trees size={24} />}
                    trend={data.env ? { value: parseFloat((data.env.cover_change_pct || 0).toFixed(2)), isPositive: data.env.cover_change_pct >= 0 } : undefined}
                    color="162 84% 39%"
                />
                <StatCard
                    title="Current Power"
                    value={history.energy.length > 0 ? history.energy[0].power_w.toFixed(1) : '--'}
                    unit="W"
                    icon={<Zap size={24} />}
                    color="45 90% 45%"
                />
                <StatCard
                    title="Energy Today"
                    value={data.energy ? data.energy.energy_kwh.toFixed(4) : '0.000'}
                    unit="kWh"
                    icon={<Activity size={24} />}
                    color="263 70% 50%"
                />
                <StatCard
                    title="System States"
                    value={data.filtration ? data.filtration.state.replace('_', ' ') : 'OFFLINE'}
                    icon={<Activity size={24} />}
                    color="15 80% 50%"
                />

                {/* Main Content Area */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    {/* Energy Trends Chart */}
                    <div className="glass-card p-6 min-h-[350px]">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Zap size={20} className="text-amber-400" />
                            Turbine Power Generation (Watts)
                        </h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={energyChartData}>
                                    <defs>
                                        <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(45 90% 45%)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(45 90% 45%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="time" stroke="hsl(var(--text-muted))" />
                                    <YAxis stroke="hsl(var(--text-muted))" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="power" stroke="hsl(45 90% 45%)" fillOpacity={1} fill="url(#colorPower)" name="Power (W)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Environmental Trends Chart */}
                    <div className="glass-card p-6 min-h-[350px]">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Trees size={20} className="text-emerald-400" />
                            Environmental Trends
                        </h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={envChartData}>
                                    <defs>
                                        <linearGradient id="colorTree" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(162 84% 39%)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(162 84% 39%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="time" stroke="hsl(var(--text-muted))" />
                                    <YAxis stroke="hsl(var(--text-muted))" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="tree" stroke="hsl(162 84% 39%)" fillOpacity={1} fill="url(#colorTree)" name="Tree Cover %" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div className="h-min space-y-6">
                        <FiltrationDiagram data={data.filtration} />
                        <MaintenanceForecast data={data.filtration} />
                        {data.health && data.health.reasons.length > 0 && (

                            <div className="mt-4 glass-card p-4 border-amber-500/20">
                                <h4 className="text-xs font-bold text-amber-400 uppercase mb-2 flex items-center gap-2">
                                    <AlertTriangle size={12} />
                                    Performance Notes
                                </h4>
                                <ul className="text-[11px] text-gray-400 space-y-1">
                                    {data.health.reasons.map((r, i) => (
                                        <li key={i} className="flex gap-2">
                                            <span className="text-amber-500">•</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Water Gauges */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Droplets size={20} className="text-blue-400" />
                            Water Quality
                        </h3>
                        <div className="flex flex-col gap-6">
                            <WaterGauge
                                title="pH Level"
                                value={data.water ? parseFloat(data.water.ph.toFixed(2)) : 7.0}
                                min={0} max={14} unit="" color="199 89% 48%"
                            />
                            <WaterGauge
                                title="Turbidity"
                                value={data.water ? parseFloat(data.water.turbidity_ntu.toFixed(2)) : 0}
                                min={0} max={10} unit=" NTU" color="45 90% 45%"
                            />
                            <div className="flex justify-between items-center text-sm px-2">
                                <span className="text-gray-400">Temp</span>
                                <span className="font-mono text-emerald-400">{data.water ? data.water.temperature_c.toFixed(1) : '--'}°C</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Distribution Grid */}
                <DistributionView data={data.distribution} />
            </main>
        </div>
    );
};




export default Dashboard;
