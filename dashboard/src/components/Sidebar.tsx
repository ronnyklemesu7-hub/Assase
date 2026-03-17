import React from 'react';
import { 
  LayoutDashboard, 
  Trees, 
  Droplets, 
  Zap, 
  Settings2, 
  Shield,
  Sun,
  Moon,
  Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';

export type ViewType = 'overview' | 'environmental' | 'water' | 'energy' | 'control' | 'asaase';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout?: () => void;
}

const navItems = [
  { id: 'overview' as ViewType, label: 'Overview', icon: LayoutDashboard },
  { id: 'environmental' as ViewType, label: 'Environmental', icon: Trees },
  { id: 'water' as ViewType, label: 'Water Infra', icon: Droplets },
  { id: 'energy' as ViewType, label: 'Energy Hub', icon: Zap },
  { id: 'control' as ViewType, label: 'Control Center', icon: Settings2 },
  { id: 'asaase' as ViewType, label: 'ASAASE Robots', icon: Bot },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout }) => {
  const { theme, setTheme } = useTheme();

  return (
    <aside 
      className="w-64 h-screen bg-[#0d1117]/80 backdrop-blur-3xl border-r border-white/5 flex flex-col sticky top-0 z-50 shadow-2xl"
    >
      <div className="p-8 flex flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-3">
           <div className="min-w-[32px] w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-emerald-400/50">
             <Shield className="text-white" size={24} />
           </div>
           <span className="font-black text-2xl text-white tracking-tighter whitespace-nowrap italic">
             ECOGUARD<span className="text-emerald-500">HQ</span>
           </span>
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Tactical Intelligence Hub</span>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={22} className={isActive ? 'text-emerald-400' : 'group-hover:scale-110 transition-transform'} />
              <span className="font-black tracking-widest text-xs uppercase group-hover:translate-x-1 transition-transform">
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-white/5 flex flex-col gap-2">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Shield size={16} />
            <span className="font-bold tracking-widest text-[10px] uppercase">Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
