import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Users,
  UserCheck,
  Shield,
  ArrowRight,
  Star,
  CheckCircle,
  MessageCircle,
  Video
} from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';

const Landing: React.FC = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'IA Empática - Dra. Clara',
      description: 'Nossa psicóloga virtual conduz você através de uma jornada personalizada de autoconhecimento',
      color: 'text-purple-500'
    },
    {
      icon: Users,
      title: 'Comunidade de Apoio',
      description: 'Conecte-se com pessoas que compartilham experiências similares em um ambiente seguro',
      color: 'text-blue-500'
    },
    {
      icon: UserCheck,
      title: 'Profissionais Qualificados',
      description: 'Acesso a psicólogos, coaches, nutricionistas e outros especialistas em bem-estar',
      color: 'text-green-500'
    },
    {
      icon: Video,
      title: 'Consultas por Vídeo',
      description: 'Atendimento profissional direto na plataforma com total privacidade',
      color: 'text-orange-500'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Seus dados e conversas são protegidos com a mais alta tecnologia de segurança',
      color: 'text-red-500'
    },
    {
      icon: Star,
      title: 'Jornada de Evolução',
      description: 'Avance da Fase 1 à 3, mude a cor do seu coração e torne-se um Líder na comunidade',
      color: 'text-yellow-500'
    }
  ];

  const testimonials = [
    {
      name: 'Maria S.',
      role: 'Usuária',
      text: 'A Dra. Clara me ajudou a entender meus sentimentos de uma forma que nunca imaginei possível.',
      rating: 5
    },
    {
      name: 'Dr. João P.',
      role: 'Psicólogo',
      text: 'Uma plataforma revolucionária que me permite alcançar e ajudar muito mais pessoas.',
      rating: 5
    },
    {
      name: 'Ana L.',
      role: 'Coach',
      text: 'A gamificação me motiva a estar sempre presente para ajudar a comunidade.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <PulsingHeart color="text-purple-600" size="lg" />
              <span className="ml-3 text-2xl font-bold text-gray-900">Quero Conversar</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#como-funciona" className="text-gray-600 hover:text-purple-600 transition-colors">Como Funciona</a>
              <a href="#profissionais" className="text-gray-600 hover:text-purple-600 transition-colors">Para Profissionais</a>
              <a href="#termos" className="text-gray-600 hover:text-purple-600 transition-colors">Termos</a>
              <a href="#contato" className="text-gray-600 hover:text-purple-600 transition-colors">Contato</a>
            </nav>
            <Link
              to="/auth"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Entrar / Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <PulsingHeart color="text-purple-600" size="xl" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Encontre apoio,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                converse e evolua
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Uma plataforma completa que une inteligência artificial empática, comunidades de
              apoio e profissionais qualificados para sua jornada de bem-estar integral.
            </p>
            <div className="text-lg text-purple-600 mb-8 font-medium">
              Seu espaço seguro para crescimento físico, mental e espiritual
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="#como-funciona"
                className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg hover:bg-purple-50 transition-all duration-200 flex items-center justify-center"
              >
                <Heart className="mr-2 w-5 h-5" />
                Como Funciona?
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como Funciona?
            </h2>
            <p className="text-xl text-gray-600">
              Uma experiência completa e personalizada para seu bem-estar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex items-center mb-4">
                  <PulsingHeart color={feature.color} size="md" className="mr-3" />
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Roles Section */}
      <section className="py-20 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sua Jornada na Comunidade
            </h2>
            <p className="text-xl text-gray-600">
              Todos podem evoluir e contribuir. Veja como você pode crescer conosco.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>

            {/* Role 1: User */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-100 text-center relative">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white">
                <PulsingHeart color="text-blue-500" size="md" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Membro (Fases 1 & 2)</h3>
              <p className="text-gray-600 text-sm mb-4">
                Foque no seu autoconhecimento, complete tarefas e participe das conversas.
              </p>
              <ul className="text-left text-sm space-y-2 text-gray-500">
                <li>• Acesso à Dra. Clara</li>
                <li>• Participação em Salas</li>
                <li>• Conteúdo Diário</li>
              </ul>
            </div>

            {/* Role 2: Leader */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-purple-100 text-center relative transform md:-translate-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white">
                <PulsingHeart color="text-purple-600" size="md" />
              </div>
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                POPULAR
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Líder (Fase 3)</h3>
              <p className="text-gray-600 text-sm mb-4">
                Você evoluiu! Seu coração vermelho mostra que você tem experiência para ajudar.
              </p>
              <ul className="text-left text-sm space-y-2 text-gray-500">
                <li>• Coração Vermelho (Autoridade)</li>
                <li>• Destaque na Comunidade</li>
                <li>• <strong>Pode solicitar Moderação</strong></li>
              </ul>
            </div>

            {/* Role 3: Moderator */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-red-100 text-center relative">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Moderador</h3>
              <p className="text-gray-600 text-sm mb-4">
                Guardiões da comunidade. Podem ser Usuários Líderes, Profissionais ou Parceiros.
              </p>
              <ul className="text-left text-sm space-y-2 text-gray-500">
                <li>• Acesso ao Painel de Moderação</li>
                <li>• Resolução de Conflitos</li>
                <li>• Contato direto com Admin</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="py-20 bg-gradient-to-r from-orange-100 to-yellow-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Programa de Parcerias
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Venda seus produtos e e-books em nossa plataforma
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Alcance Milhares de Pessoas Interessadas em Bem-Estar
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <PulsingHeart color="text-orange-500" size="sm" className="mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Marketplace Especializado</h4>
                    <p className="text-gray-600">Sua vitrine em uma comunidade focada em crescimento pessoal</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <PulsingHeart color="text-yellow-500" size="sm" className="mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Comissão de 70%</h4>
                    <p className="text-gray-600">Você fica com 70% de cada venda, nós cuidamos do resto</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <PulsingHeart color="text-red-500" size="sm" className="mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Tipos de Produto</h4>
                    <p className="text-gray-600">E-books, cursos, produtos físicos, serviços de consultoria</p>
                  </div>
                </div>
              </div>
              <Link
                to="/register-partner"
                className="inline-flex items-center mt-8 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200"
              >
                Tornar-se Parceiro
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-xl p-8">
              <h4 className="text-xl font-bold text-gray-900 mb-6">Produtos Aceitos</h4>
              <div className="space-y-3">
                {[
                  'E-books de Autoajuda',
                  'Cursos Online de Bem-estar',
                  'Produtos de Meditação',
                  'Suplementos Naturais',
                  'Equipamentos de Exercício',
                  'Apps e Ferramentas Digitais',
                  'Consultorias Especializadas'
                ].map((product, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                    <span className="text-gray-700">{product}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Section */}
      <section id="profissionais" className="py-20 bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Para Profissionais
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Cresça sua prática e impacte mais vidas
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Ganhe Autoridade Ajudando Gratuitamente
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <PulsingHeart color="text-green-500" size="sm" className="mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Sistema de Popularidade</h4>
                    <p className="text-gray-600">Quanto mais você ajuda na comunidade, mais popular e indicado você fica</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <PulsingHeart color="text-blue-500" size="sm" className="mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Leads Qualificados</h4>
                    <p className="text-gray-600">Usuários que já te conhecem através das interações gratuitas</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <PulsingHeart color="text-purple-500" size="sm" className="mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Rateio Justo</h4>
                    <p className="text-gray-600">80% para você, 20% para a plataforma nas consultas pagas</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <PulsingHeart color="text-orange-500" size="sm" className="mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Preços Populares</h4>
                    <p className="text-gray-600">Defina preços acessíveis e atenda mais pessoas</p>
                  </div>
                </div>
              </div>
              <Link
                to="/register-professional"
                className="inline-flex items-center mt-8 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200"
              >
                Cadastrar como Profissional
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-xl p-8">
              <h4 className="text-xl font-bold text-gray-900 mb-6">Tipos de Profissionais</h4>
              <div className="space-y-3">
                {[
                  'Psicólogos e Psiquiatras',
                  'Coaches de Vida e Carreira',
                  'Nutricionistas',
                  'Personal Trainers',
                  'Terapeutas Holísticos',
                  'Orientadores Espirituais',
                  'Consultores de Bem-estar'
                ].map((profession, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{profession}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que dizem sobre nós
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <PulsingHeart color="text-purple-500" size="sm" className="mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <PulsingHeart color="text-purple-400" size="lg" />
                <span className="ml-3 text-2xl font-bold">Quero Conversar</span>
              </div>
              <p className="text-gray-400 mb-4">
                Sua plataforma de bem-estar integral, conectando pessoas através de inteligência artificial empática e profissionais qualificados.
              </p>
              <p className="text-gray-400">
                <strong>Contato:</strong> <a href="mailto:contato@queroconversar.shop" className="text-purple-400 hover:text-purple-300">contato@queroconversar.shop</a>
              </p>
            </div>
            <div id="termos">
              <h3 className="text-lg font-semibold mb-4">Links Úteis</h3>
              <ul className="space-y-2">
                <li><Link to="/auth?redirect=/terms" className="text-gray-400 hover:text-white transition-colors">Termos de Serviço</Link></li>
                <li><Link to="/auth?redirect=/privacy" className="text-gray-400 hover:text-white transition-colors">Política de Privacidade</Link></li>
                <li><Link to="/auth?redirect=/lgpd" className="text-gray-400 hover:text-white transition-colors">LGPD</Link></li>
                <li><Link to="/auth?redirect=/docs" className="text-gray-400 hover:text-white transition-colors">Documentação</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li><a href="#como-funciona" className="text-gray-400 hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="#profissionais" className="text-gray-400 hover:text-white transition-colors">Para Profissionais</a></li>
                <li><Link to="/auth?redirect=/plans" className="text-gray-400 hover:text-white transition-colors">Planos</Link></li>
                <li><Link to="/auth?redirect=/community" className="text-gray-400 hover:text-white transition-colors">Comunidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Quero Conversar. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
