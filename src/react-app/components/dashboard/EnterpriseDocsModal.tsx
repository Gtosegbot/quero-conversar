import React from 'react';
import { X, CheckCircle, TrendingUp, Users, Award, Calendar, BarChart2, Heart } from 'lucide-react';

interface EnterpriseDocsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EnterpriseDocsModal: React.FC<EnterpriseDocsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Plano Enterprise - Guia Completo</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Dashboard Corporativo */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <BarChart2 className="w-6 h-6 text-blue-600 mr-2" />
                            1. Dashboard Corporativo (Visão Geral)
                        </h3>
                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <p className="font-semibold text-blue-900">O que é:</p>
                            <p className="text-blue-800">Painel central que mostra a saúde mental e engajamento da equipe em tempo real.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-semibold text-gray-900">Funcionalidades:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                <li>Métricas de Colaboradores: Total de funcionários (124) e crescimento mensal (+12)</li>
                                <li>Taxa de Engajamento: Percentual de uso ativo da plataforma (78%)</li>
                                <li>Score de Bem-Estar: Média de felicidade da equipe de 0-10 (8.2/10)</li>
                                <li>Convites: Sistema para adicionar novos colaboradores via email</li>
                            </ul>
                        </div>
                    </section>

                    {/* Gerenciamento de Equipe */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Users className="w-6 h-6 text-purple-600 mr-2" />
                            2. Gerenciamento de Equipe
                        </h3>
                        <div className="bg-purple-50 p-4 rounded-lg mb-4">
                            <p className="font-semibold text-purple-900">O que é:</p>
                            <p className="text-purple-800">Tabela completa com todos os colaboradores e seus dados de bem-estar.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-semibold text-gray-900">Funcionalidades:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                <li>Perfil Completo: Nome, email, cargo de cada pessoa</li>
                                <li>Indicador de Humor: Emoji visual (😊😐😔) + nota de 1-10</li>
                                <li>Nível de Engajamento: Badge colorido (Alto/Médio/Baixo)</li>
                                <li>Última Atividade: Quando a pessoa usou a plataforma pela última vez</li>
                            </ul>
                        </div>
                    </section>

                    {/* Programas de Desenvolvimento */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Award className="w-6 h-6 text-green-600 mr-2" />
                            3. Programas de Desenvolvimento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'Gestão de Estresse', modules: 8, hours: 4, progress: '65%', enrolled: 42 },
                                { name: 'Comunicação Efetiva', modules: 6, hours: 3, progress: '82%', enrolled: 38 },
                                { name: 'Mindfulness no Trabalho', modules: 5, hours: 2.5, status: 'Em breve', interest: 28 },
                                { name: 'Equilíbrio Vida-Trabalho', modules: 7, hours: 3.5, status: 'Em breve', interest: 35 }
                            ].map((program, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900">{program.name}</h4>
                                    <p className="text-sm text-gray-600">{program.modules} módulos • {program.hours}h</p>
                                    {program.progress && <p className="text-sm text-green-600">Progresso: {program.progress}</p>}
                                    {program.enrolled && <p className="text-sm text-gray-600">{program.enrolled} inscritos</p>}
                                    {program.status && <p className="text-sm text-yellow-600">{program.status} ({program.interest} interessados)</p>}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Dashboard de Produtividade */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <TrendingUp className="w-6 h-6 text-orange-600 mr-2" />
                            4. Dashboard de Produtividade
                        </h3>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <p className="font-semibold text-orange-900 mb-2">Métricas Principais:</p>
                            <ul className="list-disc list-inside space-y-1 text-orange-800">
                                <li>Tarefas Concluídas: 156</li>
                                <li>Tempo Médio: 2.5h</li>
                                <li>Taxa de Conclusão: 89%</li>
                                <li>Top Performers: Ranking dos 3 melhores</li>
                            </ul>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="bg-green-100 p-3 rounded-lg text-center">
                                <p className="text-2xl font-bold text-green-700">+25%</p>
                                <p className="text-sm text-green-600">Produtividade</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg text-center">
                                <p className="text-2xl font-bold text-blue-700">-30%</p>
                                <p className="text-sm text-blue-600">Tempo</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg text-center">
                                <p className="text-2xl font-bold text-purple-700">89%</p>
                                <p className="text-sm text-purple-600">Conclusão</p>
                            </div>
                        </div>
                    </section>

                    {/* Feedback 360 */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Heart className="w-6 h-6 text-red-600 mr-2" />
                            5. Feedback 360°
                        </h3>
                        <div className="bg-red-50 p-4 rounded-lg mb-4">
                            <p className="font-semibold text-red-900">Sistema de avaliação multidirecional</p>
                            <p className="text-red-800 mt-2">Categorias: Comunicação, Trabalho em Equipe, Liderança, Habilidades Técnicas</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">+40%</p>
                                <p className="text-sm text-gray-600">Melhoria em competências</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-600">-50%</p>
                                <p className="text-sm text-gray-600">Conflitos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-purple-600">+35%</p>
                                <p className="text-sm text-gray-600">Satisfação</p>
                            </div>
                        </div>
                    </section>

                    {/* Sessões 1-on-1 */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Calendar className="w-6 h-6 text-indigo-600 mr-2" />
                            6. Sessões 1-on-1
                        </h3>
                        <div className="bg-indigo-50 p-4 rounded-lg">
                            <p className="font-semibold text-indigo-900 mb-2">Funcionalidades:</p>
                            <ul className="list-disc list-inside space-y-1 text-indigo-800">
                                <li>Agendamento com calendário integrado</li>
                                <li>Escolha entre vídeo ou presencial</li>
                                <li>Definição de agenda e tópicos</li>
                                <li>Lembretes automáticos</li>
                                <li>Histórico completo de reuniões</li>
                            </ul>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">+60%</p>
                                <p className="text-sm text-gray-600">Engajamento</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-600">-45%</p>
                                <p className="text-sm text-gray-600">Turnover</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-purple-600">3x</p>
                                <p className="text-sm text-gray-600">Mais rápido</p>
                            </div>
                        </div>
                    </section>

                    {/* ROI */}
                    <section className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Investimento e ROI</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="font-semibold text-gray-900 mb-2">Preço:</p>
                                <p className="text-3xl font-bold text-purple-600">R$ 49,90</p>
                                <p className="text-gray-600">por colaborador/mês</p>
                                <ul className="mt-4 space-y-1 text-sm text-gray-700">
                                    <li>✅ 10% desconto acima de 50 colaboradores</li>
                                    <li>✅ 20% desconto acima de 100 colaboradores</li>
                                    <li>✅ Sem taxa de setup</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-2">ROI (100 pessoas):</p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                        <span>-40% turnover = R$ 50.000+/ano</span>
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                        <span>+25% produtividade = R$ 200.000+/ano</span>
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                        <span>-30% absenteísmo = R$ 30.000+/ano</span>
                                    </li>
                                </ul>
                                <p className="mt-4 text-2xl font-bold text-green-600">ROI: 600% no 1º ano</p>
                            </div>
                        </div>
                    </section>

                    {/* Diferenciais */}
                    <section>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Diferenciais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                'Suporte Prioritário 24/7',
                                'Account Manager Dedicado',
                                'Consultoria Mensal',
                                'Treinamentos Customizados',
                                'Integrações via API',
                                'Segurança LGPD 100%',
                                'Garantia 30 dias'
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center space-x-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-gray-700">{item}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl text-center">
                        <h4 className="text-xl font-bold mb-2">Pronto para transformar sua equipe?</h4>
                        <p className="mb-4">Entre em contato para uma demonstração personalizada</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="mailto:enterprise@queroconversar.com.br" className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
                                Falar com Especialista
                            </a>
                            <a href="https://wa.me/5511951947025" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600">
                                WhatsApp: (11) 95194-7025
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnterpriseDocsModal;
