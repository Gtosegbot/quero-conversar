import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Send,
  Users,
  ArrowLeft,
  Smile,
  Paperclip,
  MoreVertical
} from 'lucide-react';
import PulsingHeart from './PulsingHeart';

interface Message {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  message_type: 'text' | 'image' | 'system';
}

interface RoomInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_active: boolean;
}

// Firestore References
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase-config';

const CommunityChatRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId) {
      loadRoomData();

      // Listen to messages
      const q = query(
        collection(db, 'community_messages'),
        where('roomId', '==', roomId),
        orderBy('created_at', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        setMessages(loadedMessages);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching messages:", error);
        setIsLoading(false);
        // If the error is about missing index, we might want to alert the user or log it clearly
        if (error.message.includes('index')) {
          console.error("Missing Firestore Index. Check console for link to create it.");
        }
      });

      return () => unsubscribe();
    }
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRoomData = async () => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'community_rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        setRoomInfo({ id: roomSnap.id, ...roomSnap.data() } as RoomInfo);
      } else {
        // Fallback for the default static rooms if they aren't in DB yet, 
        // or just show a generic name. 
        // Ideally, we should have seeded these. 
        // For now, let's try to infer name from ID if it's one of the defaults, 
        // but better to rely on DB.
        console.log("Room not found in DB, using fallback or waiting for seed.");
        // Optional: You could keep the mock as a fallback here if you really want, 
        // but the goal is to use real data.
      }
    } catch (error) {
      console.error("Error loading room info:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;

    const user = auth.currentUser;
    if (!user) return;

    const messageContent = newMessage;
    setNewMessage(''); // Clear input immediately

    // Optimistic Update
    const tempId = Date.now().toString();
    const optimisticMessage: Message = {
      id: tempId,
      user_id: user.uid as any, // Cast for compatibility if needed, though interface says number, usually uid is string. 
      // Wait, interface says user_id is number? That's weird for Firebase Auth. 
      // Let's check interface. It says number. But auth.currentUser.uid is string.
      // I should fix the interface too, but for now let's cast or use a temp number.
      user_name: user.displayName || 'Você',
      content: messageContent,
      created_at: new Date().toISOString(),
      message_type: 'text'
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await addDoc(collection(db, 'community_messages'), {
        roomId,
        user_id: user.uid,
        user_name: user.displayName || 'Usuário',
        content: messageContent,
        created_at: new Date().toISOString(),
        message_type: 'text'
      });
      // No need to replace the message, onSnapshot will handle the real one and reconciliation
    } catch (error) {
      console.error('Error sending message:', error);
      // Rollback if failed (optional, but good practice)
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mental': return 'text-purple-600';
      case 'physical': return 'text-green-600';
      case 'spiritual': return 'text-blue-600';
      case 'general': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <PulsingHeart color="text-purple-600" size="xl" />
          <p className="mt-4 text-gray-600">Carregando sala...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/community"
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <PulsingHeart color={getCategoryColor(roomInfo?.category || 'general')} size="md" />
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">{roomInfo?.name}</h1>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{roomInfo?.member_count} membros</span>
                  {roomInfo?.is_active && (
                    <>
                      <div className="w-1 h-1 bg-gray-400 rounded-full mx-2"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                      <span>Online</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)]">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {/* Welcome Message */}
          <div className="text-center py-8">
            <PulsingHeart color="text-purple-600" size="lg" className="mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Bem-vindo à {roomInfo?.name}!
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Este é um espaço seguro para compartilhar experiências e apoiar uns aos outros.
              Seja respeitoso e empático com todos os membros.
            </p>
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <PulsingHeart
                  color={message.user_name === 'Você' ? 'text-purple-600' : 'text-blue-600'}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {message.user_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <div className={`inline-block px-4 py-2 rounded-2xl max-w-md ${message.user_name === 'Você'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white shadow-sm border text-gray-800'
                  }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <PulsingHeart color="text-gray-400" size="sm" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white/90 backdrop-blur-sm px-4 py-4">
          <div className="flex items-end space-x-3">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Seja respeitoso e empático. Press Enter para enviar, Shift+Enter para nova linha.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommunityChatRoom;
