import React from 'react';
import { MousePointer2, Send, Trash2, List } from 'lucide-react';

interface WaypointEditorProps {
  waypoints: {lat: number, lon: number}[];
  onClear: () => void;
  onUpload: (target: 'GROUND_01' | 'AQUA_01') => void;
  selectedRobot: 'GROUND_01' | 'AQUA_01';
  setSelectedRobot: (id: 'GROUND_01' | 'AQUA_01') => void;
}

const WaypointEditor: React.FC<WaypointEditorProps> = ({ waypoints, onClear, onUpload, selectedRobot, setSelectedRobot }) => {
  return (
    <div className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <MousePointer2 size={18} className="text-emerald-400" />
          Waypoint Editor
        </h3>
        <div className="flex gap-2">
           <select 
             value={selectedRobot} 
             onChange={(e) => setSelectedRobot(e.target.value as 'GROUND_01' | 'AQUA_01')}
             className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1 text-xs text-slate-200 outline-none"
           >
             <option value="GROUND_01">GROUND_01</option>
             <option value="AQUA_01">AQUA_01</option>
           </select>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto mb-6 pr-2">
        {waypoints.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
            Click on the map to add waypoints
          </div>
        ) : (
          waypoints.map((wp, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {wp.lat?.toFixed(6) || '0.000000'}, {wp.lon?.toFixed(6) || '0.000000'}
                </span>
              </div>
              <List size={14} className="text-slate-600" />
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onClear}
          className="flex items-center justify-center gap-2 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm font-bold"
        >
          <Trash2 size={16} />
          Clear
        </button>
        <button 
          disabled={waypoints.length === 0}
          onClick={() => onUpload(selectedRobot)}
          className="flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] text-sm font-bold"
        >
          <Send size={16} />
          Upload
        </button>
      </div>
    </div>
  );
};

export default WaypointEditor;
