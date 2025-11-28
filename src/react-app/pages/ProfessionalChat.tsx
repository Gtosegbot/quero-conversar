import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Send, ArrowLeft, User, Video, FileText, Clock } from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';

interface Message {
  id: string;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
  message_type: 'chat' | 'system' | 'appointment';
}

interface Professional {
  id: number;
  name: string;
  specialty: string;
  is_online: boolean;
  hourly_rate: number;
}

const ProfessionalChat: React.FC = () => {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (professionalId) {
      loadProfessional();
      loadMessages();
    }
  }, [professionalId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProfessional = async () => {
    try {
      const response = await fetch(`/api/professionals/${professionalId}`);
      if (response.ok) {
        const data = await response.json();
        setProfessional(data.professional);
      }
    } catch (error) {
      console.error('Error loading professional:', error);
      // Mock data fallback
      setProfessional({
        id: parseInt(professionalId || '1'),
        name: 'Dr. João Santos',
        specialty: 'Psiquiatra',
        is_online: true,
        hourly_rate: 200
      });
    }
  };

  const loadMessages = async () => {
    try {
      // Try to load from localStorage first for immediate persistence
      const localStorageKey = `professional_chat_${professionalId}`;
      const localMessages = localStorage.getItem(localStorageKey);
      
      if (localMessages) {
        setMessages(JSON.parse(localMessages));
      }

      // Then try to sync with backend
      const response = await fetch(`/api/chat/professional/${professionalId}/messages`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          // Update localStorage with backend data
          localStorage.setItem(localStorageKey, JSON.stringify(data.messages));
        }
      } else if (!localMessages) {
        // Initialize with welcome message only if no local messages
        const welcomeMessage: Message = {
          id: '1',
          user_id: 0,
          user_name: 'Sistema',
          content: `Olá! Este é seu chat direto com o profissional. Você pode compartilhar suas dúvidas, agendar consultas ou solicitar orientações específicas.

💡 **Dicas:**
• Para consultas emergenciais, use o botão de videochamada
• Documentos podem ser compartilhados durante o chat
• Este canal é privado e seguro

Como posso te ajudar hoje?`,
          created_at: new Date().toISOString(),
          message_type: 'system'
        };
        const initialMessages = [welcomeMessage];
        setMessages(initialMessages);
        localStorage.setItem(localStorageKey, JSON.stringify(initialMessages));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to localStorage
      const localStorageKey = `professional_chat_${professionalId}`;
      const localMessages = localStorage.getItem(localStorageKey);
      if (localMessages) {
        setMessages(JSON.parse(localMessages));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      user_id: 1,
      user_name: 'Você',
      content: newMessage,
      created_at: new Date().toISOString(),
      message_type: 'chat'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Save to localStorage immediately for persistence
    const localStorageKey = `professional_chat_${professionalId}`;
    localStorage.setItem(localStorageKey, JSON.stringify(updatedMessages));
    
    const messageToSend = newMessage;
    setNewMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/chat/professional/${professionalId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageToSend,
          message_type: 'chat'
        }),
      });

      if (response.ok) {
        console.log('Message synced to backend');
      } else {
        console.warn('Backend sync failed, but message saved locally');
      }
      
      // Simulate professional response
      setTimeout(() => {
        const professionalResponse: Message = {
          id: (Date.now() + 1).toString(),
          user_id: 0,
          user_name: professional?.name || 'Profissional',
          content: generateProfessionalResponse(messageToSend),
          created_at: new Date().toISOString(),
          message_type: 'chat'
        };
        
        setMessages(prev => {
          const newMessages = [...prev, professionalResponse];
          // Save updated messages with professional response
          localStorage.setItem(localStorageKey, JSON.stringify(newMessages));
          return newMessages;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Message is already saved locally, so no need to remove it
    } finally {
      setIsLoading(false);
    }
  };

  const generateProfessionalResponse = (_userMessage: string): string => {
    const responses = [
      `Obrigado por compartilhar isso comigo. Entendo sua preocupação e gostaria de explorar isso mais profundamente. Que tal agendarmos uma consulta para conversarmos com mais calma?`,
      
      `Percebo que você está passando por um momento desafiador. É normal sentir-se assim, e estou aqui para te apoiar. Podemos trabalhar isso juntos através de estratégias específicas.`,
      
      `Sua situação é compreensível e você não está sozinho(a). Baseado no que você compartilhou, sugiro que conversemos numa consulta individual onde posso dar orientações mais direcionadas.`,
      
      `Agradeço sua confiança em dividir isso comigo. Para oferecer o melhor suporte, seria ideal termos uma sessão focada nisso. Você gostaria de agendar um horário?`,
      
      `Entendo perfeitamente sua situação. Isso que você está sentindo tem tratamento e podemos trabalhar isso juntos. Vou te orientar com algumas estratégias específicas.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVideoCall = () => {
    // Redirect to appointment booking
    navigate(`/professionals`);
  };

  const handleScheduleAppointment = () => {
    navigate(`/professionals`);
  };

  const handleShareDocument = () => {
    // Implement document sharing
    alert('Funcionalidade de compartilhamento de documentos em desenvolvimento');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/professionals')}
              className="mr-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {professional?.name || 'Carregando...'}
                </h1>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{professional?.specialty}</span>
                  {professional?.is_online && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 ml-1">Online</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVideoCall}
              className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
              title="Videochamada"
            >
              <Video className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleScheduleAppointment}
              className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
              title="Agendar Consulta"
            >
              <Clock className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleShareDocument}
              className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors"
              title="Compartilhar Documento"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Professional Info Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm">
            💬 Chat profissional seguro • 
            ⚡ Resposta em até 2 horas • 
            💰 R$ {professional?.hourly_rate}/hora para consultas
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${
              message.user_name === 'Você' ? 'justify-end' : 'justify-start'
            }`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.user_name === 'Você'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : message.message_type === 'system'
                  ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border'
                  : 'bg-white text-gray-800 shadow-lg border'
              }`}>
                {message.user_name !== 'Você' && (
                  <div className="flex items-center mb-2">
                    {message.message_type === 'system' ? (
                      <PulsingHeart color="text-gray-600" size="sm" />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="ml-2 text-sm font-semibold text-gray-700">
                      {message.user_name}
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.user_name === 'Você' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-white shadow-lg border">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="ml-2 text-sm font-semibold text-gray-700">
                    {professional?.name || 'Profissional'}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Compartilhe suas dúvidas com o profissional..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Pressione Enter para enviar • Suas mensagens são privadas e seguras
        </p>
      </div>
    </div>
  );
};

export default ProfessionalChat;
