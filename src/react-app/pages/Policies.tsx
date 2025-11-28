import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Shield, FileText, Users, Briefcase, Home } from 'lucide-react';

interface Policy {
  id: string;
  title: string;
  content: string;
  policy_type: string;
  version: string;
  created_at: string;
}

const Policies: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const policyTypes = [
    { type: 'community_guidelines', title: 'Diretrizes da Comunidade', icon: Users, color: 'text-blue-600' },
    { type: 'terms_of_service', title: 'Termos de Serviço', icon: FileText, color: 'text-green-600' },
    { type: 'privacy_policy', title: 'Política de Privacidade', icon: Shield, color: 'text-purple-600' },
    { type: 'professional_code', title: 'Código Profissional', icon: Briefcase, color: 'text-orange-600' }
  ];

  useEffect(() => {
    if (type) {
      loadPolicy(type);
    } else {
      setIsLoading(false);
    }
  }, [type]);

  const loadPolicy = async (policyType: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/policies/${policyType}`);
      if (response.ok) {
        const data = await response.json();
        setPolicy(data.policy);
      }
    } catch (error) {
      console.error('Failed to load policy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando política...</p>
        </div>
      </div>
    );
  }

  // Policy overview page
  if (!type) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-purple-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Políticas e Termos</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Dashboard
                </Link>
              </div>
            </div>
            <p className="text-lg text-gray-600">
              Conheça nossas políticas, diretrizes e termos de uso da plataforma
            </p>
          </div>

          {/* Policy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policyTypes.map((policyType) => {
              const Icon = policyType.icon;
              return (
                <Link
                  key={policyType.type}
                  to={`/policies/${policyType.type}`}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center mb-4">
                    <Icon className={`w-8 h-8 ${policyType.color} mr-3`} />
                    <h3 className="text-xl font-bold text-gray-900">{policyType.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {policyType.type === 'community_guidelines' && 'Regras e diretrizes para manter nossa comunidade segura e acolhedora'}
                    {policyType.type === 'terms_of_service' && 'Termos e condições de uso da plataforma Quero Conversar'}
                    {policyType.type === 'privacy_policy' && 'Como coletamos, usamos e protegemos seus dados pessoais'}
                    {policyType.type === 'professional_code' && 'Código de conduta ética para profissionais da plataforma'}
                  </p>
                  <div className="flex items-center text-sm text-purple-600 font-semibold">
                    Ler política
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informações Importantes</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Última atualização:</strong> Outubro de 2024
              </p>
              <p>
                <strong>Dúvidas:</strong> Se você tiver alguma dúvida sobre nossas políticas, entre em contato através do chat ou comunidade.
              </p>
              <p>
                <strong>Modificações:</strong> Nos reservamos o direito de modificar estas políticas a qualquer momento. 
                Sempre notificaremos os usuários sobre mudanças importantes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Individual policy page
  const currentPolicyType = policyTypes.find(p => p.type === type);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link
                to="/policies"
                className="mr-4 p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              {currentPolicyType && (
                <currentPolicyType.icon className={`w-8 h-8 ${currentPolicyType.color} mr-3`} />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {policy?.title || currentPolicyType?.title || 'Política'}
                </h1>
                {policy?.version && (
                  <p className="text-sm text-gray-500">Versão {policy.version}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {policy ? (
            <div className="prose prose-lg max-w-none">
              {policy.content.split('\n').map((paragraph, index) => {
                if (paragraph.startsWith('##')) {
                  return <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{paragraph.replace('##', '').trim()}</h2>;
                } else if (paragraph.startsWith('#')) {
                  return <h1 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-6">{paragraph.replace('#', '').trim()}</h1>;
                } else if (paragraph.startsWith('###')) {
                  return <h3 key={index} className="text-xl font-semibold text-gray-800 mt-6 mb-3">{paragraph.replace('###', '').trim()}</h3>;
                } else if (paragraph.startsWith('-') || paragraph.startsWith('•')) {
                  return <li key={index} className="ml-4 text-gray-700">{paragraph.replace(/^[-•]\s*/, '')}</li>;
                } else if (paragraph.trim()) {
                  return <p key={index} className="text-gray-700 mb-4 leading-relaxed">{paragraph}</p>;
                }
                return null;
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Política não encontrada
              </h3>
              <p className="text-gray-500 mb-6">
                A política solicitada não foi encontrada ou ainda não está disponível.
              </p>
              <Link
                to="/policies"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Ver todas as políticas
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        {policy && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Última atualização: {new Date(policy.created_at).toLocaleDateString('pt-BR')}</span>
              <Link
                to="/policies"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                ← Voltar para todas as políticas
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Policies;
