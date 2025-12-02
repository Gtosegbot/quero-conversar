import React, { useState, useEffect } from 'react';
import { Users, BarChart2, UserPlus, Settings, Mail } from 'lucide-react';
import { db } from '../../../firebase-config';
import { collection, query, where, getCountFromServer, addDoc, serverTimestamp } from 'firebase/firestore';

interface EnterpriseDashboardProps {
    user: any;
    userStats: any;
}

const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ user, userStats }) => {
    const [stats, setStats] = useState({
        collaborators: 124, // Starting with the static value as base
        newThisMonth: 12,
        engagement: 78
    });
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        // In a real app, we would fetch the count of users belonging to this company
        // const q = query(collection(db, 'users'), where('companyId', '==', user.uid));
        // const snapshot = await getCountFromServer(q);
        // setStats(prev => ({ ...prev, collaborators: snapshot.data().count }));
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

    return (
        <div className="space-y-8">
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
                        <BarChart2 className="text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.engagement}%</p>
                    <p className="text-sm text-gray-500">Média de uso semanal</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-gray-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700">Plano</h3>
                        <Settings className="text-gray-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">Enterprise Bulk</p>
                    <p className="text-sm text-gray-500">Renova em 15/12</p>
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

            <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-2">Dica de Gestão</h4>
                <p className="text-blue-800 text-sm">
                    Incentive sua equipe a completar o check-in diário de humor. Equipes que monitoram o bem-estar têm 40% menos turnover.
                </p>
            </div>
        </div>
    );
};

export default EnterpriseDashboard;
