import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';

interface WaterGaugeProps {
    title: string;
    value: number;
    min: number;
    max: number;
    unit: string;
    color: string;
}

const WaterGauge: React.FC<WaterGaugeProps> = ({ title, value, min, max, unit, color }) => {
    // Normalize value for the gauge (0-100)
    const normalizedValue = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    const data = [
        { value: normalizedValue },
        { value: 100 - normalizedValue }
    ];

    return (
        <div className="glass-card p-6 flex flex-col items-center">
            <h4 className="text-slate-500 dark:text-gray-400 text-sm font-medium mb-4 self-start">{title}</h4>
            <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={180}
                            endAngle={0}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell fill={`hsl(${color})`} />
                            <Cell fill="hsl(var(--border))" />
                            <Label
                                value={`${value}${unit}`}
                                position="center"
                                fill="hsl(var(--text-main))"
                                style={{ fontSize: '24px', fontWeight: 'bold' }}
                            />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-between w-full mt-2 text-xs text-slate-400 dark:text-gray-500">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
};

export default WaterGauge;
