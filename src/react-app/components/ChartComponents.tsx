import React from 'react';

interface BarChartProps {
    data: { label: string; value: number; color?: string }[];
    height?: number;
    title?: string;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({ data, height = 200, title }) => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {title && <h3 className="text-gray-700 font-bold mb-4">{title}</h3>}
            <div className="flex items-end justify-between space-x-2" style={{ height: `${height}px` }}>
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            {item.value}
                        </div>

                        <div
                            className={`w-full rounded-t-md transition-all duration-500 ${item.color || 'bg-blue-500'} hover:opacity-80`}
                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface LineChartProps {
    data: { label: string; value: number }[];
    height?: number;
    color?: string;
    title?: string;
}

export const SimpleLineChart: React.FC<LineChartProps> = ({ data, height = 200, color = '#8b5cf6', title }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (d.value / maxValue) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {title && <h3 className="text-gray-700 font-bold mb-4">{title}</h3>}
            <div className="relative w-full" style={{ height: `${height}px` }}>
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="0" x2="100" y2="0" stroke="#f3f4f6" strokeWidth="0.5" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#f3f4f6" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#f3f4f6" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#f3f4f6" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="100" y2="100" stroke="#f3f4f6" strokeWidth="0.5" />

                    {/* The Line */}
                    <polyline
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        points={points}
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Dots */}
                    {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 100;
                        const y = 100 - (d.value / maxValue) * 100;
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="1.5"
                                fill="white"
                                stroke={color}
                                strokeWidth="0.5"
                                className="hover:r-2 transition-all cursor-pointer"
                                vectorEffect="non-scaling-stroke"
                            >
                                <title>{`${d.label}: ${d.value}`}</title>
                            </circle>
                        );
                    })}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between mt-2">
                    {data.map((d, i) => (
                        <span key={i} className="text-xs text-gray-400">{d.label}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};
