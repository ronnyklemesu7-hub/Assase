import React, { useState } from 'react';
import { Printer, X, ShieldAlert, Globe, Download, Check, Terminal } from 'lucide-react';
import type { RemediationReport } from '../../asaaseApi';

interface ReportViewerProps {
  report: RemediationReport | null;
  onClose: () => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
  const [lang, setLang] = useState<'EN' | 'TW'>('EN');

  if (!report) return null;

  const en = JSON.parse(report.report_en);
  const tw = JSON.parse(report.report_tw);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-6xl h-full max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl dark:shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col relative transition-colors">
        
        {/* TOP COMMAND BAR */}
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/40 transition-colors">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/30">
                 <ShieldAlert size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                 <h2 className="font-black text-2xl text-slate-800 dark:text-white tracking-tighter uppercase italic leading-none">
                    Tactical <span className="text-emerald-500">Remediation Analysis</span>
                 </h2>
                 <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Incident_Auth_ID: {report.alert_id}</span>
                    <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500/60 uppercase tracking-widest italic flex items-center gap-1">
                       <Check size={10} /> Certified Remediation Handshake
                    </span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                 <button onClick={() => setLang('EN')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${lang === 'EN' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>English</button>
                 <button onClick={() => setLang('TW')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${lang === 'TW' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Twi (Akan)</button>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/5 mx-2"></div>
              <button onClick={handlePrint} className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm dark:shadow-lg">
                 <Printer size={20} />
              </button>
              <button onClick={onClose} className="p-3 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500 text-red-600 dark:text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all shadow-sm dark:shadow-lg">
                 <X size={20} />
              </button>
           </div>
        </div>

        {/* CONTENT AREA (Tactical Memo Style) */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-50 dark:bg-[#0d1117] relative transition-colors">
           {/* Watermark */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.02] pointer-events-none select-none text-slate-800 dark:text-white">
              <h1 className="text-[200px] font-black italic uppercase -rotate-12">ASAASE</h1>
           </div>

           <div className="max-w-4xl mx-auto space-y-12 relative z-10">
              {lang === 'EN' ? (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
                       <Globe size={18} className="text-emerald-600 dark:text-emerald-500" />
                       <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.3em]">Operational Briefing :: GH_V01</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                       <div className="space-y-8">
                          <section className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 dark:bg-white/5 w-fit px-3 py-1 rounded">01_SITE_CONTEXT</h4>
                             <div className="font-mono text-xs space-y-2 border-l-2 border-emerald-500/40 pl-6">
                                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500 italic">DEPLOY_NODE:</span> <span className="text-slate-800 dark:text-white font-bold">{en.incident_summary.robot}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500 italic">GPS_FIX:</span> <span className="text-slate-800 dark:text-white font-bold">{en.incident_summary.location}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500 italic">UTC_TIME:</span> <span className="text-slate-800 dark:text-white font-bold">{en.incident_summary.timestamp}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400 dark:text-slate-500 italic">SEVERITY:</span> <span className="text-red-500 font-bold">{en.incident_summary.severity}</span></div>
                             </div>
                          </section>

                          <section className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 dark:bg-white/5 w-fit px-3 py-1 rounded">02_THREAT_ANALYSIS</h4>
                             <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">{en.detected_contaminants}</p>
                          </section>
                       </div>

                       <div className="space-y-8">
                          <section className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 dark:bg-white/5 w-fit px-3 py-1 rounded">03_ACTUATED_RESPONSE</h4>
                             <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl shadow-inner transition-colors">
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-black italic">{en.robot_actions_taken}</p>
                             </div>
                          </section>

                          <section className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 dark:bg-white/5 w-fit px-3 py-1 rounded">04_FIELD_FOLLOWUP</h4>
                             <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-bold border-l-2 border-red-500 pl-4">{en.recommended_followup}</p>
                          </section>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200 dark:border-white/5">
                        <section className="bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4 shadow-sm transition-colors">
                           <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest italic">Phytoremediation Prescription</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{en.phytoremediation_prescription}</p>
                        </section>
                        <section className="bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4 shadow-sm transition-colors">
                           <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest italic">Node Treatment Protocol</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{en.treatment_protocol}</p>
                        </section>
                    </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
                       <Globe size={18} className="text-amber-600 dark:text-amber-500" />
                       <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.3em]">{tw.incident_header_tw}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-8 font-serif">
                          <section className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 dark:bg-white/5 w-fit px-3 py-1 rounded italic">Beaeɛ mu nsem</h4>
                             <p className="text-sm text-slate-700 dark:text-slate-200 font-bold italic">{tw.location_tw}</p>
                          </section>
                          <section className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 dark:bg-white/5 w-fit px-3 py-1 rounded italic">Nneɛma bɔne a yɛahu</h4>
                             <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-amber-500/40 pl-4">{tw.detected_contaminants_tw}</p>
                          </section>
                       </div>

                       <div className="space-y-8">
                          <section className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 dark:bg-white/5 w-fit px-3 py-1 rounded italic">Dwumadie a Robot no adi</h4>
                             <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl shadow-inner transition-colors">
                                <p className="text-sm text-amber-600 dark:text-amber-500 font-black italic">{tw.robot_actions_taken_tw}</p>
                             </div>
                          </section>
                       </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-white/5 text-center flex flex-col items-center">
                        <section className="max-w-2xl space-y-4">
                           <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest italic">EPA Mpaninfoɛ afutuo</h4>
                           <p className="text-sm text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{tw.recommended_followup_tw}</p>
                        </section>
                        
                        <div className="grid grid-cols-2 gap-4 w-full mt-4">
                           <div className="p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm transition-colors">
                              <h5 className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Nhwiren ne Aba</h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-3">{tw.phytoremediation_presc_tw}</p>
                           </div>
                           <div className="p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm transition-colors">
                              <h5 className="text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-2">Nsuo/Dɔteɛ siesie</h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-3">{tw.treatment_protocol_tw}</p>
                           </div>
                        </div>

                        <div className="mt-8 px-8 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-500 text-xs font-black uppercase tracking-widest italic animate-pulse">
                           {tw.safety_message_tw}
                        </div>
                    </div>
                </div>
              )}
           </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-2">
                  <Globe size={14} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Standard: ASAASE_SEC_2026</span>
               </div>
               <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bilingual Identity Verified</span>
               </div>
            </div>

            <div className="flex gap-4">
               <button className="flex items-center gap-3 px-8 py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-slate-300 dark:border-white/10 transition-all">
                  <Download size={16} /> Archive PDF
               </button>
               <button 
                onClick={handlePrint}
                className="flex items-center gap-3 px-10 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
               >
                  <Printer size={18} /> Official Certification
               </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
