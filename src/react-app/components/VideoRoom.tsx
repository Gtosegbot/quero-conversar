import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  Chat,
} from '@livekit/components-react';
import {
  VideoPresets,
} from 'livekit-client';
import '@livekit/components-styles';
import { Phone, MessageCircle, Upload } from 'lucide-react';
import PulsingHeart from './PulsingHeart';
import DocumentUpload from './DocumentUpload';

interface VideoRoomProps {
  appointmentId: string;
  userType: 'patient' | 'professional';
  onLeave: () => void;
}

interface LiveKitToken {
  token: string;
  wsUrl: string;
  roomName: string;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ appointmentId, userType, onLeave }) => {
  const [token, setToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => {
    fetchLiveKitToken();
  }, [appointmentId]);

  const fetchLiveKitToken = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}/livekit-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userType }),
      });

      if (!response.ok) {
        throw new Error('Failed to get LiveKit token');
      }

      const data: LiveKitToken = await response.json();
      setToken(data.token);
      setWsUrl(data.wsUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnected = () => {
    onLeave();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <PulsingHeart color="text-purple-600" size="xl" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Conectando à consulta...</h2>
          <p className="text-gray-600">Preparando sua sala de vídeo</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <PulsingHeart color="text-red-500" size="lg" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro de Conexão</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onLeave}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={wsUrl}
        onDisconnected={handleDisconnected}
        options={{
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        }}
        className="flex-1"
      >
        <div className="flex h-full">
          {/* Main video area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center">
                <PulsingHeart color="text-green-400" size="md" />
                <h1 className="ml-3 text-white font-semibold">
                  Consulta - {userType === 'professional' ? 'Profissional' : 'Paciente'}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDocuments(!showDocuments)}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="Documentos"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="Chat"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={onLeave}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Sair da chamada"
                >
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video conference area */}
            <div className="flex-1 relative">
              <VideoConference />
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-4">
              <ControlBar variation="verbose" />
            </div>
          </div>

          {/* Sidebar for chat and documents */}
          {(showChat || showDocuments) && (
            <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
              {showDocuments && (
                <div className="flex-1 p-4 border-b">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Documentos
                  </h3>
                  <DocumentUpload 
                    appointmentId={appointmentId}
                    userType={userType}
                  />
                </div>
              )}
              
              {showChat && (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Chat da Consulta
                    </h3>
                  </div>
                  <div className="flex-1">
                    <Chat />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

export default VideoRoom;
