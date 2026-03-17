import React, { useEffect, useState } from 'react';
import { Settings2, Cpu, Power, Terminal, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLatestStats } from '../api';
import type { DashboardData } from '../api';
import { useNotification } from './NotificationSystem';

const ControlCenter: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [logs, setLogs] = useState<{ msg: string, type: 'info' | 'warn' | 'err', ts: string }[]>([]);
    const { notify } = useNotification();

    useEffect(() => {
        const load = async () => {
            const latest = await fetchLatestStats();
            setData(latest);
        };
        load();
        const interval = setInterval(load, 2000);

        // Simulated Logs
        const initLogs = [
            { msg: 'System Kernel initialized. All modules reporting.', type: 'info', ts: new Date().toLocaleTimeString() },
            { msg: 'Authenticated as ROOT user - Permission Level 10', type: 'info', ts: new Date().toLocaleTimeString() },
            { msg: 'Active telemetry streams: ENVIRONMENTAL, WATER, ENERGY', type: 'info', ts: new Date().toLocaleTimeString() },
        ] as any[];
        setLogs(initLogs);

        return () => clearInterval(interval);
    }, []);

    const addLog = (msg: string, type: 'info' | 'warn' | 'err' = 'info') => {
        setLogs(prev => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 15));
    };

    const handleAction = async (label: string, endpoint: string) => {
        addLog(`Initiating ${label}...`, 'warn');
        try {
            const response = await fetch(`http://localhost:5000/api/control/${endpoint}`, {
                method: 'POST'
            });
            if (response.ok) {
                addLog(`${label} command confirmed by EcoGuard Kernel.`, 'info');
                notify(`${label} execution successful`, 'success');
            } else {
                addLog(`${label} failed: Server responded with error.`, 'err');
                notify(`${label} failed`, 'error');
            }
        } catch (e) {
            addLog(`${label} failed: Network or API error.`, 'err');
            notify('Network error', 'error');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
            <header>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <Settings2 className="text-indigo-400" size={32} />
                    System Management Center
                </h2>
                <p className="text-slate-400 mt-2 uppercase tracking-widest text-xs">Mission Critical Overrides & Calibration</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* Hardware Controls */}
                    <div className="glass-card p-1 overflow-hidden">
                        <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Cpu size={18} className="text-emerald-400" />
                                Hardware Actuators
                            </h3>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded font-black border border-emerald-500/20 uppercase">Local Network</span>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ControlButton
                                label="Net Clear"
                                active={data?.filtration?.actuators.gears_active}
                                icon={<RotateCcw />}
                                onClick={() => handleAction('Net Clear', 'net-clear')}
                            />
                            <ControlButton
                                label="Backwash"
                                active={data?.filtration?.actuators.backwash_on}
                                icon={<Play />}
                                onClick={() => handleAction('Backwash Cycle', 'backwash')}
                            />
                            <ControlButton
                                label="System Reset"
                                danger
                                icon={<Power />}
                                onClick={() => handleAction('Master Reset', 'reset')}
                            />
                        </div>
                    </div>

                    {/* Removed Simulation Parameters for Production */}
                </div>

                {/* Live Console */}
                <div className="glass-card bg-black/40 border-slate-800 flex flex-col min-h-[500px]">
                    <div className="flex items-center gap-2 p-4 border-b border-white/5 bg-slate-900/50">
                        <Terminal size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Command Terminal</span>
                        <div className="flex gap-1 ml-auto">
                            <div className="w-2 h-2 rounded-full bg-red-500/50" />
                            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                        </div>
                    </div>
                    <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-2 selection:bg-emerald-500/20">
                        <AnimatePresence initial={false}>
                            {logs.map((log, i) => (
                                <motion.div
                                    key={log.ts + i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-3"
                                >
                                    <span className="text-slate-600">[{log.ts}]</span>
                                    <span className={
                                        log.type === 'err' ? 'text-red-400' :
                                            log.type === 'warn' ? 'text-amber-400' :
                                                'text-emerald-400'
                                    }>
                                        {log.type.toUpperCase()}:
                                    </span>
                                    <span className="text-slate-300">{log.msg}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <div className="p-3 bg-white/2 border-t border-white/5 flex items-center gap-3">
                        <span className="text-emerald-500 font-bold">$</span>
                        <input
                            type="text"
                            className="bg-transparent border-none text-[11px] text-white focus:ring-0 flex-1 outline-none"
                            placeholder="Awaiting command..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addLog((e.target as HTMLInputElement).value, 'info');
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ControlButton = ({ label, icon, active, danger, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-4 p-6 rounded-[24px] border transition-all active:scale-95 ${danger
            ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
            : active
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 animate-pulse'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
    >
        <div className={`p-4 rounded-full bg-white/5 border border-white/5`}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest">{label}</p>
            <p className="text-[10px] opacity-60 mt-1">{active ? 'EXECUTING' : 'IDLE'}</p>
        </div>
    </button>
);


export default ControlCenter;
