import React from 'react';
import { AlertCircle, FileText, CheckCircle2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { AsaaseAlert } from '../../asaaseApi';

interface AlertListProps {
  alerts: AsaaseAlert[];
  page: number;
  setPage: (p: number) => void;
  onViewReport: (alertId: number) => void;
}

const AlertList: React.FC<AlertListProps> = ({ alerts, page, setPage, onViewReport }) => {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="flex flex-col h-full space-y-3">
         {safeAlerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 opacity-20 text-center">
               <AlertCircle size={40} className="mb-4" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em]">Sector Secure</span>
            </div>
         ) : (
            safeAlerts.map((alert) => (
              <div key={alert.id} className="bg-slate-100 dark:bg-black/40 p-3 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2 group hover:border-red-500/30 dark:hover:border-red-500/30 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all cursor-pointer relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase relative z-10">
                    <div className="flex items-center gap-2">
                       <span className={alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}>
                         <div className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${alert.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></div>
                         {alert.severity}
                       </span>
                       <span className="opacity-40">•</span>
                       <span>{alert.robot_id}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-60">
                       <Clock size={10} />
                       <span className="font-mono">{new Date(alert.ts * 1000).toLocaleTimeString()}</span>
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between relative z-10">
                    <div className="flex-1 min-w-0">
                       <div className="text-[11px] font-black text-white uppercase italic tracking-tighter leading-tight truncate">{alert.alert_type} DETECTED</div>
                       {alert.sms_sent && (
                          <div className="flex items-center gap-1 mt-1">
                             <CheckCircle2 size={10} className="text-emerald-500" />
                             <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">SMS SENT</span>
                          </div>
                       )}
                    </div>
                    {alert.report_generated && (
                       <button onClick={() => onViewReport(alert.id)} className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500 text-slate-500 hover:text-white transition-all">
                          <FileText size={16} />
                       </button>
                    )}
                 </div>
              </div>
            ))
         )}
         
         {alerts.length > 5 && (
            <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-auto">
               <button 
                 disabled={page === 1}
                 onClick={(e) => { e.stopPropagation(); setPage(page - 1); }}
                 className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-600 hover:text-white disabled:opacity-20"
               >
                 <ChevronLeft size={14} />
               </button>
               <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Page {page}</span>
               <button 
                 onClick={(e) => { e.stopPropagation(); setPage(page + 1); }}
                 className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-600 hover:text-white"
               >
                 <ChevronRight size={14} />
               </button>
            </div>
         )}
    </div>
  );
};

export default AlertList;
