import React, { useState, useEffect } from 'react';
import {
    Users, BarChart2, UserPlus, Settings, Mail, TrendingUp, Award,
    Target, BookOpen, Heart, MessageSquare, Calendar, Download,
    AlertCircle, CheckCircle, Clock, Activity, Brain, Smile
} from 'lucide-react';
import { db } from '../../../firebase-config';
import { collection, query, where, getCountFromServer, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface EnterpriseDashboardProps {
    user: any;
    userStats: any;
}

interface Collaborator {
    id: string;
    name: string;
    email: string;
    role: string;
    moodScore: number;
    lastActive: Date;
    completedTasks: number;
    engagementLevel: 'high' | 'medium' | 'low';
}

interface TeamMetrics {
    averageMood: number;
    engagementRate: number;
    activeUsers: number;
    completionRate: number;
    wellnessScore: number;
}

const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ user, userStats }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'development' | 'reports'>('overview');
    const [stats, setStats] = useState({
        collaborators: 124,
        newThisMonth: 12,
        engagement: 78
    });
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [teamMetrics, setTeamMetrics] = useState<TeamMetrics>({
        averageMood: 7.5,
        engagementRate: 82,
        activeUsers: 98,
        completionRate: 75,
        wellnessScore: 8.2
    });
    const [collaborators, setCollaborators] = useState<Collaborator[]>([
        {
            id: '1',
            name: 'Ana Silva',
            email: 'ana@empresa.com',
            role: 'Desenvolvedora',
            moodScore: 8,
            lastActive: new Date(),
            completedTasks: 12,
            engagementLevel: 'high'
        },
        {
            id: '2',
            name: 'Carlos Santos',
            email: 'carlos@empresa.com',
            role: 'Designer',
            moodScore: 6,
            lastActive: new Date(Date.now() - 86400000),
            completedTasks: 8,
            engagementLevel: 'medium'
        },
        {
            id: '3',
            name: 'Maria Oliveira',
            email: 'maria@empresa.com',
            role: 'Gerente',
            moodScore: 9,
            lastActive: new Date(),
            completedTasks: 15,
            engagementLevel: 'high'
        }
    ]);

    useEffect(() => {
        // In production, fetch real data from Firestore
        // const q = query(collection(db, 'users'), where('companyId', '==', user.uid));
        // const unsubscribe = onSnapshot(q, (snapshot) => {
        //   setCollaborators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        // });
        // return () => unsubscribe();
    }, [user]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setInviting(true);
        try {
            await addDoc(collection(db, 'company_invites'), {
                companyId: user.uid,
                companyName: user.displayName || 'Empresa',
                email: inviteEmail,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            alert(`Convite enviado para ${inviteEmail}`);
            setInviteEmail('');
        } catch (error) {
            console.error("Error inviting:", error);
            alert("Erro ao enviar convite.");
        } finally {
            setInviting(false);
        }
    };

    const getMoodEmoji = (score: number) => {
        if (score >= 8) return '😊';
        if (score >= 6) return '😐';
        return '😔';
    };

    const getEngagementColor = (level: string) => {
        switch (level) {
            case 'high': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-xl shadow-lg p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Painel Corporativo</h1>
                    <p className="text-gray-600">Gerencie o bem-estar da sua equipe</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-md p-2 flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'overview'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <BarChart2 className="w-4 h-4 inline mr-2" />
                    Visão Geral
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'team'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    Equipe
                </button>
                <button
                    onClick={() => setActiveTab('development')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'development'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <Target className="w-4 h-4 inline mr-2" />
                    Desenvolvimento
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'reports'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <Download className="w-4 h-4 inline mr-2" />
                    Relatórios
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-700">Colaboradores</h3>
                                <Users className="text-blue-600" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.collaborators}</p>
                            <p className="text-sm text-green-600">+{stats.newThisMonth} este mês</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-700">Engajamento</h3>
                                <TrendingUp className="text-purple-600" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.engagement}%</p>
                            <p className="text-sm text-gray-500">Média de uso semanal</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-700">Bem-Estar</h3>
                                <Heart className="text-green-600" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{teamMetrics.wellnessScore}/10</p>
                            <p className="text-sm text-gray-500">Score médio da equipe</p>
                        </div>
                    </div>

                    {/* Wellness Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Smile className="w-5 h-5 text-yellow-500 mr-2" />
                                Humor da Equipe
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">Muito Positivo (8-10)</span>
                                    <span className="font-bold text-green-600">45%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">Neutro (5-7)</span>
                                    <span className="font-bold text-yellow-600">40%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700">Necessita Atenção (1-4)</span>
                                    <span className="font-bold text-red-600">15%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Activity className="w-5 h-5 text-blue-500 mr-2" />
                                Atividade Recente
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">15 colaboradores completaram check-in hoje</p>
                                        <p className="text-xs text-gray-500">Há 2 horas</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Novo módulo de treinamento disponível</p>
                                        <p className="text-xs text-gray-500">Há 5 horas</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">3 colaboradores com baixo engajamento</p>
                                        <p className="text-xs text-gray-500">Ontem</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invite Section */}
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={inviting}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {inviting ? 'Enviando...' : 'Enviar Convite'}
                            </button>
                        </form>
                    </div>
                </>
            )}

            {/* Team Tab */}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
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
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {collab.lastActive.toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Development Tab */}
            {activeTab === 'development' && (
                <div className="space-y-6">
                    {/* Training Programs */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                            Programas de Treinamento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Gestão de Estresse</h4>
                                        <p className="text-sm text-gray-500">8 módulos • 4h de conteúdo</p>
                                    </div>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Ativo</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Progresso da equipe</span>
                                        <span className="font-medium">65%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">42 colaboradores inscritos</p>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Comunicação Efetiva</h4>
                                        <p className="text-sm text-gray-500">6 módulos • 3h de conteúdo</p>
                                    </div>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Ativo</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Progresso da equipe</span>
                                        <span className="font-medium">82%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">38 colaboradores inscritos</p>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Mindfulness no Trabalho</h4>
                                        <p className="text-sm text-gray-500">5 módulos • 2.5h de conteúdo</p>
                                    </div>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Em breve</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Interesse</span>
                                        <span className="font-medium">28 pessoas</span>
                                    </div>
                                </div>
                                <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                                    Ativar Programa
                                </button>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Equilíbrio Vida-Trabalho</h4>
                                        <p className="text-sm text-gray-500">7 módulos • 3.5h de conteúdo</p>
                                    </div>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Em breve</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Interesse</span>
                                        <span className="font-medium">35 pessoas</span>
                                    </div>
                                </div>
                                <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                                    Ativar Programa
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Goals & Achievements */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Target className="w-5 h-5 text-green-600 mr-2" />
                            Metas e Conquistas
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Award className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">Meta Mensal de Bem-Estar</p>
                                        <p className="text-sm text-gray-600">80% da equipe com check-in diário</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">92%</p>
                                    <p className="text-xs text-gray-500">Alcançado!</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Brain className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">Conclusão de Treinamentos</p>
                                        <p className="text-sm text-gray-600">Meta: 70% de conclusão</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-600">68%</p>
                                    <p className="text-xs text-gray-500">Quase lá!</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <MessageSquare className="w-8 h-8 text-purple-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">Feedback Contínuo</p>
                                        <p className="text-sm text-gray-600">Meta: 50 feedbacks este mês</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-purple-600">43</p>
                                    <p className="text-xs text-gray-500">86% completo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Download className="w-5 h-5 text-purple-600 mr-2" />
                            Relatórios Disponíveis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3">
                                    <BarChart2 className="w-8 h-8 text-blue-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">Relatório de Engajamento</p>
                                        <p className="text-sm text-gray-500">Últimos 30 dias</p>
                                    </div>
                                </div>
                                <Download className="w-5 h-5 text-gray-400" />
                            </button>

                            <button className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3">
                                    <Heart className="w-8 h-8 text-red-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">Análise de Bem-Estar</p>
                                        <p className="text-sm text-gray-500">Mensal</p>
                                    </div>
                                </div>
                                <Download className="w-5 h-5 text-gray-400" />
                            </button>

                            <button className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3">
                                    <TrendingUp className="w-8 h-8 text-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">Progresso de Treinamentos</p>
                                        <p className="text-sm text-gray-500">Trimestral</p>
                                    </div>
                                </div>
                                <Download className="w-5 h-5 text-gray-400" />
                            </button>

                            <button className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3">
                                    <Users className="w-8 h-8 text-purple-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">Relatório Completo da Equipe</p>
                                        <p className="text-sm text-gray-500">Anual</p>
                                    </div>
                                </div>
                                <Download className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <h4 className="font-bold text-xl mb-2">Insights Personalizados</h4>
                        <p className="mb-4 opacity-90">
                            Receba análises detalhadas e recomendações baseadas em IA para melhorar o bem-estar da sua equipe.
                        </p>
                        <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                            Gerar Relatório com IA
                        </button>
                    </div>
                </div>
            )}

            {/* Tips Section */}
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
