import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Download, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import { calculateSplit, formatCurrency, UserRole } from '../../../services/FinancialService';

interface FinancialDashboardProps {
    user: any;
    role: UserRole;
    isModerator: boolean;
}

interface Transaction {
    id: string;
    amount: number;
    date: any;
    description: string;
    status: 'pending' | 'completed';
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ user, role, isModerator }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [pendingBalance, setPendingBalance] = useState(0);

    useEffect(() => {
        if (!user) return;

        const loadFinancials = async () => {
            try {
                // Query payments where the user is the recipient (Professional or Partner)
                // We assume the user ID matches professionalId or partnerId in the payment record
                const paymentsRef = collection(db, 'payments');

                // Construct query based on role
                let q;
                if (role === 'professional') {
                    q = query(paymentsRef, where('professionalId', '==', user.uid), orderBy('createdAt', 'desc'));
                } else if (role === 'partner') {
                    q = query(paymentsRef, where('partnerId', '==', user.uid), orderBy('createdAt', 'desc'));
                } else if (isModerator) {
                    // Moderators might see everything or specific commission? 
                    // For now, let's assuming they act as professional/partner or we query by modId if it exists?
                    // Falling back to a safe query or empty if not professional/partner
                    q = query(paymentsRef, where('professionalName', '==', user.name || ''), orderBy('createdAt', 'desc')); // Fallback
                } else {
                    // Default: filter by receiver ID (generic)
                    q = query(paymentsRef, where('recipientId', '==', user.uid), orderBy('createdAt', 'desc'));
                }

                // If no specific role logic matches, we might want to try querying by professionalId anyway just in case
                if (!q) {
                    q = query(paymentsRef, where('professionalId', '==', user.uid), orderBy('createdAt', 'desc'));
                }

                // For admin/dev purposes (if user wants to see ALL for testing):
                // q = query(paymentsRef, orderBy('createdAt', 'desc')); // UNCOMMENT TO SEE ALL TRANSACTIONS DURING TEST

                const snapshot = await getDocs(q);

                const loadedTransactions: Transaction[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        amount: data.amount,
                        date: data.createdAt?.toDate() || new Date(),
                        description: data.description || 'Transação',
                        status: data.status
                    };
                });

                setTransactions(loadedTransactions);

                // Calculate Totals based on Split Logic
                let total = 0;
                let pending = 0;

                loadedTransactions.forEach(t => {
                    const split = calculateSplit(t.amount, role, isModerator);
                    if (t.status === 'completed') {
                        total += split.userAmount;
                    } else {
                        pending += split.userAmount;
                    }
                });

                setTotalEarnings(total);
                setPendingBalance(pending);
                setIsLoading(false);
            } catch (error) {
                console.error("Error loading financials:", error);
                // Fallback to empty to avoid crashing if query fails (e.g. missing index)
                setTransactions([]);
                setIsLoading(false);
            }
        };

        loadFinancials();
    }, [user, role, isModerator]);

    const splitInfo = calculateSplit(100, role, isModerator); // Sample to get percentage

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                            <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                            Painel Financeiro
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Sua comissão atual: <span className="font-bold text-green-600">{splitInfo.userPercentage}%</span>
                            {isModerator && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Bônus Moderador Ativo</span>}
                        </p>
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm font-medium transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Relatório
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-green-700 font-medium">Saldo Disponível</span>
                            <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
                        <p className="text-xs text-green-600 mt-1">Próximo pagamento: 05/12</p>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-yellow-700 font-medium">A Receber</span>
                            <TrendingUp className="w-5 h-5 text-yellow-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingBalance)}</p>
                        <p className="text-xs text-yellow-600 mt-1">Processando pagamentos</p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-700 font-medium">Taxa da Plataforma</span>
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{splitInfo.platformPercentage}%</p>
                        <p className="text-xs text-blue-600 mt-1">Manutenção e Marketing</p>
                    </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-4">Histórico Recente</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sua Parte</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map((t) => {
                                const split = calculateSplit(t.amount, role, isModerator);
                                return (
                                    <tr key={t.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {t.date.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {t.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                                            {formatCurrency(split.userAmount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {t.status === 'completed' ? 'Pago' : 'Pendente'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboard;
