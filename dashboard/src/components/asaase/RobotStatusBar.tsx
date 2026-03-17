import React from 'react';
import { Bot, Battery, Signal } from 'lucide-react';
import type { RobotStatus } from '../../asaaseApi';

interface RobotStatusBarProps {
  status: RobotStatus;
}

const RobotStatusBar: React.FC<RobotStatusBarProps> = ({ status }) => {
  const renderCard = (label: string, data: { online: boolean; battery_pct: number; last_seen: number }, type: 'ground' | 'aqua') => {
    const isOnline = data.online;
    const batteryColor = data.battery_pct > 70 ? 'text-emerald-600 dark:text-emerald-400' : data.battery_pct > 30 ? 'text-amber-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
    
    return (
      <div className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-${type === 'ground' ? 'amber' : 'blue'}-500/10`}>
             <Bot size={24} className={`text-${type === 'ground' ? 'amber' : 'blue'}-400`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">{label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isOnline ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-1 italic">
              <Signal size={12} />
              Last seen: {data.last_seen > 0 ? new Date(data.last_seen * 1000).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Battery</div>
            <div className={`text-lg font-bold flex items-center gap-1 ${batteryColor}`}>
              <Battery size={16} />
              {data.battery_pct}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-tight">Health</div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
               {isOnline ? 'Stable' : 'Unknown'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderCard('ASAASE GROUND', status.ground, 'ground')}
      {renderCard('ASAASE AQUA', status.aqua, 'aqua')}
    </div>
  );
};

export default RobotStatusBar;
