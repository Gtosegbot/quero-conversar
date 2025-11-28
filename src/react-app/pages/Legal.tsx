import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Lock, Users, ArrowLeft, Home } from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';

type LegalSection = 'terms' | 'privacy' | 'lgpd' | 'confidentiality';

const Legal: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<LegalSection>('terms');

  const sections = [
    { id: 'terms' as LegalSection, title: 'Termos de Serviço', icon: FileText },
    { id: 'privacy' as LegalSection, title: 'Política de Privacidade', icon: Lock },
    { id: 'lgpd' as LegalSection, title: 'LGPD', icon: Shield },
    { id: 'confidentiality' as LegalSection, title: 'Confidencialidade', icon: Users }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'terms':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Termos de Serviço</h2>

            <div className="space-y-4">
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Aceite dos Termos</h3>
                <p className="text-gray-600">
                  Ao acessar e utilizar a plataforma "Quero Conversar", você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Descrição do Serviço</h3>
                <p className="text-gray-600">
                  O "Quero Conversar" é uma plataforma de bem-estar que oferece:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Assistente virtual de apoio emocional (Dra. Clara)</li>
                  <li>Comunidade de apoio mútuo</li>
                  <li>Acesso a profissionais qualificados</li>
                  <li>Recursos de desenvolvimento pessoal</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Responsabilidades do Usuário</h3>
                <p className="text-gray-600">
                  Ao utilizar nossa plataforma, você se compromete a:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Fornecer informações verdadeiras e precisas</li>
                  <li>Manter a confidencialidade de suas credenciais de acesso</li>
                  <li>Respeitar outros usuários e profissionais</li>
                  <li>Não usar a plataforma para fins ilegais ou prejudiciais</li>
                  <li>Entender que a IA não substitui atendimento médico profissional</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Pagamentos e Reembolsos</h3>
                <p className="text-gray-600">
                  Os pagamentos são processados de forma segura através de provedores terceirizados.
                  Reembolsos podem ser solicitados dentro de 7 dias após a contratação do serviço,
                  desde que não tenha havido uso significativo dos recursos premium.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Limitação de Responsabilidade</h3>
                <p className="text-gray-600">
                  Nossa plataforma oferece suporte emocional e recursos de bem-estar, mas não constitui
                  aconselhamento médico, psicológico ou terapêutico profissional. Em caso de emergência
                  ou crise, procure ajuda médica imediata.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Modificações dos Termos</h3>
                <p className="text-gray-600">
                  Reservamo-nos o direito de modificar estes termos a qualquer momento.
                  Notificaremos os usuários sobre mudanças significativas através da plataforma ou email.
                </p>
              </section>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Política de Privacidade</h2>

            <div className="space-y-4">
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Informações Coletadas</h3>
                <p className="text-gray-600">
                  Coletamos as seguintes informações:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Dados de cadastro (nome, email, idade)</li>
                  <li>Respostas da anamnese psicológica</li>
                  <li>Histórico de conversas com a IA</li>
                  <li>Dados de uso da plataforma</li>
                  <li>Informações de pagamento (processadas por terceiros)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Uso das Informações</h3>
                <p className="text-gray-600">
                  Utilizamos suas informações para:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Personalizar sua experiência na plataforma</li>
                  <li>Melhorar nossos serviços e IA</li>
                  <li>Facilitar conexões com profissionais adequados</li>
                  <li>Enviar atualizações importantes sobre o serviço</li>
                  <li>Cumprir obrigações legais</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Compartilhamento de Dados</h3>
                <p className="text-gray-600">
                  Não vendemos seus dados pessoais. Compartilhamos informações apenas:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Com profissionais autorizados (mediante seu consentimento)</li>
                  <li>Com provedores de serviços essenciais (processamento de pagamento)</li>
                  <li>Quando exigido por lei</li>
                  <li>Para proteger a segurança dos usuários</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Segurança dos Dados</h3>
                <p className="text-gray-600">
                  Implementamos medidas de segurança robustas incluindo criptografia,
                  controle de acesso restrito, monitoramento contínuo e backup seguro
                  para proteger suas informações pessoais.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Retenção de Dados</h3>
                <p className="text-gray-600">
                  Mantemos seus dados pelo tempo necessário para fornecer nossos serviços
                  ou conforme exigido por lei. Você pode solicitar a exclusão de seus dados
                  a qualquer momento através do email contato@queroconversar.shop.
                </p>
              </section>
            </div>
          </div>
        );

      case 'lgpd':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Lei Geral de Proteção de Dados (LGPD)</h2>

            <div className="space-y-4">
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Seus Direitos Sob a LGPD</h3>
                <p className="text-gray-600">
                  De acordo com a LGPD, você tem os seguintes direitos:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Confirmação da existência de tratamento de dados</li>
                  <li>Acesso aos dados pessoais</li>
                  <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                  <li>Anonimização, bloqueio ou eliminação de dados</li>
                  <li>Portabilidade dos dados para outro fornecedor</li>
                  <li>Eliminação dos dados tratados com consentimento</li>
                  <li>Revogação do consentimento</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Base Legal para Tratamento</h3>
                <p className="text-gray-600">
                  Tratamos seus dados pessoais com base nas seguintes hipóteses legais:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Consentimento específico para finalidades determinadas</li>
                  <li>Execução de contrato ou procedimentos preliminares</li>
                  <li>Legítimo interesse para melhorar nossos serviços</li>
                  <li>Proteção da vida ou da incolumidade física</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Encarregado de Dados</h3>
                <p className="text-gray-600">
                  Nosso Encarregado de Proteção de Dados (DPO) é responsável por:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Aceitar reclamações e comunicações dos titulares</li>
                  <li>Prestar esclarecimentos sobre tratamento de dados</li>
                  <li>Receber comunicações da ANPD</li>
                  <li>Orientar funcionários sobre práticas de proteção de dados</li>
                </ul>
                <p className="text-gray-600 mt-2">
                  <strong>Contato do DPO:</strong> dpo@queroconversar.shop
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Exercício dos Direitos</h3>
                <p className="text-gray-600">
                  Para exercer seus direitos sob a LGPD, entre em contato conosco através:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Email: contato@queroconversar.shop</li>
                  <li>Formulário na plataforma (seção "Meus Dados")</li>
                  <li>Atendimento dentro da plataforma</li>
                </ul>
                <p className="text-gray-600 mt-2">
                  Responderemos às solicitações em até 15 dias úteis.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Incidentes de Segurança</h3>
                <p className="text-gray-600">
                  Em caso de incidente de segurança que possa acarretar risco ou dano relevante,
                  notificaremos a ANPD e os titulares afetados conforme previsto na LGPD.
                </p>
              </section>
            </div>
          </div>
        );

      case 'confidentiality':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Política de Confidencialidade</h2>

            <div className="space-y-4">
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Compromisso com a Confidencialidade</h3>
                <p className="text-gray-600">
                  A confidencialidade é fundamental para nossa plataforma. Garantimos que:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Todas as conversas são estritamente confidenciais</li>
                  <li>Profissionais seguem código de ética rigoroso</li>
                  <li>Dados sensíveis são criptografados</li>
                  <li>Acesso restrito apenas a pessoal autorizado</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Ambiente Seguro</h3>
                <p className="text-gray-600">
                  Nossa plataforma é um espaço seguro onde você pode:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Compartilhar sentimentos sem julgamento</li>
                  <li>Buscar apoio em momentos difíceis</li>
                  <li>Crescer pessoalmente com privacidade</li>
                  <li>Conectar-se com profissionais qualificados</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Profissionais e Ética</h3>
                <p className="text-gray-600">
                  Todos os profissionais em nossa plataforma:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>São verificados e credenciados</li>
                  <li>Seguem código de ética profissional</li>
                  <li>Mantêm sigilo absoluto das informações</li>
                  <li>Passam por treinamento em confidencialidade</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Limitações da Confidencialidade</h3>
                <p className="text-gray-600">
                  A confidencialidade pode ser quebrada apenas em situações específicas:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Risco iminente de autolesão ou suicídio</li>
                  <li>Ameaça a terceiros</li>
                  <li>Abuso de menores</li>
                  <li>Ordem judicial</li>
                </ul>
                <p className="text-gray-600 mt-2">
                  Nesses casos, agiremos para proteger a segurança de todos os envolvidos.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Tecnologia e Segurança</h3>
                <p className="text-gray-600">
                  Utilizamos tecnologia de ponta para garantir confidencialidade:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Criptografia end-to-end nas comunicações</li>
                  <li>Servidores seguros com certificação</li>
                  <li>Monitoramento 24/7 contra ameaças</li>
                  <li>Backup seguro e redundante</li>
                  <li>Auditorias regulares de segurança</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Relatórios e Violações</h3>
                <p className="text-gray-600">
                  Se você suspeitar de violação de confidencialidade:
                </p>
                <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                  <li>Reporte imediatamente através de contato@queroconversar.shop</li>
                  <li>Investigaremos todas as alegações</li>
                  <li>Tomaremos medidas corretivas necessárias</li>
                  <li>Notificaremos autoridades quando apropriado</li>
                </ul>
              </section>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Navigation buttons */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/80 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200"
            >
              <Home className="w-5 h-5 mr-2" />
              Início
            </button>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <PulsingHeart color="text-blue-600" size="xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Informações Legais
            </h1>
            <p className="text-lg text-gray-600">
              Transparência e segurança em primeiro lugar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${activeSection === section.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                >
                  <section.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Contact Footer */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <PulsingHeart color="text-purple-600" size="md" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Dúvidas ou Preocupações?
          </h3>
          <p className="text-gray-600 mb-4">
            Estamos aqui para ajudar. Entre em contato conosco a qualquer momento.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a
              href="mailto:contato@queroconversar.shop"
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              contato@queroconversar.shop
            </a>
            <span className="text-gray-400">|</span>
            <a
              href="mailto:dpo@queroconversar.shop"
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              dpo@queroconversar.shop
            </a>
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Página Inicial
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
