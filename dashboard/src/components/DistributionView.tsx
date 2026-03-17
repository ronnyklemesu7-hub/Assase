import React from 'react';
import { motion } from 'framer-motion';
import { Network, Home, ArrowRight, Droplets } from 'lucide-react';
import type { DistributionEvent } from '../api';

interface DistributionViewProps {
  data: DistributionEvent[] | undefined;
}

const DistributionView: React.FC<DistributionViewProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4">
        <Network size={40} className="opacity-20" />
        <p className="text-xs uppercase tracking-widest font-bold">Awaiting Distribution Data</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Network className="text-indigo-500 dark:text-indigo-400" size={20} />
            Smart Distribution Grid
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Real-time Delivery Network</p>
        </div>
      </div>

      <div className="space-y-6">
        {data.map((event, i) => (
          <motion.div 
            key={event.home}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 bg-slate-50 dark:bg-white/2 p-4 rounded-2xl border border-slate-200 dark:border-white/5 relative group hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Home size={20} />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{event.home}</span>
                <span className="text-[10px] text-slate-500 font-mono">Cost Index: {event.cost.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (event.volume_liters * 60) * 4)}%` }} // Scaled for vis
                  />
                </div>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 w-16 text-right">
                  {(event.volume_liters * 60).toFixed(1)} LPM
                </span>
              </div>
            </div>

            <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
               <ArrowRight size={16} className="text-indigo-500" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <Droplets size={12} className="text-indigo-400 dark:text-indigo-500" />
          Aggregate Flow Optimization Active
        </div>
        <div className="text-indigo-500 dark:text-indigo-400">
          SECURE ENCRYPTED CHANNEL
        </div>
      </div>
    </div>
  );
};

export default DistributionView;
