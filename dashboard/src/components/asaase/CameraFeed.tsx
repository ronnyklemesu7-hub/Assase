import React from 'react';
import { Camera, Maximize2 } from 'lucide-react';

interface CameraFeedProps {
  label: string;
  subLabel?: string;
  source: 'GROUND' | 'AQUA';
  type: 'FRONT' | 'SIDE' | 'DOWN' | 'FORWARD';
  isOnline?: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ label, subLabel, source, type, isOnline = true }) => {
  if (!isOnline) {
    return (
      <div className="relative aspect-video bg-slate-200 dark:bg-black rounded-2xl overflow-hidden border border-slate-300 dark:border-white/5 flex flex-col items-center justify-center group transition-colors shadow-inner">
         <div className="text-red-600 dark:text-red-500/80 font-mono font-black text-xl md:text-2xl uppercase tracking-[0.3em] animate-pulse mb-2">NO SIGNAL</div>
         <div className="text-slate-400 dark:text-slate-600 font-mono font-bold text-[8px] md:text-[10px] uppercase tracking-widest leading-none">{label} - OFFLINE</div>
         
         {/* Corner Brackets */}
         <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-slate-400 dark:border-white/10"></div>
         <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-slate-400 dark:border-white/10"></div>
         <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-slate-400 dark:border-white/10"></div>
         <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-slate-400 dark:border-white/10"></div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-emerald-500/30 dark:border-emerald-500/20 group transition-colors shadow-lg">
      {/* Simulated Noise/Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent bg-[length:100%_4px] animate-[pulse_2s_infinite]"></div>

      {/* Feed Metadata */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 transition-colors shadow-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{label}</span>
        </div>
        {subLabel && <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">{subLabel}</span>}
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
         <button className="p-2 bg-white/60 dark:bg-black/40 hover:bg-white dark:hover:bg-black/80 rounded-lg border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
            <Maximize2 size={14} />
         </button>
      </div>

      {/* Center Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition-opacity">
         <div className="w-12 h-12 border border-emerald-500 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
         </div>
         <div className="absolute top-1/2 left-[-10px] w-4 h-px bg-emerald-500"></div>
         <div className="absolute top-1/2 right-[-10px] w-4 h-px bg-emerald-500"></div>
         <div className="absolute top-[-10px] left-1/2 w-px h-4 bg-emerald-500"></div>
         <div className="absolute bottom-[-10px] left-1/2 w-px h-4 bg-emerald-500"></div>
      </div>

      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors">
         <Camera size={48} className="text-slate-300 dark:text-slate-800 mb-4" />
         <div className="font-mono text-[10px] text-slate-400 dark:text-slate-700 uppercase tracking-widest">
            Stream_Link: {source}_FEED_{type}
         </div>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500/20 dark:border-white/10"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500/20 dark:border-white/10"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500/20 dark:border-white/10"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500/20 dark:border-white/10"></div>
    </div>
  );
};

export default CameraFeed;
