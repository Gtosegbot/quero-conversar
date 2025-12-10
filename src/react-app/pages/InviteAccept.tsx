import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';
import { db, auth } from '../../firebase-config';
import {
    collection, query, where, getDocs, addDoc, getDoc,
    updateDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { EmployeeInvite } from '../../types/enterprise';

const InviteAccept: React.FC = () => {
    const navigate = useNavigate();
    const { inviteId } = useParams();

    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [invite, setInvite] = useState<EmployeeInvite | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!inviteId) {
            setError('Link de convite inválido');
            setLoading(false);
            return;
        }

        loadInvite();
    }, [inviteId]);

    const loadInvite = async () => {
        try {
            if (!inviteId) return;

            const inviteRef = doc(db, 'employee_invites', inviteId);
            const inviteSnap = await getDoc(inviteRef);

            if (!inviteSnap.exists()) {
                setError('Convite não encontrado ou já foi excluído');
                setLoading(false);
                return;
            }

            const inviteData = {
                id: inviteSnap.id,
                ...inviteSnap.data()
            } as EmployeeInvite;

            if (inviteData.status !== 'pending') {
                setError('Este convite já foi aceito');
                setLoading(false);
                return;
            }

            // Check if expired
            // Handle both Timestamp and string dates safely
            let expiresAt;
            if (inviteData.expires_at && typeof inviteData.expires_at === 'object' && 'toDate' in inviteData.expires_at) {
                expiresAt = (inviteData.expires_at as any).toDate();
            } else {
                expiresAt = new Date(inviteData.expires_at);
            }

            if (expiresAt < new Date()) {
                setError('Este convite expirou');
                setLoading(false);
                return;
            }

            setInvite(inviteData);

            // Load company name
            if (inviteData.company_id) {
                const companyRef = doc(db, 'companies', inviteData.company_id);
                const companySnap = await getDoc(companyRef);
                if (companySnap.exists()) {
                    setCompanyName(companySnap.data().name);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading invite:', error);
            setError('Erro ao carregar convite');
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        const user = auth.currentUser;
        if (!user) {
            // Redirect to login with return URL
            navigate(`/login?redirect=/invite/${inviteId}`);
            return;
        }

        if (!invite) return;

        setAccepting(true);
        try {
            // Get current user data
            const userRef = doc(db, 'users', user.uid);
            const userSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
            const userData = userSnapshot.docs[0]?.data();
            const previousPlan = userData?.plan || 'free';

            // Update user to Enterprise
            await updateDoc(userRef, {
                company_id: invite.company_id,
                company_role: 'employee',
                plan: 'enterprise',
                previous_plan: previousPlan,
                enterprise_benefits: {
                    unlimited_ai: true,
                    priority_support: true,
                    advanced_reports: true,
                    team_dashboard: true,
                    custom_features: []
                }
            });

            // Create employee record
            await addDoc(collection(db, 'company_employees'), {
                company_id: invite.company_id,
                user_id: user.uid,
                email: user.email,
                name: user.displayName || invite.name || 'Funcionário',
                status: 'active',
                role: 'employee',
                department: invite.department || '',
                position: invite.position || '',
                joined_at: serverTimestamp(),
                invited_at: invite.invited_at,
                invited_by: invite.invited_by,
                previous_plan: previousPlan,
                custom_permissions: {
                    access_dashboard: true,
                    can_invite_others: false,
                    can_schedule_sessions: true
                }
            });

            // Mark invite as accepted
            const inviteRef = doc(db, 'employee_invites', invite.id);
            await updateDoc(inviteRef, {
                status: 'accepted',
                accepted_at: serverTimestamp()
            });

            // Update company employee count
            const companyRef = doc(db, 'companies', invite.company_id);
            const companySnapshot = await getDocs(
                query(collection(db, 'companies'), where('__name__', '==', invite.company_id))
            );
            if (!companySnapshot.empty) {
                const companyData = companySnapshot.docs[0].data();
                await updateDoc(companyRef, {
                    active_employees: (companyData.active_employees || 0) + 1,
                    employee_count: (companyData.employee_count || 0) + 1
                });
            }

            alert('Bem-vindo ao Enterprise! Seu plano foi atualizado com sucesso.');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error accepting invite:', error);
            alert('Erro ao aceitar convite. Tente novamente.');
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <PulsingHeart color="text-blue-600" size="xl" />
                    <p className="mt-4 text-gray-600">Validando convite...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Convite Inválido
                    </h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700"
                    >
                        Voltar para Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Você foi convidado!
                    </h1>
                    <p className="text-gray-600">
                        {companyName} está oferecendo acesso ao Quero Conversar Enterprise
                    </p>
                </div>

                {/* Invite Details */}
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                        Detalhes do Convite
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p>
                            <span className="text-gray-600">Empresa:</span>{' '}
                            <span className="font-medium">{companyName}</span>
                        </p>
                        <p>
                            <span className="text-gray-600">Email:</span>{' '}
                            <span className="font-medium">{invite?.email}</span>
                        </p>
                        {invite?.department && (
                            <p>
                                <span className="text-gray-600">Departamento:</span>{' '}
                                <span className="font-medium">{invite.department}</span>
                            </p>
                        )}
                        {invite?.position && (
                            <p>
                                <span className="text-gray-600">Cargo:</span>{' '}
                                <span className="font-medium">{invite.position}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Benefits */}
                <div className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        Benefícios Enterprise que você terá:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            'Interações ilimitadas com IA',
                            'Modelos de IA avançados (GPT-4)',
                            'Consultas com profissionais',
                            'Dashboard de bem-estar',
                            'Relatórios personalizados',
                            'Suporte prioritário 24/7',
                            'Programas de desenvolvimento',
                            'Feedback 360° e sessões 1-on-1'
                        ].map((benefit, i) => (
                            <div key={i} className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 text-sm">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Plan Upgrade Info */}
                {auth.currentUser && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-green-800">
                            ✅ Seu plano será automaticamente atualizado para{' '}
                            <strong>Enterprise</strong> ao aceitar este convite!
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3">
                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 font-semibold text-lg flex items-center justify-center"
                    >
                        {accepting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Aceitando...
                            </>
                        ) : (
                            <>
                                Aceitar Convite e Fazer Upgrade
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>

                    {!auth.currentUser && (
                        <p className="text-sm text-gray-600 text-center">
                            Você será redirecionado para fazer login ou criar uma conta
                        </p>
                    )}
                </div>

                {/* Expiration */}
                {invite && (
                    <p className="text-xs text-gray-500 text-center mt-4">
                        Este convite expira em{' '}
                        {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default InviteAccept;
