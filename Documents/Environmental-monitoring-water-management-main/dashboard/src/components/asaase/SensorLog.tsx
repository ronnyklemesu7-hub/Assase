import React from 'react';
import { Activity, Clock } from 'lucide-react';

interface LogEntry {
  ts: number;
  source: string;
  msg: string;
  type: 'INFO' | 'WARN' | 'CRIT' | 'SYS';
}

const SensorLog: React.FC = () => {
  // Simulated Log Data
  const [logs] = React.useState<LogEntry[]>(() => [
    { ts: Date.now() / 1000, source: 'GROUND_01', msg: 'Soil scan complete: Mercury detection (0.88mg/kg)', type: 'WARN' },
    { ts: Date.now() / 1000 - 60, source: 'AQUA_01', msg: 'Turbidity stable at 45.0 NTU', type: 'INFO' },
    { ts: Date.now() / 1000 - 120, source: 'BASE', msg: 'GSM Signal Handshake: 94%', type: 'SYS' },
    { ts: Date.now() / 1000 - 180, source: 'GROUND_01', msg: 'Biochar dispenser engaged at GH_LOC_001', type: 'CRIT' },
    { ts: Date.now() / 1000 - 240, source: 'AQUA_01', msg: 'Route segment 4 validated', type: 'INFO' },
    { ts: Date.now() / 1000 - 300, source: 'BASE', msg: 'Encryption keys rotated', type: 'SYS' },
  ]);

  const getColor = (type: string) => {
    switch (type) {
      case 'WARN': return 'text-amber-600 dark:text-amber-400';
      case 'CRIT': return 'text-red-600 dark:text-red-400';
      case 'SYS': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-slate-500 dark:text-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/40 dark:bg-[#1a1d23]/40 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden font-mono transition-colors shadow-sm dark:shadow-none">
      <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-black/20 transition-colors">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-600 dark:text-emerald-500" />
          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Tactical Sensor Log</span>
        </div>
        <Clock size={14} className="text-slate-400 dark:text-slate-600" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 text-[9px] border-l border-slate-200 dark:border-white/10 pl-3 py-1 group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
             <span className="text-slate-400 dark:text-slate-600 shrink-0">[{new Date(log.ts * 1000).toLocaleTimeString([], {hour12: false})}]</span>
             <span className="text-emerald-600/80 dark:text-emerald-500/80 font-bold shrink-0">{log.source}</span>
             <span className={`${getColor(log.type)} uppercase tracking-tighter transition-colors`}>{log.msg}</span>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/5 text-right transition-colors">
         <span className="text-[8px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.2em]">Operational Pulse Active</span>
      </div>
    </div>
  );
};

export default SensorLog;
