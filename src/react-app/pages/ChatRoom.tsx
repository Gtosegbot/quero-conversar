import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Phone,
  PhoneOff,
  Video as VideoIcon,
  VideoOff,
  Mic,
  MicOff,
  ArrowLeft
} from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';

interface Message {
  id: string;
  user_id: number;
  user_name: string;
  content: string;
  timestamp: string;
  message_type: 'chat' | 'system';
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
  is_online: boolean;
}

const ChatRoom: React.FC = () => {
  const { roomId, type } = useParams<{ roomId: string; type: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isAudioCall, setIsAudioCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (type === 'professional' && roomId) {
      loadProfessional();
      loadChatHistory();
    }
  }, [roomId, type]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProfessional = async () => {
    try {
      const response = await fetch(`/api/professionals/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setProfessional(data.professional);
      }
    } catch (error) {
      console.error('Failed to load professional:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/professional/${roomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      content: newMessage,
      professional_id: roomId,
      message_type: 'chat'
    };

    // Optimistic update
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      user_id: 1, // TODO: Get from auth
      user_name: 'Você',
      content: newMessage,
      timestamp: new Date().toISOString(),
      message_type: 'chat'
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const response = await fetch(`/api/chat/professional/${roomId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        // Reload messages to get the real message with ID
        loadChatHistory();
      } else {
        // Remove optimistic update on failure
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic update on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const startVideoCall = async () => {
    try {
      setIsVideoCall(true);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Send system message about video call
      await fetch(`/api/chat/professional/${roomId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Iniciou uma videochamada',
          professional_id: roomId,
          message_type: 'system'
        })
      });

      loadChatHistory();

    } catch (error) {
      console.error('Failed to start video call:', error);
      alert('Erro ao iniciar videochamada. Verifique as permissões de câmera e microfone.');
    }
  };

  const endVideoCall = () => {
    setIsVideoCall(false);
    setIsAudioCall(false);

    // Stop all tracks
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Will be !isMuted after state update
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOn; // Will be !isVideoOn after state update
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <PulsingHeart color="text-purple-600" size="xl" />
          <p className="text-gray-600 mt-4">Carregando sala...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/professionals')}
              className="mr-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <PulsingHeart color="text-purple-600" size="md" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">
                {type === 'professional' ? (professional?.name || 'Profissional') : 'Chat'}
              </h1>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${professional?.is_online ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                <p className="text-sm text-gray-600">
                  {professional?.is_online ? 'Online' : 'Offline'} • {professional?.specialty}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isVideoCall && !isAudioCall && (
              <>
                <button
                  onClick={() => setIsAudioCall(true)}
                  className="p-3 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  title="Ligar"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={startVideoCall}
                  className="p-3 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                  title="Videochamada"
                >
                  <VideoIcon className="w-5 h-5" />
                </button>
              </>
            )}

            {(isVideoCall || isAudioCall) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-lg transition-colors ${isMuted
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  title={isMuted ? 'Ativar microfone' : 'Silenciar'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {isVideoCall && (
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-lg transition-colors ${!isVideoOn
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    title={isVideoOn ? 'Desativar vídeo' : 'Ativar vídeo'}
                  >
                    {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                )}

                <button
                  onClick={endVideoCall}
                  className="p-3 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title="Encerrar chamada"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Call Area */}
      {isVideoCall && (
        <div className="relative bg-black h-64">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-white"
          />
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
            Videochamada ativa
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.user_name === 'Você' ? 'justify-end' : 'justify-start'
              }`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.message_type === 'system'
                  ? 'bg-gray-100 text-gray-600 text-center text-sm'
                  : message.user_name === 'Você'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white text-gray-800 shadow-lg'
                }`}>
                {message.message_type === 'chat' && message.user_name !== 'Você' && (
                  <div className="flex items-center mb-2">
                    <PulsingHeart color="text-purple-600" size="sm" />
                    <span className="ml-2 text-sm font-semibold text-purple-700">
                      {message.user_name}
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <p className={`text-xs mt-2 ${message.user_name === 'Você' ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
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
              placeholder="Digite sua mensagem..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              rows={2}
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
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
};

export default ChatRoom;
