import React, { useState, useEffect } from 'react';
import { Bot, AlertCircle, RefreshCcw, Zap, Clock, Terminal, MessageSquare, Activity, Globe, Shield, Wifi, Battery, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import AsaaseMap from './AsaaseMap';
import WaypointEditor from './WaypointEditor';
import AlertList from './AlertList';
import ReportViewer from './ReportViewer';
import ControlHub from './ControlHub';
import CameraFeed from './CameraFeed';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import * as api from '../../asaaseApi';

/* ─── Localization Dictionary ─── */
type LangKey = 'EN' | 'TW' | 'GA' | 'EW' | 'FR';

const dict: Record<LangKey, Record<string, string>> = {
  EN: {
    overview: "OVERVIEW", mission: "MISSION", intel: "INTEL", command: "COMMAND", live: "LIVE",
    system_ready: "SYSTEM READY", packet_stable: "PACKET STABLE",
    global_status: "GLOBAL NETWORK STATUS", live_feeds: "TACTICAL LIVE FEEDS",
    env_telemetry: "ENVIRONMENT TELEMETRY", emergency_stream: "EMERGENCY STREAM",
    waypoint_master: "WAYPOINT MASTER", sensor_log: "SENSOR LOG",
    gsm_log: "GSM/SMS BROADCAST LOG", system_health: "SYSTEM HEALTH",
    ground: "GROUND ROVER", aqua: "AQUA SCOUT", base: "BASE HUB",
    online: "ONLINE", offline: "OFFLINE", syncing: "SYNCING",
    remoting: "REMOTING", auto: "AUTO", manual: "MANUAL",
    live_coord: "LIVE COORDINATION", lat: "LAT", lon: "LON",
    unit_direct: "UNIT DIRECT INTERFACE",
    battery: "BATTERY", signal: "SIGNAL", mode: "MODE",
    soil_score: "SOIL SCORE", mercury: "MERCURY MG/KG",
    turbidity: "TURBIDITY NTU", ph_value: "pH VALUE",
    signal_str: "SIGNAL STR", batt_parity: "BATT PARITY",
    temp_range: "TEMP RANGE", radio_disp: "RADIO DISP",
    fleet_summary: "FLEET SUMMARY", total_alerts_24h: "ALERTS 24H",
    critical_24h: "CRITICAL 24H", avg_battery: "AVG BATTERY",
    network_parity: "NETWORK PARITY", last_seen: "LAST SEEN",
    gps_coords: "GPS COORDS", classification: "CLASSIFICATION",
    add_robot: "ADD ROBOT", fps: "FPS", location: "LOCATION",
    section: "SECTION", delta_basin: "DELTA BASIN", hq_entry: "HQ ENTRY", grid: "GRID",
  },
  TW: {
    overview: "NHWƐSO", mission: "ADWUMA", intel: "NYANSA", command: "AHWƐFO", live: "MPREMPREN",
    system_ready: "MFIRI NO AYƐ KRADO", packet_stable: "NKRA NO GYINA YIE",
    global_status: "WIASE NYINAA NKƆMMƆBƆ GYINABƐA", live_feeds: "MPREMPREN VIDEO",
    env_telemetry: "MPƆTAM TEBEA", emergency_stream: "GYE ME TAATA NKRA",
    waypoint_master: "KWANKYERƐ PANYIN", sensor_log: "MMFIRI NKRA",
    gsm_log: "GSM/SMS NKRA AFƆTUBƐA", system_health: "MFIRI NO TEBEA",
    ground: "ASEƐ AFIRI", aqua: "NSUOM AFIRI", base: "GYINABƐA PANYIN",
    online: "ƐWƆ MPƆTAM", offline: "ƐNIM MPƆTAM", syncing: "ƐBOA NKRA",
    remoting: "WƆAKYIRƐ", auto: "ƐNƆANKASA", manual: "NSA ANO",
    live_coord: "MPREMPREN NKYERƐ", lat: "LAT", lon: "LON",
    unit_direct: "AFIRI PANYIN NKƆMMƆ",
    battery: "TƆHYƐ", signal: "AHYƐNSODE", mode: "ƆKWAN",
    soil_score: "DƆTE AKONTAA", mercury: "MERCURY MG/KG",
    turbidity: "NSU NSƐM NTU", ph_value: "pH BOƆ",
    signal_str: "AHYƐNSODE", batt_parity: "TƆHYƐ PƐYƐ",
    temp_range: "AHOHYEHYƐ", radio_disp: "RADIO TEBEA",
    fleet_summary: "AFIRI NYINAA NSƐM", total_alerts_24h: "NKRA 24H",
    critical_24h: "AKWANHYIA 24H", avg_battery: "TƆHYƐ KƐSE",
    network_parity: "NKƆMMƆBƆ PƐYƐ", last_seen: "DA A ƐHUI",
    gps_coords: "GPS BEAE", classification: "NSƐM MU",
    add_robot: "FA AFIRI KA HO", fps: "FPS", location: "BEAE",
    section: "FA", delta_basin: "DELTA NSU", hq_entry: "HQ KWAN", grid: "GRID",
  },
  GA: {
    overview: "KWA", mission: "NITSUMƆ", intel: "NILE", command: "KWƐLƆI", live: "AGBƐNƐ",
    system_ready: "TSƆNE LƐ EFƐ GBƐƐ", packet_stable: "SANE LƐ ME GBƐ",
    global_status: "JE LƐ FƐƐ NITSUMƆ GBƐHE", live_feeds: "AGBƐNƐ VIDEO",
    env_telemetry: "HE LƐ TEEMƆ", emergency_stream: "YIWALAHERƐMƆ SANE",
    waypoint_master: "GBƐTSƆƆLƆ NYƆŊMODƆƆ", sensor_log: "TSƆNE SANE",
    gsm_log: "GSM/SMS SANE GBƐHE", system_health: "TSƆNE LƐ TEEMƆ",
    ground: "SHIKPƆŊ TSƆNE", aqua: "NU TSƆNE", base: "BASE GBƐHE",
    online: "KPAAKPA", offline: "EGBE", syncing: "EBOA",
    remoting: "SEKWE", auto: "LE TƆƆ", manual: "DƐŊ",
    live_coord: "AGBƐNƐ GBƐHE", lat: "LAT", lon: "LON",
    unit_direct: "TSƆNE NITSUMƆ",
    battery: "BAATRII", signal: "SANE", mode: "KƐƐMƆ",
    soil_score: "TSƆƆLƆ KƆUNTƆƆ", mercury: "MERCURY MG/KG",
    turbidity: "NU GBƐHE NTU", ph_value: "pH BƆ",
    signal_str: "SANE GBƐ", batt_parity: "BAATRII PƐLƐ",
    temp_range: "OTSU TEEMƆ", radio_disp: "RADIO TEEMƆ",
    fleet_summary: "TSƆNE FƐƐ NITSUMƆ", total_alerts_24h: "SANE 24H",
    critical_24h: "KPƆƉE 24H", avg_battery: "BAATRII GÃ",
    network_parity: "KADODO PƐLƐ", last_seen: "EKƐ HU",
    gps_coords: "GPS GBƐHE", classification: "NITSUMƆ",
    add_robot: "SHIKPƆŊ TSƆNE", fps: "FPS", location: "HE",
    section: "KWƐLƆI", delta_basin: "DELTA NU", hq_entry: "HQ KWAN", grid: "GRID",
  },
  EW: {
    overview: "ETENAFE", mission: "DƆWƆNA", intel: "NUNYANYA", command: "DZIKPƆLA", live: "FIFI",
    system_ready: "MƆ̃A DZRAƉO", packet_stable: "NYA LIA",
    global_status: "XEXEAME KADODO TEƉOƉO", live_feeds: "KƐMƐRA KASESE",
    env_telemetry: "NUTOME TEFE", emergency_stream: "KPƆƉE NYIGBA",
    waypoint_master: "MƆFIA GÃ", sensor_log: "MƆ̃A ME NYAWO",
    gsm_log: "GSM/SMS NYAKATAKATA", system_health: "MƆ̃A ŊUTENƆMƐ",
    ground: "ANYIGBA MƆ̃", aqua: "TSIME MƆ̃", base: "TEFE GÃ",
    online: "ELE ME", offline: "MELE ME O", syncing: "EBOAM",
    remoting: "DIDIFE", auto: "EƉOKUI", manual: "ASI",
    live_coord: "FIFI GBƐHE", lat: "LAT", lon: "LON",
    unit_direct: "MƆ̃A DƆWƆNA",
    battery: "BAATRII", signal: "NYATEFE", mode: "MƆNU",
    soil_score: "ANYIGBA KƆUNTƆƆ", mercury: "MERCURY MG/KG",
    turbidity: "TSI TEFE NTU", ph_value: "pH ÑU",
    signal_str: "NYATEFE GBƐ", batt_parity: "BAATRII ƉEKA",
    temp_range: "DZƆDZƆ TEFE", radio_disp: "RADIO TEFE",
    fleet_summary: "MƆ̃A KATÃ ME NYAWO", total_alerts_24h: "NYAWO 24H",
    critical_24h: "KPƆƉE 24H", avg_battery: "BAATRII TITINA",
    network_parity: "KADODO ƉEKA", last_seen: "EGBE KPƆ",
    gps_coords: "GPS TEFE", classification: "XƆXƆGBE",
    add_robot: "TSƆ MƆ̃ ÐE EŊUTI", fps: "FPS", location: "TEFE",
    section: "AKPA", delta_basin: "DELTA TSI", hq_entry: "HQ ƑOMEVI", grid: "GRID",
  },
  FR: {
    overview: "APERÇU", mission: "MISSION", intel: "RENS", command: "COMMANDE", live: "DIRECT",
    system_ready: "SYSTÈME PRÊT", packet_stable: "PAQUET STABLE",
    global_status: "STATUT RÉSEAU GLOBAL", live_feeds: "FLUX TACTIQUES DIRECTS",
    env_telemetry: "TÉLÉMÉTRIE ENV", emergency_stream: "FLUX D'URGENCE",
    waypoint_master: "MAÎTRE DE POINT", sensor_log: "LOG CAPTEURS",
    gsm_log: "LOG GSM/SMS", system_health: "SANTÉ SYSTÈME",
    ground: "ROVER SOL", aqua: "SCOUT AQUA", base: "HUB BASE",
    online: "EN LIGNE", offline: "HORS LIGNE", syncing: "SYNCHRO",
    remoting: "À DISTANCE", auto: "AUTO", manual: "MANUEL",
    live_coord: "COORD EN DIRECT", lat: "LAT", lon: "LON",
    unit_direct: "INTERFACE DIRECTE",
    battery: "BATTERIE", signal: "SIGNAL", mode: "MODE",
    soil_score: "SCORE SOL", mercury: "MERCURE MG/KG",
    turbidity: "TURBIDITÉ NTU", ph_value: "VALEUR pH",
    signal_str: "PUISSANCE SIG", batt_parity: "PARITÉ BATT",
    temp_range: "PLAGE TEMP", radio_disp: "RADIO DISP",
    fleet_summary: "RÉSUMÉ FLOTTE", total_alerts_24h: "ALERTES 24H",
    critical_24h: "CRITIQUES 24H", avg_battery: "BATT MOY",
    network_parity: "PARITÉ RÉSEAU", last_seen: "VU DERNIER",
    gps_coords: "COORD GPS", classification: "CLASSIFICATION",
    add_robot: "AJOUTER ROBOT", fps: "FPS", location: "EMPLACEMENT",
    section: "SECTION", delta_basin: "BASSIN DELTA", hq_entry: "ENTRÉE QG", grid: "GRILLE",
  }
};

/* ─── Mini Sparkline SVG ─── */
const Sparkline: React.FC<{ color: string, offset: number }> = ({ color, offset }) => {
  const points = Array.from({ length: 20 }, (_, i) => {
    const y = 15 + Math.sin(i * 0.8 + offset) * 10 + Math.random() * 4;
    return `${i * 6},${y}`;
  }).join(' ');
  return (
    <svg width="120" height="32" className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
};

const AsaaseView: React.FC = () => {
  const [status, setStatus] = useState<api.RobotStatus | null>(null);
  const [groundLatest, setGroundLatest] = useState<api.GroundTelemetry[]>([]);
  const [aquaLatest, setAquaLatest] = useState<api.AquaTelemetry[]>([]);
  const [groundHeatmap, setGroundHeatmap] = useState<any>(null);
  const [aquaHeatmap, setAquaHeatmap] = useState<any>(null);
  const [alerts, setAlerts] = useState<api.AsaaseAlert[]>([]);
  const [alertPage, setAlertPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<api.RemediationReport | null>(null);
  const [waypoints, setWaypoints] = useState<{lat: number, lon: number}[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<'GROUND_01' | 'AQUA_01'>('GROUND_01');
  const [robotSettings, setRobotSettings] = useState<api.RobotSettings | null>(null);
  const [baseSettings, setBaseSettings] = useState<api.BaseSettings | null>(null);
  const [approvals, setApprovals] = useState<api.PendingApproval[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [time, setTime] = useState(new Date());
  const [groundHistory, setGroundHistory] = useState<{ts: number, confidence_score: number, battery_pct: number}[]>([]);
  const [aquaHistory, setAquaHistory] = useState<{ts: number, turbidity_ntu: number, ph_value: number, battery_pct: number}[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<{msg: string, type: 'info' | 'warn' | 'crit', ts: number}[]>([]);
  const [activeCategory, setActiveCategory] = useState<'OVERVIEW' | 'MISSION' | 'INTEL' | 'COMMAND' | 'LIVE'>('OVERVIEW');
  const [language, setLanguage] = useState<LangKey>('EN');
  const [sparklineOffset, setSparklineOffset] = useState(0);

  const t = dict[language];

  const [health, setHealth] = useState<any>(null);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [s, gl, al, gh, ah, alertsRes, settingsRes, baseRes, appRes, healthRes] = await Promise.all([
        api.fetchAsaaseStatus(),
        api.fetchGroundLatest(),
        api.fetchAquaLatest(),
        api.fetchGroundHeatmap(),
        api.fetchAquaHeatmap(),
        api.fetchAsaaseAlerts(alertPage, 10),
        api.fetchControlSettings(selectedRobot),
        api.fetchBaseSettings(),
        api.fetchPendingApprovals(),
        api.fetchSystemHealth()
      ]);
      setStatus(s);
      setGroundLatest(gl);
      setAquaLatest(al);
      setGroundHeatmap(gh);
      setAquaHeatmap(ah);
      setAlerts(alertsRes);
      setRobotSettings(settingsRes);
      setBaseSettings(baseRes);
      setApprovals(appRes);
      setHealth(healthRes);

      // Fetch history for trends
      const [ghist, ahist] = await Promise.all([
        api.fetchGroundHistory(),
        api.fetchAquaHistory()
      ]);
      setGroundHistory(ghist);
      setAquaHistory(ahist);

    } catch (e) {
      console.error("Failed to fetch ASAASE data", e);
    } finally {
      setIsRefreshing(false);
      setIsInitialLoad(false);
    }
  };

  const addConsoleLog = (msg: string, type: 'info' | 'warn' | 'crit' = 'info') => {
    setConsoleLogs(prev => [{ msg, type, ts: Date.now() }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    const clock = setInterval(() => {
        setTime(new Date());
        setSparklineOffset(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, [alertPage, selectedRobot]);

  const handleMapClick = (lat: number, lon: number) => {
    setWaypoints([...waypoints, { lat, lon }]);
  };

  const handleClearWaypoints = () => setWaypoints([]);

  const handleUploadWaypoints = async (robotId: string) => {
    try {
      if (robotId.startsWith('GROUND')) {
        await api.uploadGroundWaypoints(robotId, waypoints);
      } else {
        await api.uploadAquaRoute(robotId, waypoints);
      }
      setWaypoints([]);
      addConsoleLog(`Mission waypoints uploaded to ${robotId}`, 'info');
    } catch (e) {
      addConsoleLog(`Failed to upload waypoints to ${robotId}`, 'crit');
      alert("Upload failed");
    }
  };

  const handleViewReport = async (alertId: number) => {
    try {
      const report = await api.fetchReport(alertId);
      setSelectedReport(report);
    } catch (e) {
      alert("Report not found");
    }
  };

  /* ─── Derived data for OVERVIEW ─── */
  const groundBattery = status?.ground?.battery_pct ?? groundLatest[0]?.battery_pct ?? 0;
  const aquaBattery = status?.aqua?.battery_pct ?? aquaLatest[0]?.battery_pct ?? 0;
  const groundOnline = status?.ground?.online ?? false;
  const aquaOnline = status?.aqua?.online ?? false;
  const avgBattery = Math.round((groundBattery + aquaBattery + 100) / 3); // base = 100%
  const alertCount24h = status?.alert_count_24h ?? 0;
  const criticalCount24h = status?.critical_count_24h ?? 0;
  const isSelectedOnline = selectedRobot === 'GROUND_01' ? groundOnline : aquaOnline;

  const timeSince = (epoch: number) => {
    if (!epoch) return '---';
    const sec = Math.floor(Date.now() / 1000 - epoch);
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    return `${Math.floor(sec / 3600)}h`;
  };

  const robotCards = [
    {
      id: 'ASA-GROUND-01',
      type: t.ground,
      status: groundOnline ? t.online : t.offline,
      battery: `${groundBattery}%`,
      signal: groundOnline ? 'STABLE' : 'LOST',
      mode: t.auto,
      color: 'emerald',
      colorHex: '#10b981',
      gps: groundLatest[0] ? `${groundLatest[0].gps_lat.toFixed(4)}, ${groundLatest[0].gps_lon.toFixed(4)}` : '---',
      lastSeen: timeSince(status?.ground?.last_seen ?? 0),
      classification: groundLatest[0]?.soil_classification ?? '---',
    },
    {
      id: 'ASA-AQUA-07',
      type: t.aqua,
      status: aquaOnline ? t.online : t.offline,
      battery: `${aquaBattery}%`,
      signal: aquaOnline ? 'WEAK' : 'LOST',
      mode: t.manual,
      color: 'amber',
      colorHex: '#f59e0b',
      gps: aquaLatest[0] ? `${aquaLatest[0].gps_lat.toFixed(4)}, ${aquaLatest[0].gps_lon.toFixed(4)}` : '---',
      lastSeen: timeSince(status?.aqua?.last_seen ?? 0),
      classification: aquaLatest[0]?.dual_stream_verdict ?? '---',
    },
    {
      id: 'ASA-BASE-ALPHA',
      type: t.base,
      status: t.online,
      battery: '100%',
      signal: 'LOCKED',
      mode: t.auto,
      color: 'blue',
      colorHex: '#3b82f6',
      gps: '5.6037, -0.1870',
      lastSeen: '0s',
      classification: 'HUB',
    },
  ];

  /* ─── Loading Guard ─── */
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
         <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="flex flex-col items-center">
               <h2 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">Initializing ASAASE Cockpit</h2>
               <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mt-2">Connecting to Ghana Base Hub GH_01...</p>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-[#0f1115] flex flex-col font-sans animate-in fade-in duration-1000 transition-colors duration-300">
      
      {/* ════════════════ TACTICAL SUB-NAV BAR ════════════════ */}
      <div className="flex items-center justify-between px-8 py-4 bg-[#0d1117] border-b border-white/5 relative z-20">
         <div className="flex items-center gap-8">
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
               {(['OVERVIEW', 'MISSION', 'INTEL', 'COMMAND', 'LIVE'] as const).map((cat) => (
                  <button
                     key={cat}
                     onClick={() => setActiveCategory(cat)}
                     className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${
                        activeCategory === cat ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                     }`}
                  >
                     {activeCategory === cat && (
                        <motion.div layoutId="nav-glow" className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl" />
                     )}
                     <span className="relative z-10">{t[cat.toLowerCase()]}</span>
                  </button>
               ))}
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/5"></div>
            <div className="flex items-center gap-3">
               <Bot size={16} className={isSelectedOnline ? "text-emerald-500 dark:text-emerald-400" : "text-rose-600 dark:text-rose-500"} />
               <span className={`text-[10px] font-black uppercase tracking-widest italic ${isSelectedOnline ? "text-slate-500 dark:text-slate-400 animate-pulse" : "text-rose-600 dark:text-rose-500"}`}>
                  {isSelectedOnline ? `${t.system_ready}: ${selectedRobot.replace('_', ' ')} :: ${t.packet_stable}` : `${selectedRobot.replace('_', ' ')} :: ${t.offline} - NO SIGNAL`}
               </span>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 mr-4">
               {(['EN', 'TW', 'GA', 'EW', 'FR'] as const).map((lang) => (
                  <button
                     key={lang}
                     onClick={() => setLanguage(lang)}
                     className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${
                        language === lang ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                     }`}
                  >
                     {lang}
                  </button>
               ))}
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-black italic">
               <Clock size={16} />
               {time.toLocaleTimeString([], {hour12: false})}
            </div>
            <button 
               onClick={fetchData} 
               className={`p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-slate-200 dark:border-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
               <RefreshCcw size={16} className="text-slate-500 dark:text-slate-400" />
            </button>
         </div>
      </div>

      {/* ════════════════ DECK CONTENT ════════════════ */}
      <div className="flex-1 overflow-hidden relative">
        <div className="grid grid-cols-4 gap-6 p-8 items-start h-full overflow-y-auto custom-scrollbar">

          {/* ══════ OVERVIEW DECK ══════ */}
          {activeCategory === 'OVERVIEW' && (
            <>
              <div className="col-span-4 mb-4">
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter uppercase flex items-center gap-4">
                    <Globe size={28} className="text-emerald-600 dark:text-emerald-500" />
                    {t.global_status}
                 </h2>
              </div>
              
              {robotCards.map((robot, i) => (
                <div key={i} className="col-span-1 bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 p-6 rounded-[2rem] shadow-xl hover:border-emerald-500/20 transition-all group relative overflow-hidden transition-colors">
                   <div className={`absolute top-0 left-0 w-1 h-full`} style={{ backgroundColor: robot.colorHex, opacity: 0.5 }}></div>
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{robot.type}</span>
                         <h3 className="text-lg font-black text-slate-800 dark:text-white italic truncate">{robot.id}</h3>
                      </div>
                      <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${
                        robot.status === t.online ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                      }`}>
                         {robot.status}
                      </div>
                   </div>
                   
                   {/* Activity Sparkline */}
                   <div className="mb-4">
                      <Sparkline color={robot.colorHex} offset={sparklineOffset} />
                   </div>

                   <div className="space-y-3 font-mono">
                      <div className="flex justify-between text-[10px] border-b border-slate-100 dark:border-white/5 pb-2">
                         <span className="text-slate-400 dark:text-slate-500">{t.battery}</span>
                         <span className="text-slate-800 dark:text-white font-black">{robot.battery}</span>
                      </div>
                      <div className="flex justify-between text-[10px] border-b border-slate-100 dark:border-white/5 pb-2">
                         <span className="text-slate-400 dark:text-slate-500">{t.signal}</span>
                         <span className="text-slate-800 dark:text-white font-black">{robot.signal}</span>
                      </div>
                      <div className="flex justify-between text-[10px] border-b border-slate-100 dark:border-white/5 pb-2">
                         <span className="text-slate-400 dark:text-slate-500">{t.gps_coords}</span>
                         <span className="text-emerald-600 dark:text-emerald-400 font-black text-[9px]">{robot.gps}</span>
                      </div>
                      <div className="flex justify-between text-[10px] border-b border-slate-100 dark:border-white/5 pb-2">
                         <span className="text-slate-400 dark:text-slate-500">{t.last_seen}</span>
                         <span className="text-slate-800 dark:text-white font-black">{robot.lastSeen}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                         <span className="text-slate-400 dark:text-slate-500">{t.mode}</span>
                         <span className="text-slate-800 dark:text-white font-black uppercase text-sm">{robot.mode}</span>
                      </div>
                   </div>
                </div>
              ))}

              <div className="col-span-1 bg-slate-100 dark:bg-black/40 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem] flex flex-col items-center justify-center p-8 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group h-full min-h-[220px]">
                 <Bot size={48} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors mb-4" />
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t.add_robot}...</span>
              </div>

              {/* Fleet Summary Row */}
              <div className="col-span-4 grid grid-cols-4 gap-4 mt-2">
                 {[
                   { label: t.total_alerts_24h, value: String(alertCount24h), icon: <AlertCircle size={18} className="text-amber-500 dark:text-amber-400" />, color: 'text-amber-600 dark:text-amber-400' },
                   { label: t.critical_24h, value: String(criticalCount24h), icon: <Shield size={18} className="text-rose-600 dark:text-rose-500" />, color: 'text-rose-600 dark:text-rose-500' },
                   { label: t.avg_battery, value: `${avgBattery}%`, icon: <Battery size={18} className="text-emerald-600 dark:text-emerald-400" />, color: 'text-emerald-600 dark:text-emerald-400' },
                   { label: t.network_parity, value: '94%', icon: <Wifi size={18} className="text-blue-600 dark:text-blue-400" />, color: 'text-blue-600 dark:text-blue-400' },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 dark:hover:border-white/10 transition-all">
                      <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl">{stat.icon}</div>
                      <div>
                         <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{stat.label}</span>
                         <span className={`text-2xl font-black italic tracking-tighter font-mono ${stat.color}`}>{stat.value}</span>
                      </div>
                   </div>
                 ))}
              </div>
            </>
          )}

          {/* ══════ LIVE DECK ══════ */}
          {activeCategory === 'LIVE' && (
            <>
               <div className="col-span-4 mb-4">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter uppercase flex items-center gap-4">
                     <Activity size={28} className="text-rose-600 dark:text-rose-500" />
                     {t.live_feeds}
                  </h2>
               </div>
               
               {[
                 { label: `${t.ground} :: G-CAM-01`, subLabel: `${t.section} B-4`, source: 'GROUND' as const, type: 'FRONT' as const, isOnline: groundOnline },
                 { label: `${t.aqua} :: A-CAM-07`, subLabel: t.delta_basin, source: 'AQUA' as const, type: 'FORWARD' as const, isOnline: aquaOnline },
                 { label: `${t.base} :: B-CAM-MAIN`, subLabel: t.hq_entry, source: 'GROUND' as const, type: 'SIDE' as const, isOnline: groundOnline },
                 { label: `SOIL SCANNER :: S-SCAN-01`, subLabel: `${t.grid} 12`, source: 'GROUND' as const, type: 'DOWN' as const, isOnline: groundOnline }
               ].map((feed, i) => (
                 <div key={i} className="col-span-2 bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative group transition-colors">
                    <CameraFeed
                       label={feed.label}
                       subLabel={feed.subLabel}
                       source={feed.source}
                       type={feed.type}
                       isOnline={feed.isOnline}
                    />
                    {/* Telemetry overlay */}
                    {feed.isOnline && (
                    <div className="absolute top-14 left-4 z-10 flex flex-col gap-2">
                       <div className="px-3 py-1.5 bg-white/70 dark:bg-black/70 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl font-mono text-[9px] text-slate-800 dark:text-slate-400 flex items-center gap-2 w-fit transition-colors">
                          <MapPin size={10} className="text-emerald-600 dark:text-emerald-400" />
                          {i === 0 && groundLatest[0] ? `${groundLatest[0].gps_lat.toFixed(4)}, ${groundLatest[0].gps_lon.toFixed(4)}` : 
                           i === 1 && aquaLatest[0] ? `${aquaLatest[0].gps_lat.toFixed(4)}, ${aquaLatest[0].gps_lon.toFixed(4)}` :
                           '---'}
                       </div>
                       <div className="px-3 py-1.5 bg-white/70 dark:bg-black/70 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl font-mono text-[9px] text-slate-800 dark:text-slate-400 w-fit transition-colors">
                          24.5 {t.fps} :: {t.remoting}
                       </div>
                    </div>
                    )}
                 </div>
               ))}
            </>
          )}

          {/* ══════ MISSION DECK ══════ */}
          {activeCategory === 'MISSION' && (
            <>
              <div className="col-span-2 flex flex-col gap-6 h-fit animate-in slide-in-from-left-4 duration-500">
                <div className="bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-2xl h-[550px] relative group transition-colors">
                   <AsaaseMap 
                     groundPos={groundLatest[0] ? [groundLatest[0].gps_lat, groundLatest[0].gps_lon] : [6.5, -1.5]}
                     aquaPos={aquaLatest[0] ? [aquaLatest[0].gps_lat, aquaLatest[0].gps_lon] : [6.5, -1.6]}
                     groundHeatmap={groundHeatmap}
                     aquaHeatmap={aquaHeatmap}
                     onMapClick={handleMapClick}
                     waypoints={waypoints}
                     breadCrumbs={selectedRobot.startsWith('GROUND') 
                        ? groundHistory.map(p => [6.5 + (p.confidence_score - 0.5) * 0.01, -1.5 + (p.ts % 100) * 0.0001])
                        : aquaHistory.map(p => [6.5 + (p.ph_value - 7) * 0.01, -1.6 + (p.ts % 100) * 0.0001])
                     }
                   />
                   <div className="absolute top-6 left-6 z-10 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl transition-colors">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">{t.live_coord}</span>
                      <div className="space-y-1 font-mono text-[10px] text-slate-700 dark:text-white/80">
                         <div className="flex justify-between gap-4"><span>{t.lat}:</span> <span className="text-emerald-600 dark:text-emerald-400">{groundLatest[0]?.gps_lat?.toFixed(6) || '---'}</span></div>
                         <div className="flex justify-between gap-4"><span>{t.lon}:</span> <span className="text-emerald-600 dark:text-emerald-400">{groundLatest[0]?.gps_lon?.toFixed(6) || '---'}</span></div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-bottom-4 duration-500 delay-75">
                <div className="bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 p-8 rounded-[2rem] shadow-xl h-fit hover:border-emerald-500/20 transition-colors">
                   <div className="flex items-center gap-3 mb-6">
                      <Bot size={20} className="text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest italic">{t.waypoint_master}</h4>
                   </div>
                   <WaypointEditor 
                      waypoints={waypoints}
                      onClear={handleClearWaypoints}
                      onUpload={handleUploadWaypoints}
                      selectedRobot={selectedRobot}
                      setSelectedRobot={setSelectedRobot}
                   />
                </div>

                {/* 24H TRENDS */}
                <div className="bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 p-8 rounded-[2rem] shadow-xl mt-6 transition-colors">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Activity size={20} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest italic">24H TELEMETRY TRENDS</span>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(selectedRobot.startsWith('GROUND') ? groundHistory : aquaHistory) as any}>
                        <defs>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                        <XAxis dataKey="ts" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          itemStyle={{ color: '#10b981', fontSize: '10px', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey={selectedRobot.startsWith('GROUND') ? 'confidence_score' : 'ph_value'} stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Column 3: Fleet Drill-down */}
              <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-right-4 duration-500 delay-150">
                 <div className="bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 p-8 rounded-[2rem] shadow-xl h-fit transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                       <Globe size={20} className="text-emerald-600 dark:text-emerald-400" />
                       <h4 className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest italic">FLEET STATUS</h4>
                    </div>
                    <div className="space-y-4">
                       {robotCards.map((robot, i) => (
                          <div key={i} 
                            onClick={() => setSelectedRobot(robot.id.includes('GROUND') ? 'GROUND_01' : 'AQUA_01')}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedRobot === (robot.id.includes('GROUND') ? 'GROUND_01' : 'AQUA_01') ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 hover:border-emerald-500/20'}`}
                          >
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase">{robot.id}</span>
                                <div className={`w-1.5 h-1.5 rounded-full ${robot.status === t.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase">BATT: {robot.battery}</span>
                                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-tighter">{robot.signal}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </>
          )}

          {/* ══════ INTELLIGENCE DECK ══════ */}
          {activeCategory === 'INTEL' && (
            <>
              {/* Column 1: Environment Telemetry */}
              <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-left-4 duration-500 text-slate-800 dark:text-white transition-colors">
                 <div className="bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 p-8 rounded-[2rem] shadow-xl h-fit">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                          <Zap size={20} className="text-amber-500" />
                          <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest italic">{t.env_telemetry}</span>
                       </div>
                       <Activity size={18} className="text-slate-400 dark:text-slate-600" />
                    </div>
                    
                    <div className="space-y-6">
                       {[
                         { label: t.soil_score, value: groundLatest[0]?.confidence_score?.toFixed(2) ?? '0.88', unit: 'CRIT', color: 'text-rose-600 dark:text-rose-500' },
                         { label: t.mercury, value: '12.5', unit: 'SCAN', color: 'text-amber-600 dark:text-amber-400' },
                         { label: t.turbidity, value: aquaLatest[0]?.turbidity_ntu?.toFixed(1) ?? '45.0', unit: 'STBL', color: 'text-emerald-600 dark:text-emerald-400' },
                         { label: t.ph_value, value: aquaLatest[0]?.ph_value?.toFixed(1) ?? '4.2', unit: 'ACID', color: 'text-rose-600 dark:text-rose-500' },
                       ].map((stat, i) => (
                         <div key={i} className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 transition-colors">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">{stat.label}</span>
                            <div className="text-right font-mono">
                               <span className={`text-2xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</span>
                               <span className="text-[10px] font-black text-slate-400 dark:text-slate-700 ml-2 uppercase">{stat.unit}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Column 2: Emergency Stream */}
              <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-bottom-4 duration-500 delay-75 transition-colors">
                 <div className="bg-white dark:bg-[#1a1d23] border border-rose-500/20 p-6 rounded-[2rem] shadow-xl h-fit relative group transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                       <div className="flex items-center gap-3">
                          <AlertCircle size={20} className="text-rose-600 dark:text-rose-500 animate-pulse" />
                          <span className="text-[12px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest italic">{t.emergency_stream}</span>
                       </div>
                       <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-black text-rose-600 dark:text-rose-500 uppercase animate-pulse">{t.live}</div>
                    </div>
                    <div className="h-[400px] overflow-y-auto custom-scrollbar relative z-10 pr-2">
                       <AlertList 
                          alerts={alerts} 
                          page={alertPage} 
                          setPage={setAlertPage} 
                          onViewReport={handleViewReport} 
                       />
                    </div>
                 </div>
                 
                 {/* SYSTEM CONSOLE */}
                 <div className="bg-slate-900/90 dark:bg-black/60 border border-slate-800 dark:border-white/5 p-6 rounded-[2rem] shadow-xl mt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Terminal size={18} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">REAL-TIME SYSTEM LOGS</span>
                    </div>
                    <div className="h-[150px] overflow-y-auto font-mono text-[9px] space-y-2 custom-scrollbar">
                      {consoleLogs.length === 0 && <div className="text-slate-600 block italic">-- NO LOGS CAPTURED --</div>}
                      {consoleLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-3">
                          <span className="text-slate-600 dark:text-slate-600">[{new Date(log.ts).toLocaleTimeString()}]</span>
                          <span className={log.type === 'warn' ? 'text-amber-500 dark:text-amber-400' : log.type === 'crit' ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-500 dark:text-emerald-400'}>
                            {log.msg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
              </div>

              {/* Columns 3-4: GSM/SMS Log */}
              <div className="col-span-2 flex flex-col gap-6 h-fit animate-in slide-in-from-right-4 duration-500 delay-150 transition-colors">
                 <div className="bg-white dark:bg-[#1a1d23] border border-blue-500/20 p-8 rounded-[3rem] shadow-xl h-fit transition-colors">
                    <div className="flex items-center gap-4 mb-8">
                       <MessageSquare size={24} className="text-blue-600 dark:text-blue-400" />
                       <h4 className="text-[14px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest italic">{t.gsm_log}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 font-mono">
                       {[
                         { target: 'EPA_DISTRICT_R1', status: 'SENT', msg: 'CRITICAL ALERT: GH_LOC_001. Remediation initiated.', time: '12:45' },
                         { target: 'WATER_BOARD_GH', status: 'SENT', msg: 'AQUA_01: pH Critical (4.2). Slaked Lime deployed.', time: '12:48' },
                         { target: 'DISTRICT_CHIEF_V1', status: 'DONE', msg: 'Bilingual Remediation Report draft generated.', time: '13:02' },
                         { target: 'BASE_HUB_OPS', status: 'INFO', msg: 'Network parity maintained at 94% signal.', time: '13:10' }
                       ].map((log, i) => (
                         <div key={i} className="bg-slate-50 dark:bg-black/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3 hover:bg-slate-100 dark:hover:bg-black/60 transition-all group cursor-default">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                               <span className="text-slate-500">{log.target}</span>
                               <span className={log.status === 'SENT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}>[{log.status}]</span>
                            </div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 italic leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">&gt; {log.msg}</p>
                            <div className="text-right text-[9px] text-slate-600 dark:text-slate-600 font-bold">{log.time} GMT</div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </>
          )}

          {/* ══════ COMMAND DECK ══════ */}
          {activeCategory === 'COMMAND' && (
            <>
              <div className="col-span-3 flex flex-col gap-6 h-fit animate-in slide-in-from-left-4 duration-500 transition-colors">
                 <div className="bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 rounded-[3rem] shadow-2xl overflow-hidden h-fit transition-all">
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 transition-all">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <Terminal size={24} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                             <h4 className="text-[16px] font-black text-slate-800 dark:text-white uppercase tracking-[0.3em] italic">{t.unit_direct}</h4>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/5 transition-colors">
                              <div className={`w-2 h-2 rounded-full ${isSelectedOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
                              <span className={`text-[12px] font-black uppercase tracking-widest italic ${isSelectedOnline ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-rose-600 dark:text-rose-500'}`}>
                                 {isSelectedOnline ? t.packet_stable : t.offline}
                              </span>
                           </div>
                       </div>
                    </div>
                    
                    <div className="p-8 h-fit">
                       <ControlHub 
                          robotId={selectedRobot}
                          settings={robotSettings}
                          baseSettings={baseSettings}
                          approvals={approvals}
                          onSettingsUpdate={fetchData}
                          onRobotChange={setSelectedRobot}
                       />
                    </div>
                 </div>
              </div>

               <div className="col-span-1 flex flex-col gap-6 h-fit animate-in slide-in-from-right-4 duration-500 delay-75 transition-colors">
                  <div className="bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] shadow-xl h-fit transition-colors">
                     <div className="flex justify-between items-center mb-6">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.base} GH_01</span>
                        <div className={`px-2 py-1 rounded-md text-[10px] font-black ${health?.status === 'OPERATIONAL' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                           {health?.status || t.online}
                        </div>
                     </div>
                     <div className="space-y-4">
                        {[
                          { label: 'CPU LOAD', value: `${health?.cpu || 0}%`, sub: 'CORE-UTIL' },
                          { label: 'MEMORY', value: `${health?.ram || 0}%`, sub: 'SYSTEM-RES' },
                          { label: 'LATENCY', value: `${health?.radio_latency_ms || 0}ms`, sub: 'RADIO-LINK' },
                          { label: 'DISK', value: `${health?.disk || 0}%`, sub: 'STORAGE' },
                        ].map((item, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5 group hover:border-emerald-500/30 transition-all">
                             <span className="text-[9px] font-black text-slate-500 uppercase block mb-2">{item.label}</span>
                             <div className="flex items-end justify-between">
                                <div className="text-emerald-600 dark:text-emerald-400 font-black italic text-xl tracking-tighter">{item.value}</div>
                                <div className="text-[8px] font-black text-slate-700 dark:text-slate-700 uppercase tracking-widest italic">{item.sub}</div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </>
          )}

        </div>
      </div>

      {selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #10b981; }
      `}
      </style>
    </div>
  );
};

export default AsaaseView;
