import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    Video,
    Users,
    Settings,
    Loader2,
    DollarSign
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import ScheduleManager from '../scheduling/ScheduleManager';

interface ProfessionalDashboardProps {
    user: any;
    userStats: any;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ user, userStats }) => {
    const [activeTab, setActiveTab] = useState<'appointments' | 'schedule' | 'financial'>('appointments');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [bankInfo, setBankInfo] = useState({
        pixKey: '',
        bankName: '',
        accountNumber: '',
        agency: ''
    });

    useEffect(() => {
        if (!user) return;

        // Fetch Appointments
        const q = query(
            collection(db, 'appointments'),
            where('professionalId', '==', user.uid),
            orderBy('date', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleSaveBankInfo = async () => {
        try {
            // Save to users collection (secure fields)
            alert('Dados bancários salvos com sucesso! (Simulação)');
            // In real app: await updateDoc(doc(db, 'users', user.uid), { bankInfo });
        } catch (error) {
            console.error('Error saving bank info:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Painel do Profissional</h1>
                        <p className="text-gray-600">Gerencie sua carreira e atendimentos</p>
                    </div>
                    <div className="flex space-x-4">
                        <div className="bg-green-50 px-4 py-2 rounded-lg">
                            <p className="text-sm text-green-800">Próxima Consulta</p>
                            <p className="font-bold text-green-900">
                                {appointments.length > 0 ? new Date(appointments[0].date).toLocaleDateString() : 'Nenhuma'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-4 mt-6 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'appointments'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center">
                            <Video className="w-4 h-4 mr-2" />
                            Consultas
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'schedule'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Minha Disponibilidade
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'financial'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Dados Financeiros
                        </div>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="">
                {activeTab === 'appointments' && (
                    <div className="space-y-6">
                        {/* Upcoming Appointments List */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Próximos Atendimentos</h2>
                            {appointments.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">Nenhum agendamento futuro.</p>
                                    <p className="text-sm text-gray-400 mt-2">Certifique-se de configurar sua disponibilidade na aba "Minha Disponibilidade".</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {appointments.map(app => (
                                        <div key={app.id} className="flex items-center justify-between border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 rounded-lg text-blue-800">
                                                    <span className="text-xs font-bold uppercase">{new Date(app.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                                    <span className="text-xl font-bold">{new Date(app.date).getDate()}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{app.clientName || 'Paciente'}</h3>
                                                    <p className="text-sm text-gray-500">{app.type || 'Consulta'} • {app.time}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <span className={`px-3 py-1 text-xs rounded-full font-medium ${app.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {app.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                                </span>

                                                {app.meetLink && (
                                                    <a
                                                        href={app.meetLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                                                        title="Iniciar Vídeo Chamada"
                                                    >
                                                        <Video className="w-5 h-5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <ScheduleManager userId={user.uid} />
                )}

                {activeTab === 'financial' && (
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                            Dados Financeiros e Recebimento
                        </h2>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                            <h3 className="font-bold text-blue-800 mb-2">Regras de Pagamento</h3>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• O usuário paga antecipadamente pela plataforma.</li>
                                <li>• <strong>Moderadores Oficiais:</strong> Recebem <strong>80%</strong> do valor da consulta.</li>
                                <li>• <strong>Profissionais Parceiros:</strong> Recebem <strong>75%</strong> do valor da consulta.</li>
                                <li>• <strong>Pagamentos Ágeis:</strong> Consultas realizadas no mesmo dia podem ter o valor repassado até o final do dia corrente.</li>
                                <li>• Os repasses são feitos via PIX (diário/semanal) ou Stripe.</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chave PIX (Preferencial)
                                </label>
                                <input
                                    type="text"
                                    value={bankInfo.pixKey}
                                    onChange={(e) => setBankInfo({ ...bankInfo, pixKey: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="CPF, E-mail, Celular ou Aleatória"
                                />
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <p className="text-sm text-gray-500 mb-4 italic">Conta Bancária (Opcional se houver PIX)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                                        <input
                                            type="text"
                                            value={bankInfo.bankName}
                                            onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ex: Nubank, Itaú"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                                        <input
                                            type="text"
                                            value={bankInfo.agency}
                                            onChange={(e) => setBankInfo({ ...bankInfo, agency: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Conta Corrente</label>
                                        <input
                                            type="text"
                                            value={bankInfo.accountNumber}
                                            onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveBankInfo}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors mt-4"
                            >
                                Salvar Dados Financeiros
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessionalDashboard;
