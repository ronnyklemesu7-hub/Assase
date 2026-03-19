import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon, trend, color = 'var(--primary)' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
        >
            <div className="flex justify-between items-start mb-4">
                <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `hsl(${color} / 0.1)`, border: `1px solid hsl(${color} / 0.2)` }}
                >
                    <div style={{ color: `hsl(${color})` }}>
                        {icon}
                    </div>
                </div>
                {trend && (
                    <div className={`px-2 py-1 rounded text-xs font-medium ${trend.isPositive ? 'text-emerald-700 bg-emerald-100 dark:text-green-400 dark:bg-green-400/10' : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-400/10'}`}>
                        {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                    </div>
                )}
            </div>

            <div>
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
                    {unit && <span className="text-slate-400 dark:text-gray-500 text-sm">{unit}</span>}
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
