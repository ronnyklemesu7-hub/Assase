import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import type { FiltrationStatus } from '../api';
import { fetchForecast } from '../api';

interface MaintenanceForecastProps {
    data: FiltrationStatus | null;
}

const MaintenanceForecast: React.FC<MaintenanceForecastProps> = ({ data }) => {
    const [forecast, setForecast] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getForecast = async () => {
            try {
                const res = await fetchForecast();
                setForecast(res);
            } catch (err) {
                console.error("Failed to load forecast", err);
            } finally {
                setLoading(false);
            }
        };

        getForecast();
        // re-fetch every 30 seconds
        const interval = setInterval(getForecast, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return null;

    if (loading || !forecast) {
        return (
            <div className="glass-card p-6 border-slate-200 dark:border-white/5 flex items-center justify-center animate-pulse min-h-[250px]">
                <span className="text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <AlertCircle size={16}/> Analyzing Telemetry...
                </span>
            </div>
        );
    }

    const minHours = Math.min(forecast.predicted_hours_until_clog, forecast.predicted_hours_until_net_full);
    const urgency = forecast.urgency;

    return (
        <div className="glass-card p-6 border-slate-200 dark:border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="text-emerald-500 dark:text-emerald-400" size={18} />
                Maintenance Forecast (AI)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${urgency === 'STABLE' ? 'bg-emerald-500/10 text-emerald-400' : urgency === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-500'}`}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Estimated Window</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{minHours} Hours</p>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-slate-100 dark:bg-white/2 rounded-2xl border border-slate-200 dark:border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Confidence Score</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{forecast.confidence_score}%</span>
                        </div>
                        <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-emerald-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${forecast.confidence_score}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center">
                    <div className={`flex items-center gap-2 mb-2 ${urgency === 'STABLE' ? 'text-emerald-400' : urgency === 'WARNING' ? 'text-amber-400' : 'text-red-400'}`}>
                        {urgency === 'STABLE' ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                        <span className="text-xs font-bold uppercase tracking-widest">{urgency} STATUS</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "{forecast.recommendation_summary}"
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5">
                <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-[10px] font-bold text-slate-800 dark:text-white transition-all border border-slate-300 dark:border-white/5 uppercase tracking-widest">
                        Schedule Service
                    </button>
                    <button className="flex-1 py-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 transition-all border border-emerald-500/20 uppercase tracking-widest">
                        Export Projections
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceForecast;
