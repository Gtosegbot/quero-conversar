import React from 'react';
import { Users, BarChart2, UserPlus, Settings } from 'lucide-react';

interface EnterpriseDashboardProps {
    user: any;
    userStats: any;
}

const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ user, userStats }) => {
    return (
        <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900">Painel Corporativo</h1>
                <p className="text-gray-600">Gerencie o bem-estar da sua equipe</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700">Colaboradores</h3>
                        <Users className="text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">124</p>
                    <p className="text-sm text-green-600">+12 este mês</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700">Engajamento</h3>
                        <BarChart2 className="text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">78%</p>
                    <p className="text-sm text-gray-500">Média de uso semanal</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700">Plano</h3>
                        <Settings className="text-gray-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">Enterprise Bulk</p>
                    <p className="text-sm text-gray-500">Renova em 15/12</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 text-center py-12">
                <p className="text-gray-500">Funcionalidades de gestão de equipe em desenvolvimento.</p>
            </div>
        </div>
    );
};

export default EnterpriseDashboard;
