import React, { useCallback, useState } from 'react';
import { Gamepad, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Shield, Sprout, FlaskConical, Radar, Activity, Droplet, Terminal } from 'lucide-react';
import type { RobotSettings } from '../../asaaseApi';
import * as api from '../../asaaseApi';

interface ControlHubProps {
  robotId: string;
  settings: RobotSettings | null;
  baseSettings: api.BaseSettings | null;
  approvals: api.PendingApproval[];
  onSettingsUpdate?: () => void;
  onRobotChange?: (id: 'GROUND_01' | 'AQUA_01') => void;
  minimal?: boolean;
}

const ControlHub: React.FC<ControlHubProps> = ({ 
  robotId, 
  settings, 
  baseSettings, 
  approvals, 
  onSettingsUpdate,
  onRobotChange, 
  minimal 
}) => {
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const [dosingVal, setDosingVal] = useState(50); // Default 50g/m2 or 50ml
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [pendingManualCmd, setPendingManualCmd] = useState<string | null>(null);

  const currentControlMode = settings?.control_mode || 'FULLY_AUTO';
  const currentBaseMode = baseSettings?.operation_mode || 'FULLY_AUTO';

  const sendCommand = useCallback(async (command: string) => {
    if (currentControlMode === 'FULLY_AUTO' && command !== 'HALT_ALL') {
      alert("Manual override locked in AUTO mode. Switch to MANUAL first.");
      return;
    }

    if (command !== 'HALT_ALL' && !showManualConfirm && currentControlMode === 'MANUAL') {
        setPendingManualCmd(command);
        setShowManualConfirm(true);
        return;
    }

    try {
      await api.sendManualCommand(robotId, command);
      onSettingsUpdate?.();
    } catch (e) {
      console.error("Command failed", e);
    }
  }, [robotId, settings, showManualConfirm, onSettingsUpdate, currentControlMode]);

  const confirmManual = () => {
      if (pendingManualCmd) {
          api.sendManualCommand(robotId, pendingManualCmd);
          setPendingManualCmd(null);
          setShowManualConfirm(false);
          onSettingsUpdate?.();
      }
  };

  const handleModeChange = async (mode: api.ControlMode) => {
    try {
      await api.updateControlMode(robotId, mode);
      onSettingsUpdate?.();
    } catch (e) {
      console.error("Mode update failed", e);
    }
  };

  const handleBaseModeChange = async (mode: api.ControlMode) => {
    try {
      await api.updateBaseMode(mode);
      onSettingsUpdate?.();
    } catch (e) {
      console.error("Base mode update failed", e);
    }
  };

  const handleApprove = async (id: number, action: 'APPROVED' | 'REJECTED') => {
    try {
      await api.approveAction(id, action);
      onSettingsUpdate?.();
    } catch (e) {
      console.error("Approval failed", e);
    }
  };

  if (minimal) {
    if (safeApprovals.length === 0) return null;
    return (
      <div className="space-y-4 p-5 rounded-2xl border bg-blue-500/5 dark:bg-blue-900/10 border-blue-500/20 backdrop-blur-md transition-colors">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-200">Pending Handshake</span>
            </div>
            <span className="bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md">{safeApprovals.length}</span>
         </div>
         <div className="space-y-2">
            {safeApprovals.slice(0, 1).map((appr) => (
              <div key={appr.id} className="bg-white/50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-white/5 space-y-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                    <span>{appr.robot_id}</span>
                    <span className="text-amber-600 dark:text-amber-500">{appr.severity}</span>
                </div>
                <div className="text-[10px] text-slate-800 dark:text-white font-black italic">{appr.action_type}</div>
                <div className="flex gap-2 mt-2">
                   <button onClick={() => handleApprove(appr.id, 'APPROVED')} className="flex-1 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white text-[8px] font-black uppercase rounded-lg border border-emerald-500/20 transition-all">Approve</button>
                   <button onClick={() => handleApprove(appr.id, 'REJECTED')} className="flex-1 py-1.5 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white text-[8px] font-black uppercase rounded-lg border border-red-500/20 transition-all">Abort</button>
                </div>
              </div>
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
        
        {/* TOP COMMAND BAR */}
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 bg-gradient-to-b from-slate-500/5 to-transparent relative z-10 rounded-[2rem] transition-colors">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <Terminal size={18} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                 <h4 className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-[0.3em] italic">Direct Interface</h4>
              </div>
              <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                 <button 
                    onClick={() => onRobotChange?.('GROUND_01')} 
                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${robotId === 'GROUND_01' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                 >
                    ROVER
                 </button>
                 <button 
                    onClick={() => onRobotChange?.('AQUA_01')} 
                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${robotId === 'AQUA_01' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                 >
                    SCOUT
                 </button>
              </div>
           </div>

           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                 <Gamepad size={20} className="text-slate-400 dark:text-slate-600" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Control State</span>
              </div>
              <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-white/5 p-2 rounded-xl border border-slate-200 dark:border-white/5">
                 {(['MANUAL', 'SEMI_AUTO', 'FULLY_AUTO'] as const).map((m) => (
                    <button 
                       key={m}
                       onClick={() => handleModeChange(m)}
                       className={`px-3 py-2 flex-1 min-w-[30%] rounded-lg text-[9px] font-black uppercase transition-all ${currentControlMode === m ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/50 dark:bg-black/20 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/10'}`}
                    >
                       {m.replace('_', ' ')}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* MODE QUICK SWITCH (Bilingual) */}
        <div className="flex gap-4 px-4">
           <div className="flex-1 bg-slate-50 dark:bg-slate-800/20 p-5 rounded-[2rem] border border-slate-200 dark:border-white/5 flex items-center justify-between group hover:border-emerald-500/20 transition-all">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Ops</span>
                 <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase italic">Fleet Mode</span>
              </div>
              <div className="flex gap-1.5">
                 {(['MANUAL', 'FULLY_AUTO'] as const).map((bm) => (
                    <button 
                       key={bm}
                       onClick={() => handleBaseModeChange(bm)}
                       className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${currentBaseMode === bm ? 'bg-slate-800 dark:bg-white border-slate-800 dark:border-white text-white dark:text-black shadow-lg' : 'border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-400'}`}
                    >
                       {bm === 'MANUAL' ? 'Manual / Akwankyerɛ' : 'Auto / Dwumadie'}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* 🎮 DIRECT MANUAL DECK */}
        {currentControlMode === 'MANUAL' && (
        <div className="flex-1 p-8 flex flex-col gap-8">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                     <Radar size={16} className="text-emerald-500/40" />
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Navigation / Akwankyerɛ</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                     <div />
                     <button onClick={() => sendCommand('MOVE_FORWARD')} className="p-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col items-center group transition-all">
                        <ChevronUp size={24} className="text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                        <span className="text-[7px] font-black mt-1 text-slate-500">ANIM</span>
                     </button>
                     <div />
                     <button onClick={() => sendCommand('MOVE_LEFT')} className="p-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col items-center group transition-all">
                        <ChevronLeft size={24} className="text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                        <span className="text-[7px] font-black mt-1 text-slate-500">BENKUM</span>
                     </button>
                     <button onClick={() => sendCommand('HALT_ALL')} className="p-4 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500 rounded-2xl border border-red-500/20 dark:border-red-500/40 flex flex-col items-center group transition-all">
                        <Activity size={24} className="text-red-600 dark:text-red-500 group-hover:text-white transition-colors" />
                        <span className="text-[7px] font-black mt-1 text-red-500 dark:text-red-400 group-hover:text-white">GYAE</span>
                     </button>
                     <button onClick={() => sendCommand('MOVE_RIGHT')} className="p-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col items-center group transition-all">
                        <ChevronRight size={24} className="text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                        <span className="text-[7px] font-black mt-1 text-slate-500">NIFA</span>
                     </button>
                     <div />
                     <button onClick={() => sendCommand('MOVE_BACK')} className="p-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col items-center group transition-all">
                        <ChevronDown size={24} className="text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                        <span className="text-[7px] font-black mt-1 text-slate-500">AKYI</span>
                     </button>
                     <div />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => sendCommand('SCAN_SOIL')} className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-950/40 hover:bg-emerald-500/10 border border-slate-200 dark:border-white/5 hover:border-emerald-500/20 transition-all group flex flex-col items-center justify-center gap-3">
                    <Radar size={24} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 group-hover:text-slate-800 dark:group-hover:text-white uppercase block italic">Soil Scan</span>
                        <span className="text-[7px] font-bold text-slate-500 dark:text-slate-600 uppercase italic">Hwɛ dɔteɛ mu</span>
                    </div>
                </button>
                <button onClick={() => sendCommand('DISPENSE_SEEDS')} className="p-6 rounded-3xl bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 transition-all group flex flex-col items-center justify-center gap-3 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 animate-pulse group-hover:bg-transparent transition-colors"></div>
                    <Sprout size={24} className="text-emerald-600 dark:text-emerald-400 group-hover:text-white animate-bounce relative z-10" />
                    <div className="text-center relative z-10">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 group-hover:text-white uppercase block italic">Planting Seeds</span>
                        <span className="text-[7px] font-bold text-emerald-700 dark:text-emerald-500 group-hover:text-white/80 uppercase">Gu aba no</span>
                    </div>
                </button>
                <button onClick={() => sendCommand('SAMPLE_WATER')} className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-950/40 hover:bg-blue-500/10 border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all group flex flex-col items-center justify-center gap-3">
                    <Droplet size={24} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 group-hover:text-slate-800 dark:group-hover:text-white uppercase block italic">Water Probe</span>
                        <span className="text-[7px] font-bold text-slate-500 dark:text-slate-600 uppercase italic">Hwɛ nsuo no</span>
                    </div>
                </button>
                <button onClick={() => sendCommand('DEPLO_NEUTRAL')} className="p-6 rounded-3xl bg-blue-500/10 hover:bg-blue-500 border border-blue-500/20 transition-all group flex flex-col items-center justify-center gap-3 shadow-lg">
                    <FlaskConical size={24} className="text-blue-600 dark:text-blue-400 group-hover:text-white animate-pulse" />
                    <div className="text-center">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 group-hover:text-white uppercase block italic">Dispense Chem</span>
                        <span className="text-[7px] font-bold text-blue-700 dark:text-blue-500 group-hover:text-white/80 uppercase">Gu aduro no</span>
                    </div>
                </button>
              </div>
           </div>

           {/* 🧪 PAYLOAD STATION (Dosing Sliders) */}
           <div className="bg-slate-50 dark:bg-slate-900/60 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 flex flex-col gap-8 shadow-2xl relative overflow-hidden group transition-colors">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 pointer-events-none text-slate-800 dark:text-white">
                 <FlaskConical size={120} />
              </div>
              <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-3">
                    <Zap size={20} className="text-amber-500 animate-pulse" />
                    <h4 className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-[0.3em] italic">Payload Rack / Aduro</h4>
                 </div>
                 <div className="flex items-center gap-4 bg-white/50 dark:bg-black/40 px-6 py-2 rounded-2xl border border-slate-200 dark:border-white/5 transition-colors">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Dose</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 italic tracking-tighter">{dosingVal}<span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 ml-1">G/M²</span></span>
                 </div>
              </div>
              <div className="space-y-4 relative z-10">
                 <input 
                    type="range" 
                    min="10" max="250" 
                    value={dosingVal} 
                    onChange={(e) => setDosingVal(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-lg appearance-none cursor-pointer accent-emerald-500 active:accent-emerald-400 transition-colors" 
                 />
                 <div className="flex justify-between text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">
                    <span>Min Dose (10g)</span>
                    <span>Max Capacity (250g)</span>
                 </div>
              </div>
           </div>
        </div>
        )}

        {/* 🚨 EMERGENCY STATION */}
        <div className="mt-auto grid grid-cols-2 gap-6 p-8 bg-gradient-to-t from-red-500/5 to-transparent dark:from-red-500/10 dark:to-transparent rounded-b-[3rem] transition-colors">
           <button onClick={() => sendCommand('RTB_PULSE')} className="p-6 bg-slate-50 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-white text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-black rounded-3xl border border-slate-200 dark:border-white/5 transition-all flex items-center justify-center gap-4 group shadow-sm hover:shadow-xl">
              <Radar size={22} className="group-hover:animate-ping text-slate-400 dark:text-slate-500" />
              <div className="text-left">
                 <div className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-slate-700 dark:text-slate-300">Return to Base</div>
                 <div className="text-[7px] font-black uppercase opacity-60 dark:opacity-40 italic text-slate-500">Kɔ Fie Mpofirim</div>
              </div>
           </button>
           <button onClick={() => sendCommand('HALT_ALL')} className="p-6 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-600 group text-red-600 dark:text-red-500 hover:text-white rounded-3xl border border-red-500/20 dark:border-red-500/40 transition-all flex items-center justify-center gap-4 shadow-xl hover:shadow-red-500/20">
              <Zap size={22} className="group-hover:scale-125 transition-transform" />
              <div className="text-left">
                 <div className="text-[10px] font-black uppercase tracking-widest mb-0.5">Emergency Stop</div>
                 <div className="text-[7px] font-black uppercase italic">Gyae Biara Mpofirim</div>
              </div>
           </button>
        </div>

         {/* PROMPT/CONFIRM MODAL */}
         {showManualConfirm && (
            <div className="fixed inset-0 z-[100] bg-slate-100/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-8 transition-colors">
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-12 rounded-[3.5rem] shadow-2xl dark:shadow-[0_0_100px_rgba(239,68,68,0.2)] max-w-lg w-full text-center space-y-10 animate-in zoom-in-95 duration-300">
                  <div className="w-24 h-24 bg-red-500/10 dark:bg-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-500/20 dark:border-red-500/40">
                     <Shield size={48} className="text-red-600 dark:text-red-500 animate-pulse" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter uppercase mb-4">Manual Override Required</h3>
                     <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-bold italic">This action will bypass the autonomous remediation protocol. English & Twi authorization required.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <button onClick={() => { setPendingManualCmd(null); setShowManualConfirm(false); }} className="p-5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl border border-slate-200 dark:border-white/10 transition-all">Cancel / Ansa</button>
                     <button onClick={confirmManual} className="p-5 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl shadow-lg shadow-emerald-500/20 transition-all">Confirm / Yiw</button>
                  </div>
               </div>
            </div>
         )}
    </div>
  );
};

export default ControlHub;
export { ControlHub };
