import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Mail, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';
import { db, auth } from '../../firebase-config';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { PRICING_TIERS, calculateCompanyPrice } from '../../types/enterprise';

interface CompanyData {
    name: string;
    cnpj: string;
    email_domain: string;
    allow_self_registration: boolean;
    estimated_employees: number;
}

const EnterpriseSetup: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [companyData, setCompanyData] = useState<CompanyData>({
        name: '',
        cnpj: '',
        email_domain: '',
        allow_self_registration: false,
        estimated_employees: 50
    });

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const formatCNPJ = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 14) {
            return numbers
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
        return value;
    };

    const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCNPJ(e.target.value);
        setCompanyData({ ...companyData, cnpj: formatted });
    };

    const handleSubmit = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert('Você precisa estar logado para criar uma empresa.');
            return;
        }

        setLoading(true);
        try {
            const pricing = calculateCompanyPrice(companyData.estimated_employees);

            // Create company
            const companyRef = await addDoc(collection(db, 'companies'), {
                name: companyData.name,
                cnpj: companyData.cnpj,
                plan: 'enterprise',
                admin_uid: user.uid,
                admin_email: user.email,
                employee_count: 0,
                active_employees: 0,
                max_employees: pricing.tier.max_employees,
                created_at: serverTimestamp(),
                settings: {
                    allow_self_registration: companyData.allow_self_registration,
                    email_domain: companyData.email_domain || null,
                    custom_benefits: []
                },
                billing: {
                    status: 'trial',
                    tier: pricing.tier.id,
                    price_per_employee: pricing.tier.price_per_employee,
                    next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
                    total_amount: 0
                }
            });

            // Update user to link to company
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                company_id: companyRef.id,
                company_role: 'admin',
                plan: 'enterprise'
            });

            // Create admin as first employee
            await addDoc(collection(db, 'company_employees'), {
                company_id: companyRef.id,
                user_id: user.uid,
                email: user.email,
                name: user.displayName || 'Admin',
                status: 'active',
                role: 'admin',
                department: 'Administração',
                position: 'Administrador',
                joined_at: serverTimestamp(),
                invited_at: serverTimestamp(),
                invited_by: user.uid,
                previous_plan: 'free',
                custom_permissions: {
                    access_dashboard: true,
                    can_invite_others: true,
                    can_schedule_sessions: true
                }
            });

            alert('Empresa criada com sucesso! Você tem 30 dias de trial gratuito.');
            navigate('/enterprise/employees');
        } catch (error) {
            console.error('Error creating company:', error);
            alert('Erro ao criar empresa. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const pricing = calculateCompanyPrice(companyData.estimated_employees);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <PulsingHeart color="text-blue-600" size="xl" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Configurar Empresa Enterprise
                    </h1>
                    <p className="text-gray-600">
                        Configure sua empresa em poucos passos
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center space-x-4">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${s === step
                                            ? 'bg-blue-600 text-white'
                                            : s < step
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {s < step ? <CheckCircle className="w-6 h-6" /> : s}
                                </div>
                                {s < 4 && (
                                    <div
                                        className={`w-16 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-2 text-sm text-gray-600">
                        <span>
                            {step === 1 && 'Dados da Empresa'}
                            {step === 2 && 'Configurações'}
                            {step === 3 && 'Plano e Preços'}
                            {step === 4 && 'Confirmação'}
                        </span>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Step 1: Company Data */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center mb-6">
                                <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Dados da Empresa
                                </h2>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome da Empresa *
                                </label>
                                <input
                                    type="text"
                                    value={companyData.name}
                                    onChange={(e) =>
                                        setCompanyData({ ...companyData, name: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="Empresa XYZ Ltda"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CNPJ *
                                </label>
                                <input
                                    type="text"
                                    value={companyData.cnpj}
                                    onChange={handleCNPJChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="00.000.000/0000-00"
                                    maxLength={18}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número Estimado de Funcionários *
                                </label>
                                <input
                                    type="number"
                                    value={companyData.estimated_employees}
                                    onChange={(e) =>
                                        setCompanyData({
                                            ...companyData,
                                            estimated_employees: parseInt(e.target.value) || 0
                                        })
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    min="1"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Isso nos ajuda a calcular o melhor plano para você
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Settings */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center mb-6">
                                <Mail className="w-8 h-8 text-blue-600 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Configurações
                                </h2>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Domínio de Email Corporativo (Opcional)
                                </label>
                                <div className="flex items-center">
                                    <span className="text-gray-500 mr-2">@</span>
                                    <input
                                        type="text"
                                        value={companyData.email_domain}
                                        onChange={(e) =>
                                            setCompanyData({
                                                ...companyData,
                                                email_domain: e.target.value
                                            })
                                        }
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder="empresa.com.br"
                                    />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Se preenchido, apenas emails com este domínio poderão ser
                                    convidados
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4">
                                <label className="flex items-start cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={companyData.allow_self_registration}
                                        onChange={(e) =>
                                            setCompanyData({
                                                ...companyData,
                                                allow_self_registration: e.target.checked
                                            })
                                        }
                                        className="mt-1 w-5 h-5 text-blue-600 rounded"
                                    />
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-900">
                                            Permitir Auto-cadastro
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Funcionários com email do domínio corporativo podem se
                                            cadastrar e solicitar vinculação à empresa
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Pricing */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center mb-6">
                                <Users className="w-8 h-8 text-blue-600 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Plano e Preços
                                </h2>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    Seu Plano Recomendado
                                </h3>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-3xl font-bold text-blue-600">
                                            {pricing.tier.name}
                                        </p>
                                        <p className="text-gray-600 mt-1">
                                            {companyData.estimated_employees} funcionários estimados
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Preço por funcionário</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            R$ {pricing.tier.price_per_employee.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t border-blue-200 pt-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-lg font-semibold text-gray-900">
                                            Total Estimado/Mês:
                                        </p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            R$ {pricing.total.toFixed(2)}
                                        </p>
                                    </div>
                                    {pricing.tier.discount_percentage > 0 && (
                                        <p className="text-sm text-green-600 mt-2">
                                            ✅ Você economiza {pricing.tier.discount_percentage}% com
                                            este plano!
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* All Tiers */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900">
                                    Todos os Planos Disponíveis:
                                </h4>
                                {PRICING_TIERS.map((tier) => (
                                    <div
                                        key={tier.id}
                                        className={`p-4 rounded-lg border-2 ${tier.id === pricing.tier.id
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {tier.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {tier.min_employees} -{' '}
                                                    {tier.max_employees || '∞'} funcionários
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-gray-900">
                                                    R$ {tier.price_per_employee.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    por funcionário
                                                </p>
                                                {tier.discount_percentage > 0 && (
                                                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        -{tier.discount_percentage}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Trial Gratuito:</strong> Você terá 30 dias de trial
                                    gratuito para testar todos os recursos antes de ser cobrado.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center mb-6">
                                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Confirme os Dados
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Dados da Empresa
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="text-gray-600">Nome:</span>{' '}
                                            <span className="font-medium">{companyData.name}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-600">CNPJ:</span>{' '}
                                            <span className="font-medium">{companyData.cnpj}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-600">Funcionários:</span>{' '}
                                            <span className="font-medium">
                                                {companyData.estimated_employees}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Configurações
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="text-gray-600">Domínio de Email:</span>{' '}
                                            <span className="font-medium">
                                                {companyData.email_domain
                                                    ? `@${companyData.email_domain}`
                                                    : 'Não configurado'}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="text-gray-600">Auto-cadastro:</span>{' '}
                                            <span className="font-medium">
                                                {companyData.allow_self_registration
                                                    ? 'Permitido'
                                                    : 'Não permitido'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Plano Selecionado
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="text-gray-600">Tier:</span>{' '}
                                            <span className="font-medium">{pricing.tier.name}</span>
                                        </p>
                                        <p>
                                            <span className="text-gray-600">
                                                Preço por funcionário:
                                            </span>{' '}
                                            <span className="font-medium">
                                                R$ {pricing.tier.price_per_employee.toFixed(2)}
                                            </span>
                                        </p>
                                        <p className="text-lg font-bold text-blue-600 pt-2 border-t border-blue-200">
                                            Total Estimado: R$ {pricing.total.toFixed(2)}/mês
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-800">
                                    ✅ Ao confirmar, sua empresa será criada com 30 dias de trial
                                    gratuito. Você poderá começar a convidar funcionários
                                    imediatamente!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Voltar
                        </button>

                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                disabled={
                                    (step === 1 &&
                                        (!companyData.name ||
                                            !companyData.cnpj ||
                                            companyData.estimated_employees < 1)) ||
                                    loading
                                }
                                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próximo
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {loading ? 'Criando...' : 'Confirmar e Criar Empresa'}
                                <CheckCircle className="w-5 h-5 ml-2" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnterpriseSetup;
