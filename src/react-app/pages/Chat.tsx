import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, Zap, AlertCircle } from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';
import TypewriterEffect from '../components/TypewriterEffect';
import { db, auth } from '../../firebase-config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  limit,
  getDocs,
  doc
} from 'firebase/firestore';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  level?: number;
  role?: string;
}

interface UserContext {
  name: string;
  dailyInteractions: number;
  maxDailyInteractions: number;
  plan: 'free' | 'premium';
  level: number;
  role: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [userContext, setUserContext] = useState<UserContext>({
    name: 'Usuário',
    dailyInteractions: 0,
    maxDailyInteractions: 15,
    plan: 'free',
    level: 1,
    role: 'user'
  });

  const getUserId = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.uid;
    }
    return null;
  };

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    // 1. Listen to User Profile (Plan & Role)
    const userRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const superAdminEmails = ['gtosegbot@', 'admgtoseg@', 'disparoseguroback@gmail.com'];
        const isSuperAdmin = superAdminEmails.some(email => data.email?.includes(email));
        const isPremium = data.plan === 'premium' || data.plan === 'enterprise' || data.role === 'admin' || isSuperAdmin;

        setUserContext({
          name: data.name || 'Usuário',
          dailyInteractions: data.dailyInteractions || 0,
          maxDailyInteractions: isPremium ? 9999 : 15,
          plan: isPremium ? 'premium' : 'free',
          level: data.level || 1,
          role: isSuperAdmin ? 'admin' : (data.role || 'user')
        });
      }
    });

    // 2. Setup Conversation
    const setupConversation = async () => {
      // Check for existing active conversation
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      let convId = '';

      if (!querySnapshot.empty) {
        convId = querySnapshot.docs[0].id;
      } else {
        // Create new conversation
        const newConv = await addDoc(conversationsRef, {
          userId,
          createdAt: serverTimestamp(),
          status: 'active'
        });
        convId = newConv.id;
      }

      setConversationId(convId);

      // Listen to messages
      const messagesRef = collection(db, 'conversations', convId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const loadedMessages: Message[] = snapshot.docs.map(doc => ({
          id: doc.id,
          type: doc.data().type,
          content: doc.data().content,
          timestamp: doc.data().createdAt?.toDate() || new Date(),
          level: doc.data().level,
          role: doc.data().role
        }));
        setMessages(loadedMessages);

        // Scroll to bottom on new message
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      return () => unsubscribeMessages();
    };

    let cleanupConversation: (() => void) | undefined;
    setupConversation().then(cleanup => { cleanupConversation = cleanup; });

    return () => {
      unsubscribeUser();
      if (cleanupConversation) cleanupConversation();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    // Check daily limit for free users
    if (userContext.plan === 'free' && userContext.dailyInteractions >= userContext.maxDailyInteractions) {
      setShowUpgradeModal(true);
      return;
    }

    // Anti-Circumvention / Anti-Bypass Filter
    const phoneRegex = /(\(?\d{2}\)?\s?)?9\d{4}-?\d{4}/;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

    if (phoneRegex.test(newMessage) || emailRegex.test(newMessage)) {
      alert("⚠️ Por segurança, não é permitido compartilhar contatos pessoais (telefone ou email) antes da confirmação da consulta. Utilize o chat da plataforma.");
      return;
    }

    const messageContent = newMessage;
    setNewMessage(''); // Clear input immediately
    setIsLoading(true);

    // Optimistic Update
    const tempId = Date.now().toString();
    const optimisticMessage: Message = {
      id: tempId,
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      level: userContext.level,
      role: userContext.role
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      let currentConversationId = conversationId;

      // Ensure conversation exists
      if (!currentConversationId) {
        const conversationsRef = collection(db, 'conversations');
        const newConv = await addDoc(conversationsRef, {
          userId: user.uid,
          createdAt: serverTimestamp(),
          status: 'active'
        });
        currentConversationId = newConv.id;
        setConversationId(currentConversationId);
      }

      // Add User Message to Firestore
      await addDoc(collection(db, 'conversations', currentConversationId, 'messages'), {
        type: 'user',
        content: messageContent,
        createdAt: serverTimestamp(),
        level: userContext.level,
        role: userContext.role
      });

      setIsLoading(false);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("Erro ao conectar com a Dra. Clara. Tente novamente.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const interactionsRemaining = userContext.maxDailyInteractions - userContext.dailyInteractions;
  const showLimitWarning = userContext.plan === 'free' && interactionsRemaining <= 3;

  const getHeartColor = (role?: string, level?: number) => {
    if (role === 'admin') return 'text-yellow-500'; // Gold for Admins
    if (role === 'professional') return 'text-orange-500'; // Orange for Professionals
    if (role === 'moderator') return 'text-green-600'; // Green for Moderators
    if (role === 'partner') return 'text-cyan-500'; // Cyan for Partners

    // Default User Levels
    if (!level) return 'text-blue-500';
    if (level >= 10) return 'text-red-600'; // Leader
    if (level >= 5) return 'text-purple-600'; // Guardian
    return 'text-blue-500'; // Beginner
  };

  const getRoleLabel = (role?: string, level?: number) => {
    if (role === 'admin') return 'Administrador';
    if (role === 'professional') return 'Profissional';
    if (role === 'moderator') return 'Moderador';
    if (role === 'partner') return 'Parceiro';
    return `Nível ${level || 1}`;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <PulsingHeart color="text-purple-600" size="lg" />
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">Dra. Clara Mendes</h1>
              <p className="text-sm text-gray-600">Sua psicóloga virtual empática</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userContext.plan === 'free' && (
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Interações restantes: <span className="font-bold">{interactionsRemaining}</span>
                </p>
                <p className="text-xs text-purple-600">Plano Grátis</p>
              </div>
            )}

            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Limit Warning */}
      {showLimitWarning && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">
                Você tem apenas {interactionsRemaining} interações restantes hoje
              </span>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-white text-orange-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.type === 'user'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white text-gray-800 shadow-lg'
                }`}>
                {message.type === 'bot' && (
                  <div className="flex items-center mb-2">
                    <PulsingHeart color="text-purple-600" size="sm" />
                    <span className="ml-2 text-sm font-semibold text-purple-700">Dra. Clara</span>
                  </div>
                )}
                {message.type === 'user' && (
                  <div className="flex items-center justify-end mb-1">
                    <span className="mr-2 text-xs text-purple-200">{getRoleLabel(message.role, message.level)}</span>
                    <PulsingHeart color={getHeartColor(message.role, message.level)} size="sm" />
                  </div>
                )}
                {message.type === 'bot' ? (
                  <p className="text-sm">
                    {/* Only use TypewriterEffect for the very last message to avoid re-typing history */}
                    {index === messages.length - 1 ? (
                      <TypewriterEffect text={message.content} speed={30} />
                    ) : (
                      <span className="whitespace-pre-line">{message.content}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                )}
                <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-white shadow-lg">
                <div className="flex items-center mb-2">
                  <PulsingHeart color="text-purple-600" size="sm" />
                  <span className="ml-2 text-sm font-semibold text-purple-700">Dra. Clara</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
              placeholder="Compartilhe seus pensamentos e sentimentos..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              rows={2}
              disabled={userContext.plan === 'free' && userContext.dailyInteractions >= userContext.maxDailyInteractions}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading || (userContext.plan === 'free' && userContext.dailyInteractions >= userContext.maxDailyInteractions)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <PulsingHeart color="text-purple-600" size="xl" className="mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Limite Diário Atingido
              </h3>
              <p className="text-gray-600 mb-6">
                Você atingiu o limite de {userContext.maxDailyInteractions} interações diárias do plano gratuito.
                Faça upgrade para continuar conversando!
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/plans'}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  <Zap className="w-5 h-5 inline mr-2" />
                  Ver Planos Premium
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Voltar Amanhã
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
