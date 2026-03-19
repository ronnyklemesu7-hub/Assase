import React from 'react';

interface TelemetryTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  type: 'ground' | 'aqua';
}

const TelemetryTable: React.FC<TelemetryTableProps> = ({ data, type }) => {
  return (
    <div className="bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest transition-colors">
            <tr>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Robot ID</th>
              {type === 'ground' ? (
                <>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Action</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4">Turbidity (NTU)</th>
                  <th className="px-6 py-4">pH</th>
                  <th className="px-6 py-4">Verdict</th>
                </>
              )}
              <th className="px-6 py-4">Battery</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-white/5 transition-colors">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold text-[10px]">
                  Waiting for telemetry...
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-400 font-mono text-xs">
                    {new Date(row.ts * 1000).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{row.robot_id}</td>
                  {type === 'ground' ? (
                    <>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          row.soil_classification === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {row.soil_classification}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 dark:text-slate-400 font-mono">{row.confidence_score}%</td>
                      <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-400">{row.dispenser_action}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-slate-400 dark:text-slate-400 font-mono">{row.turbidity_ntu?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4 text-slate-400 dark:text-slate-400 font-mono">{row.ph_value?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          row.dual_stream_verdict === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {row.dual_stream_verdict}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{row.battery_pct}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TelemetryTable;
