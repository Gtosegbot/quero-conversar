import React, { useState } from 'react';
import { Check, Zap, Star, ArrowRight } from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  aiModels: string[];
  monthlyLimit: number | null;
  popular?: boolean;
  color: string;
}

const Plans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Grátis',
      description: 'Perfeito para começar sua jornada',
      monthlyPrice: 0,
      yearlyPrice: 0,
      monthlyLimit: 15,
      color: 'green',
      features: [
        '15 interações diárias com IA',
        'Acesso à Dra. Clara (Groq)',
        'Anamnese psicológica completa',
        'Comunidade de apoio',
        'Tarefas diárias motivacionais',
        'Relatórios básicos de progresso'
      ],
      aiModels: ['Groq (Llama 3.1 8B)']
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Para quem quer crescer sem limites',
      monthlyPrice: 29.90,
      yearlyPrice: 299.90,
      monthlyLimit: null,
      popular: true,
      color: 'purple',
      features: [
        'Interações ilimitadas',
        'IA Premium (GPT-4, Gemini, Claude)',
        'Consultas com profissionais',
        'Acesso prioritário a novos recursos',
        'Relatórios avançados de progresso',
        'Suporte prioritário 24/7',
        'Sessões de vídeo HD',
        'Biblioteca de recursos premium',
        'Planos personalizados de crescimento'
      ],
      aiModels: [
        'OpenAI (GPT-4o, GPT-4.1)',
        'Google Gemini Pro',
        'Anthropic Claude',
        'Groq (Modelos avançados)'
      ]
    }
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      // Redirect to dashboard for free plan
      window.location.href = '/dashboard';
      return;
    }

    // For premium plan, redirect to payment
    const price = billingCycle === 'monthly' ? plans[1].monthlyPrice : plans[1].yearlyPrice;
    const planName = plans[1].name;
    
    // Store payment data in sessionStorage and redirect
    sessionStorage.setItem('pendingPayment', JSON.stringify({
      type: 'subscription',
      planId,
      planName,
      amount: price,
      billingCycle,
      description: `Assinatura ${planName} - ${billingCycle === 'monthly' ? 'Mensal' : 'Anual'}`
    }));
    
    // Redirect to payment page
    window.location.href = '/payment';
  };

  const yearlyDiscount = Math.round((1 - (plans[1].yearlyPrice / 12) / plans[1].monthlyPrice) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <PulsingHeart color="text-purple-600" size="xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu Plano de Crescimento
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Investir em si mesmo é o melhor investimento que você pode fazer
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 relative ${
                billingCycle === 'yearly'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Anual
              {yearlyDiscount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  -{yearlyDiscount}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'ring-4 ring-purple-300' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-semibold">
                  <Star className="w-4 h-4 inline mr-1" />
                  MAIS POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <PulsingHeart 
                      color={plan.color === 'green' ? 'text-green-500' : 'text-purple-600'} 
                      size="lg" 
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    {plan.monthlyPrice === 0 ? (
                      <span className="text-4xl font-bold text-green-600">Grátis</span>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-gray-900">
                          R$ {(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice / 12).toFixed(2)}
                        </span>
                        <span className="text-gray-600 ml-1">
                          /{billingCycle === 'monthly' ? 'mês' : 'mês'}
                        </span>
                        {billingCycle === 'yearly' && (
                          <div className="text-sm text-green-600 font-semibold">
                            Economize {yearlyDiscount}% no plano anual!
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {plan.monthlyLimit && (
                    <div className="inline-flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                      <Zap className="w-4 h-4 mr-1" />
                      {plan.monthlyLimit} interações/dia
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Recursos inclusos:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className={`w-5 h-5 mr-3 mt-0.5 ${
                          plan.color === 'green' ? 'text-green-500' : 'text-purple-600'
                        }`} />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Models */}
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Modelos de IA:</h4>
                  <ul className="space-y-2">
                    {plan.aiModels.map((model, index) => (
                      <li key={index} className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          plan.color === 'green' ? 'bg-green-500' : 'bg-purple-600'
                        }`}></div>
                        <span className="text-gray-700 text-sm">{model}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center ${
                    plan.color === 'green'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  }`}
                >
                  {plan.monthlyPrice === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Compare os Recursos
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Recursos</th>
                  <th className="text-center py-4 px-6 font-semibold text-green-600">Grátis</th>
                  <th className="text-center py-4 px-6 font-semibold text-purple-600">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-6 text-gray-700">Interações com IA</td>
                  <td className="py-4 px-6 text-center">15/dia</td>
                  <td className="py-4 px-6 text-center">Ilimitadas</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Modelos de IA Avançados</td>
                  <td className="py-4 px-6 text-center">❌</td>
                  <td className="py-4 px-6 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Consultas com Profissionais</td>
                  <td className="py-4 px-6 text-center">❌</td>
                  <td className="py-4 px-6 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Relatórios Avançados</td>
                  <td className="py-4 px-6 text-center">❌</td>
                  <td className="py-4 px-6 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">Suporte Prioritário</td>
                  <td className="py-4 px-6 text-center">❌</td>
                  <td className="py-4 px-6 text-center">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Dúvidas Frequentes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600 text-sm">
                Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas ou complicações.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Como funciona o período de teste?
              </h3>
              <p className="text-gray-600 text-sm">
                Comece gratuitamente e teste todos os recursos básicos. Upgrade quando sentir necessidade.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Meus dados estão seguros?
              </h3>
              <p className="text-gray-600 text-sm">
                Absolutamente! Utilizamos as mais altas tecnologias de segurança e criptografia.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Preciso de conhecimento técnico?
              </h3>
              <p className="text-gray-600 text-sm">
                Nenhum! Nossa plataforma foi desenvolvida para ser intuitiva e fácil de usar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
