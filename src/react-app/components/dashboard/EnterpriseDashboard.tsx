import React, { useState } from 'react';
import {
    Users, BarChart2, UserPlus, Settings, Mail, TrendingUp, Award,
    Target, BookOpen, Heart, MessageSquare, Calendar, Download,
    AlertCircle, CheckCircle, Activity, Smile, X, Upload
} from 'lucide-react';
import { db } from '../../../firebase-config';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import Feedback360 from './Feedback360';
import OneOnOneScheduler from './OneOnOneScheduler';
import ProductivityDashboard from './ProductivityDashboard';
import EnterpriseDocsModal from './EnterpriseDocsModal';
import EnterpriseReports from './EnterpriseReports';
import ContentUploadForm from './ContentUploadForm';
import EnterpriseEmployees from '../../pages/EnterpriseEmployees';

interface EnterpriseDashboardProps {
    user: any;
}

const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'development' | 'reports' | 'productivity' | 'feedback' | 'meetings'>('overview');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
    const [showContentUpload, setShowContentUpload] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchCompanyId = async () => {
            if (user?.uid) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.company_id) {
                            setCompanyId(userData.company_id);
                        } else {
                            // Self-healing: User has no company_id
                            console.log("User missing company_id. Attempting self-healing...");

                            // 1. Check if user owns a company but link is missing
                            const companiesRef = collection(db, 'companies');
                            const q = query(companiesRef, where('admins', 'array-contains', user.uid));
                            const querySnapshot = await getDocs(q);

                            if (!querySnapshot.empty) {
                                // Found existing company, link it
                                const existingCompanyId = querySnapshot.docs[0].id;
                                await updateDoc(userRef, { company_id: existingCompanyId });
                                setCompanyId(existingCompanyId);
                                console.log("Recovered company_id from existing company:", existingCompanyId);
                            } else {
                                // 2. No company found, create one
                                console.log("No company found. Creating new company...");
                                const newCompanyData = {
                                    name: `${user.displayName || 'Minha'} Empresa`, // Default name
                                    owner_id: user.uid,
                                    admins: [user.uid],
                                    plan: 'enterprise_trial',
                                    createdAt: serverTimestamp(),
                                    status: 'active'
                                };
                                const newCompanyRef = await addDoc(collection(db, 'companies'), newCompanyData);

                                // Update user profile with company_id AND company_role
                                await updateDoc(userRef, {
                                    company_id: newCompanyRef.id,
                                    company_role: 'admin'
                                });
                                setCompanyId(newCompanyRef.id);
                                console.log("Created new company and linked:", newCompanyRef.id);

                                // 3. Seed Mock Employees
                                console.log("Seeding mock employees...");
                                const mockEmployees = [
                                    {
                                        name: "João Silva",
                                        email: "joao.silva@exemplo.com",
                                        department: "Vendas",
                                        role: "Vendedor",
                                        status: "active",
                                        joined_at: new Date().toISOString(),
                                        company_id: newCompanyRef.id
                                    },
                                    {
                                        name: "Maria Costa",
                                        email: "maria.costa@exemplo.com",
                                        department: "Marketing",
                                        role: "Analista",
                                        status: "invited",
                                        joined_at: new Date().toISOString(),
                                        company_id: newCompanyRef.id
                                    },
                                    {
                                        name: "Pedro Santos",
                                        email: "pedro.santos@exemplo.com",
                                        department: "TI",
                                        role: "Desenvolvedor",
                                        status: "active",
                                        joined_at: new Date().toISOString(),
                                        company_id: newCompanyRef.id
                                    }
                                ];

                                for (const emp of mockEmployees) {
                                    await addDoc(collection(db, 'company_employees'), emp);
                                }
                                console.log("Mock employees seeded.");
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching/healing company ID:", error);
                }
            }
        };
        fetchCompanyId();
    }, [user]);

    const stats = { collaborators: 124, newThisMonth: 12, engagement: 78 };
    const teamMetrics = { wellnessScore: 8.2 };

    const collaborators = [
        { id: '1', name: 'Ana Silva', email: 'ana@empresa.com', role: 'Desenvolvedora', moodScore: 8, lastActive: new Date(), engagementLevel: 'high' as const },
        { id: '2', name: 'Carlos Santos', email: 'carlos@empresa.com', role: 'Designer', moodScore: 6, lastActive: new Date(Date.now() - 86400000), engagementLevel: 'medium' as const },
        { id: '3', name: 'Maria Oliveira', email: 'maria@empresa.com', role: 'Gerente', moodScore: 9, lastActive: new Date(), engagementLevel: 'high' as const }
    ];

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) {
            alert("Por favor, insira um email.");
            return;
        }
        if (!companyId) {
            alert("Erro: ID da empresa não encontrado. Entre em contato com o suporte.");
            console.error("Company ID is missing for user:", user.uid);
            return;
        }
        setInviting(true);
        try {
            await addDoc(collection(db, 'employee_invites'), {
                company_id: companyId,
                email: inviteEmail,
                status: 'pending',
                invited_by: user.uid,
                invited_at: serverTimestamp(),
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowDocs(true)}
                        className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Guia Enterprise
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                    </button>
                </div>
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
                <div className="rounded-xl overflow-hidden -m-1">
                    <EnterpriseEmployees />
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

                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h4 className="text-lg font-semibold text-blue-900 mb-2">Personalize seus Treinamentos</h4>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.open('https://wa.me/5511913608217', '_blank')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Falar com Consultor
                                </button>
                                <button
                                    onClick={() => setShowContentUpload(true)}
                                    className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium flex items-center"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload de Conteúdo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {activeTab === 'productivity' && companyId && <ProductivityDashboard teamId={companyId} />}
            {activeTab === 'feedback' && companyId && <Feedback360 companyId={companyId} />}
            {activeTab === 'meetings' && <OneOnOneScheduler managerId={user.uid} />}

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                    Dica de Gestão
                </h4>
                <p className="text-gray-700 text-sm">
                    Incentive sua equipe a completar o check-in diário de humor. Equipes que monitoram o bem-estar têm 40% menos turnover e 35% mais produtividade.
                </p>
            </div>

            {/* Settings Modal */}
            {
                showSettings && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Configurações</h3>
                                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder={user.displayName || 'Minha Empresa'} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contato</label>
                                    <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder={user.email} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Plano Atual</label>
                                    <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold">
                                        Enterprise Bulk
                                    </div>
                                </div>
                                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Enterprise Docs Modal */}
            <EnterpriseDocsModal isOpen={showDocs} onClose={() => setShowDocs(false)} />
            {/* Real Reports Modal */}
            {
                activeTab === 'reports' && companyId && (
                    <div className="fixed inset-0 z-40">
                        <EnterpriseReports companyId={companyId} onClose={() => setActiveTab('overview')} />
                    </div>
                )
            }

            {/* Content Upload Modal */}
            {
                showContentUpload && companyId && (
                    <ContentUploadForm
                        companyId={companyId}
                        onClose={() => setShowContentUpload(false)}
                    />
                )
            }
        </div >
    );
};

export default EnterpriseDashboard;
