import React, { useState } from 'react';
import {
    Users, BarChart2, UserPlus, Settings, Mail, TrendingUp, Award,
    Target, BookOpen, Heart, MessageSquare, Calendar, Download,
    AlertCircle, CheckCircle, Activity, Smile
} from 'lucide-react';
import { db } from '../../../firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Feedback360 from './Feedback360';
import OneOnOneScheduler from './OneOnOneScheduler';
import ProductivityDashboard from './ProductivityDashboard';

interface EnterpriseDashboardProps {
    user: any;
}

const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'development' | 'reports' | 'productivity' | 'feedback' | 'meetings'>('overview');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    const stats = { collaborators: 124, newThisMonth: 12, engagement: 78 };
    const teamMetrics = { wellnessScore: 8.2 };

    const collaborators = [
        { id: '1', name: 'Ana Silva', email: 'ana@empresa.com', role: 'Desenvolvedora', moodScore: 8, lastActive: new Date(), engagementLevel: 'high' as const },
        { id: '2', name: 'Carlos Santos', email: 'carlos@empresa.com', role: 'Designer', moodScore: 6, lastActive: new Date(Date.now() - 86400000), engagementLevel: 'medium' as const },
        { id: '3', name: 'Maria Oliveira', email: 'maria@empresa.com', role: 'Gerente', moodScore: 9, lastActive: new Date(), engagementLevel: 'high' as const }
    ];

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);
        try {
            await addDoc(collection(db, 'company_invites'), {
                companyId: user.uid,
                email: inviteEmail,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            alert(`Convite enviado para ${inviteEmail}`);
            setInviteEmail('');
        } catch (error) {
            alert("Erro ao enviar convite.");
        } finally {
            setInviting(false);
        }
    };

    const getMoodEmoji = (score: number) => score >= 8 ? '😊' : score >= 6 ? '😐' : '😔';
    const getEngagementColor = (level: string) => level === 'high' ? 'text-green-600 bg-green-100' : level === 'medium' ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100';

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-xl shadow-lg p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Painel Corporativo</h1>
                    <p className="text-gray-600">Gerencie o bem-estar da sua equipe</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md p-2 flex flex-wrap gap-2">
                {[
                    { id: 'overview', icon: BarChart2, label: 'Visão Geral' },
                    { id: 'team', icon: Users, label: 'Equipe' },
                    { id: 'development', icon: Target, label: 'Desenvolvimento' },
                    { id: 'productivity', icon: TrendingUp, label: 'Produtividade' },
                    { id: 'feedback', icon: MessageSquare, label: 'Feedback 360°' },
                    { id: 'meetings', icon: Calendar, label: 'Sessões 1-on-1' },
                    { id: 'reports', icon: Download, label: 'Relatórios' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 inline mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'Colaboradores', value: stats.collaborators, change: `+${stats.newThisMonth} este mês`, icon: Users, color: 'blue' },
                            { title: 'Engajamento', value: `${stats.engagement}%`, change: 'Média de uso semanal', icon: TrendingUp, color: 'purple' },
                            { title: 'Bem-Estar', value: `${teamMetrics.wellnessScore}/10`, change: 'Score médio da equipe', icon: Heart, color: 'green' }
                        ].map((stat, idx) => (
                            <div key={idx} className={`bg-white p-6 rounded-xl shadow-md border-l-4 border-${stat.color}-500`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-700">{stat.title}</h3>
                                    <stat.icon className={`text-${stat.color}-600`} />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.change}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <UserPlus className="w-5 h-5 text-purple-600 mr-2" />
                            Convidar Colaboradores
                        </h3>
                        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    placeholder="Email do colaborador"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={inviting} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                {inviting ? 'Enviando...' : 'Enviar Convite'}
                            </button>
                        </form>
                    </div>
                </>
            )}

            {activeTab === 'team' && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Gerenciamento de Equipe</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colaborador</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Humor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engajamento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Atividade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {collaborators.map((collab) => (
                                    <tr key={collab.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{collab.name}</p>
                                                <p className="text-sm text-gray-500">{collab.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{collab.role}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-2xl">{getMoodEmoji(collab.moodScore)}</span>
                                            <span className="ml-2 text-sm text-gray-600">{collab.moodScore}/10</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEngagementColor(collab.engagementLevel)}`}>
                                                {collab.engagementLevel === 'high' ? 'Alto' : collab.engagementLevel === 'medium' ? 'Médio' : 'Baixo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{collab.lastActive.toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'development' && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                        Programas de Treinamento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { name: 'Gestão de Estresse', modules: 8, hours: 4, progress: 65, enrolled: 42, active: true },
                            { name: 'Comunicação Efetiva', modules: 6, hours: 3, progress: 82, enrolled: 38, active: true },
                            { name: 'Mindfulness no Trabalho', modules: 5, hours: 2.5, interest: 28, active: false },
                            { name: 'Equilíbrio Vida-Trabalho', modules: 7, hours: 3.5, interest: 35, active: false }
                        ].map((program, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{program.name}</h4>
                                        <p className="text-sm text-gray-500">{program.modules} módulos • {program.hours}h de conteúdo</p>
                                    </div>
                                    <span className={`px-2 py-1 ${program.active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} text-xs rounded`}>
                                        {program.active ? 'Ativo' : 'Em breve'}
                                    </span>
                                </div>
                                {program.active && (
                                    <>
                                        <div className="mb-3">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Progresso da equipe</span>
                                                <span className="font-medium">{program.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${program.progress}%` }}></div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">{program.enrolled} colaboradores inscritos</p>
                                    </>
                                )}
                                {!program.active && <p className="text-sm text-gray-600">{program.interest} pessoas interessadas</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'productivity' && <ProductivityDashboard teamId={user.uid} />}
            {activeTab === 'feedback' && <Feedback360 companyId={user.uid} />}
            {activeTab === 'meetings' && <OneOnOneScheduler managerId={user.uid} />}

            {activeTab === 'reports' && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Relatórios Disponíveis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { name: 'Relatório de Engajamento', period: 'Últimos 30 dias', icon: BarChart2, color: 'blue' },
                            { name: 'Análise de Bem-Estar', period: 'Mensal', icon: Heart, color: 'red' },
                            { name: 'Progresso de Treinamentos', period: 'Trimestral', icon: TrendingUp, color: 'green' },
                            { name: 'Relatório Completo da Equipe', period: 'Anual', icon: Users, color: 'purple' }
                        ].map((report, idx) => (
                            <button key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3">
                                    <report.icon className={`w-8 h-8 text-${report.color}-600`} />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">{report.name}</p>
                                        <p className="text-sm text-gray-500">{report.period}</p>
                                    </div>
                                </div>
                                <Download className="w-5 h-5 text-gray-400" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                    Dica de Gestão
                </h4>
                <p className="text-gray-700 text-sm">
                    Incentive sua equipe a completar o check-in diário de humor. Equipes que monitoram o bem-estar têm 40% menos turnover e 35% mais produtividade.
                </p>
            </div>
        </div>
    );
};

export default EnterpriseDashboard;
