import React from 'react';
import { motion } from 'framer-motion';

interface SystemDiagramProps {
    netLoad: number;
    bottleClog: number;
    state: string;
    flow: number;
}

const SystemDiagram: React.FC<SystemDiagramProps> = ({ netLoad, bottleClog, state, flow }) => {
    return (
        <div className="glass-card p-6 flex flex-col items-center relative overflow-hidden h-full">
            <h3 className="text-xl font-semibold mb-8 self-start">Mechanical System Diagram</h3>

            <div className="flex flex-col gap-12 items-center w-full relative">
                {/* 1. Primary Basin */}
                <div className="relative w-48 h-24 border-2 border-primary/40 rounded-b-xl flex flex-col justify-end p-1">
                    <div
                        className="bg-blue-500/30 rounded-b-lg w-full transition-all duration-1000"
                        style={{ height: `${100 - netLoad}%` }}
                    />
                    <div className="absolute -top-6 left-0 text-[10px] text-text-muted uppercase tracking-wider">Primary Basin</div>
                    {/* Gears Indication */}
                    <div className={`absolute -right-8 top-1/2 -translate-y-1/2 transition-colors ${state === 'CLEAR_NETS' ? 'text-amber-400' : 'text-gray-600'}`}>
                        <div className={`animate-spin-slow ${state === 'CLEAR_NETS' ? 'opacity-100' : 'opacity-30'}`}>⚙️</div>
                        <div className="text-[8px] mt-1">Gears</div>
                    </div>
                </div>

                {/* Connection Pipe */}
                <div className="w-1 h-12 bg-primary/20 relative">
                    <motion.div
                        initial={{ top: 0 }}
                        animate={{ top: '100%' }}
                        transition={{ repeat: Infinity, duration: 2 / Math.max(0.1, flow / 10), ease: "linear" }}
                        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400 blur-[2px]"
                    />
                </div>

                {/* 2. Filter Bottle */}
                <div className="relative w-32 h-40 border-2 border-primary/40 rounded-t-lg rounded-b-[40px] flex flex-col overflow-hidden">
                    {/* Layers */}
                    <div className="h-1/4 bg-gray-700/50 border-b border-white/5 flex items-center justify-center text-[8px]">Stones</div>
                    <div className="h-1/5 bg-gray-600/50 border-b border-white/5 flex items-center justify-center text-[8px]">Sand</div>
                    <div className="h-1/5 bg-gray-500/50 border-b border-white/5 flex items-center justify-center text-[8px]">Charcoal</div>
                    <div className="flex-1 bg-blue-400/20 backdrop-blur-sm relative">
                        <div
                            className="absolute bottom-0 left-0 w-full bg-blue-600/20 transition-all duration-1000"
                            style={{ height: `${bottleClog}%` }}
                        />
                    </div>
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-[10px] text-text-muted uppercase tracking-wider -rotate-90">Multi-Layer Filter</div>
                </div>

                {/* Turbine Link */}
                <div className="w-24 h-1 bg-primary/20 absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-end">
                    <div className={`w-8 h-8 rounded-full border-2 border-accent/40 flex items-center justify-center bg-accent/10 ${flow > 5 ? 'animate-spin-slow' : ''}`}>
                        🌀
                    </div>
                    <div className="absolute -right-16 text-[10px] text-accent font-bold">Turbine</div>
                </div>
            </div>

            {/* Status Overlay */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold">
                {state.replace('_', ' ')}
            </div>
        </div>
    );
};

export default SystemDiagram;
