import React from 'react';
import { Check, Star, Zap, Building } from 'lucide-react';

const SubscriptionManager: React.FC = () => {
    const plans = [
        {
            name: 'Gratuito',
            price: 'R$ 0,00',
            period: '/mês',
            features: [
                '15 interações diárias com Dra. Clara',
                'Acesso à comunidade',
                'Conteúdos básicos',
                'Modelo Standard (Rápido)'
            ],
            cta: 'Plano Atual',
            current: true,
            color: 'gray'
        },
        {
            name: 'Premium',
            price: 'R$ 29,90',
            period: '/mês',
            features: [
                'Interações ILIMITADAS',
                'Modelo Deep Thinking (Mais inteligente)',
                'Memória de longo prazo',
                'Acesso prioritário a novos recursos',
                'Sem anúncios'
            ],
            cta: 'Fazer Upgrade',
            current: false,
            color: 'purple',
            popular: true
        },
        {
            name: 'Enterprise',
            price: 'R$ 19,90',
            period: '/usuário',
            features: [
                'Tudo do Premium',
                'Dashboard de Gestão de Equipe',
                'Relatórios de Bem-estar (Anônimos)',
                'Suporte Dedicado',
                'Faturamento Corporativo'
            ],
            cta: 'Falar com Vendas',
            current: false,
            color: 'blue'
        }
    ];

    return (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Invista no seu bem-estar
                </h2>
                <p className="mt-4 text-xl text-gray-600">
                    Escolha o plano ideal para sua jornada de autoconhecimento.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative rounded-2xl shadow-xl bg-white p-8 flex flex-col border-2 ${plan.popular ? 'border-purple-500 transform scale-105 z-10' : 'border-transparent'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-0 -mt-4 mr-4 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                                Mais Popular
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className={`text-2xl font-bold text-${plan.color}-600`}>{plan.name}</h3>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                                <span className="ml-1 text-xl text-gray-500">{plan.period}</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-start">
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-${plan.color}-100 flex items-center justify-center mt-1`}>
                                        <Check className={`w-4 h-4 text-${plan.color}-600`} />
                                    </div>
                                    <p className="ml-3 text-gray-600">{feature}</p>
                                </li>
                            ))}
                        </ul>

                        <button
                            className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-colors ${plan.current
                                    ? 'bg-gray-400 cursor-default'
                                    : plan.color === 'purple'
                                        ? 'bg-purple-600 hover:bg-purple-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            disabled={plan.current}
                        >
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </div>

            {/* Enterprise Bulk Option */}
            <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
                <div className="px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                            <span className="block">Tem uma equipe grande?</span>
                        </h2>
                        <p className="mt-4 text-lg text-blue-100 max-w-2xl">
                            Para empresas com mais de 50 colaboradores, oferecemos planos com valor fixo mensal (Bulk), garantindo previsibilidade de custos e acesso ilimitado para todos.
                        </p>
                        <div className="mt-6 flex items-center space-x-4">
                            <div className="flex items-center text-white">
                                <Building className="w-5 h-5 mr-2" />
                                <span>A partir de R$ 2.500/mês</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                        <div className="inline-flex rounded-md shadow">
                            <button className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
                                Falar com Consultor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManager;
