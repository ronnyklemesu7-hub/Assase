import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, Wind, Zap, AlertTriangle } from 'lucide-react';
import type { FiltrationStatus } from '../api';

interface FiltrationDiagramProps {
  data: FiltrationStatus | null;
}

const FiltrationDiagram: React.FC<FiltrationDiagramProps> = ({ data }) => {
  if (!data) return (
    <div className="h-64 flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-300 dark:border-slate-800">
      <div className="animate-pulse text-slate-500">Connecting to system telemetry...</div>
    </div>
  );

  const telemetry = data.telemetry || { net_load_pct: 0, bottle_clog_pct: 0, flow_lpm: 0 };
  const state = data.state || 'OFFLINE';
  const actuators = data.actuators || { gears_active: false, backwash_on: false, pump_active: false };
  const isCleaning = state === 'CLEAR_NETS';
  const isBackwashing = state === 'BACKWASH';

  return (
    <div className="relative bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-2xl overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Droplet className="text-blue-400" size={20} />
            Multi-Stage Filtration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Mechanical Pipeline Status</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
          state === 'FILTERING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          state === 'ALERT' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
        }`}>
          {state}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 relative items-center">
        {/* Connection Pipes Background */}
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-300 dark:bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500/50"
            animate={{ 
              x: ['-100%', '100%'],
              opacity: actuators.pump_active ? 1 : 0
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ width: '20%' }}
          />
        </div>

        {/* Stage 1: Basin & Nets */}
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-24 h-32 bg-slate-200 dark:bg-slate-800/80 rounded-b-2xl border-2 border-slate-300 dark:border-slate-700 relative overflow-hidden">
            {/* Water Level */}
            <motion.div 
              className="absolute bottom-0 left-0 w-full bg-blue-600/60"
              animate={{ height: `${80 - (telemetry.net_load_pct * 0.3)}%` }}
            />
            {/* Net Gear System */}
            <motion.div 
              className="absolute top-4 left-2 right-2 h-4 bg-slate-600 rounded flex items-center justify-around px-1"
              animate={{ y: isCleaning ? [-10, 5, -10] : 0 }}
              transition={{ repeat: isCleaning ? Infinity : 0, duration: 2 }}
            >
              <Wind size={12} className={isCleaning ? 'text-blue-400 animate-spin-slow' : 'text-slate-400'} />
              <Wind size={12} className={isCleaning ? 'text-blue-400 animate-spin-slow' : 'text-slate-400'} />
            </motion.div>
            {/* Debris Indicator */}
            <div className="absolute inset-x-2 bottom-4 h-12 flex flex-wrap gap-1 items-end justify-center">
              {[...Array(Math.floor(telemetry.net_load_pct / 10))].map((_, i) => (
                <motion.div 
                  key={i}
                  className="w-1.5 h-1.5 bg-amber-800/80 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              ))}
            </div>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Basin Intake</span>
            <div className="text-sm font-mono text-slate-900 dark:text-white">{telemetry.net_load_pct}% Load</div>
          </div>
        </div>

        {/* Stage 2: Filter Bottle */}
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-20 h-40 bg-slate-200 dark:bg-slate-800/50 rounded-full border-2 border-slate-300 dark:border-slate-700 relative overflow-hidden backdrop-blur-sm">
            {/* Filter Layers */}
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 bg-slate-700/50 border-b border-white/5" title="Stones" />
              <div className="flex-1 bg-slate-600/50 border-b border-white/5" title="Coarse Sand" />
              <div className="flex-1 bg-slate-500/50 border-b border-white/5" title="Fine Sand" />
              <div className="flex-1 bg-slate-900/80" title="Activated Charcoal" />
            </div>
            {/* Clogging Effect */}
            <motion.div 
              className="absolute inset-0 bg-amber-900/30"
              animate={{ opacity: telemetry.bottle_clog_pct / 100 }}
            />
            {/* Backwash Flow */}
            {isBackwashing && (
               <motion.div 
               className="absolute inset-0 bg-blue-400/20"
               animate={{ opacity: [0.1, 0.4, 0.1] }}
               transition={{ repeat: Infinity, duration: 0.5 }}
             />
            )}
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Filter Tube</span>
            <div className="text-sm font-mono text-slate-900 dark:text-white">{telemetry.bottle_clog_pct}% Clog</div>
          </div>
        </div>

        {/* Stage 3: Hydro Turbine */}
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full border-4 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <motion.div
              animate={{ rotate: telemetry.flow_lpm * 10 }}
              transition={{ ease: "linear", duration: 1, repeat: Infinity }}
            >
              <Zap className={telemetry.flow_lpm > 10 ? 'text-blue-400' : 'text-slate-400 dark:text-slate-600'} size={40} />
            </motion.div>
            {/* RPM Pulse */}
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-blue-500/30"
              animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2 / Math.max(0.1, telemetry.flow_lpm / 10) }}
            />
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Hydro Stage</span>
            <div className="text-sm font-mono text-slate-900 dark:text-white">{telemetry.flow_lpm} LPM</div>
          </div>
        </div>
      </div>

      {/* Warnings & Stats Overlay */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-300 dark:border-white/5">
          <div className={`p-2 rounded-lg ${actuators.pump_active ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
            <Droplet size={16} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">System Flow</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tracking-wider">
              {actuators.pump_active ? 'ACTIVE' : 'OFFLINE'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-300 dark:border-white/5">
          <div className={`p-2 rounded-lg ${actuators.gears_active || actuators.backwash_on ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
            <Wind size={16} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Maintenance</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tracking-wider uppercase">
              {actuators.gears_active ? 'GEARS LIFT' : actuators.backwash_on ? 'BACKWASH' : 'STABLE'}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert Ribbon */}
      {(telemetry.bottle_clog_pct > 80 || telemetry.net_load_pct > 90) && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-2 inset-x-2 bg-red-500/90 backdrop-blur-md text-white py-1 px-4 rounded-lg flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
            <AlertTriangle size={14} />
            Maintenance Required Immediately
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FiltrationDiagram;
