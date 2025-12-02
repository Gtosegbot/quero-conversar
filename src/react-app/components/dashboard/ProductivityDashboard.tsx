import React from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle, Target } from 'lucide-react';

interface ProductivityDashboardProps {
    teamId: string;
}

const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({ teamId }) => {
    const metrics = [
        { name: 'Tarefas Concluídas', value: 156, change: 12, trend: 'up' },
        { name: 'Tempo Médio', value: '2.5h', change: -8, trend: 'down' },
        { name: 'Taxa de Conclusão', value: '89%', change: 5, trend: 'up' },
        { name: 'Metas Atingidas', value: 23, change: 15, trend: 'up' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dashboard de Produtividade</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">{metric.name}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                            <div className={`flex items-center text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span className="ml-1">{Math.abs(metric.change)}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Top Performers</h4>
                {[
                    { name: 'Maria Oliveira', tasks: 45, score: 95 },
                    { name: 'Ana Silva', tasks: 42, score: 92 },
                    { name: 'Carlos Santos', tasks: 38, score: 88 }
                ].map((person, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                                {idx + 1}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{person.name}</p>
                                <p className="text-sm text-gray-600">{person.tasks} tarefas concluídas</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">{person.score}</p>
                            <p className="text-xs text-gray-500">Score</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductivityDashboard;
