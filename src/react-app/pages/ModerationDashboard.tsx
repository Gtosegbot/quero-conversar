import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield,
  MessageCircle,
  AlertTriangle,
  Users,
  Clock,
  Send,
  Home,
  LogOut,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, where, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase-config';

interface ModeratorMessage {
  id: string;
  moderator_name: string;
  specialty: string;
  content: string;
  message_type: 'alert' | 'discussion' | 'resolution';
  room_mention?: string;
  created_at: string;
}

interface ModerationReport {
  id: string;
  reported_by_name: string;
  reported_user_name?: string;
  room_name?: string;
  report_type: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

interface VerificationRequest {
  id: string;
  type: 'professional' | 'partner';
  name: string; // or companyName
  email: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  documents: { name: string; url: string }[];
  details: any; // Flexible for both types
  created_at: any;
}

const ModerationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reports' | 'verifications'>('reports');
  const [moderatorMessages, setModeratorMessages] = useState<ModeratorMessage[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomMention, setRoomMention] = useState('');
  const [messageType, setMessageType] = useState<'alert' | 'discussion' | 'resolution'>('discussion');

  // Check if user is authorized
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const superAdminEmails = ['gtosegbot@', 'admgtoseg@', 'disparoseguroback@gmail.com'];
    const isAuthorized = superAdminEmails.some(adminEmail =>
      user.email && user.email.includes(adminEmail)
    );

    if (!isAuthorized) {
      navigate('/dashboard');
      return;
    }

    // 1. Listen to Moderator Chat
    const chatQuery = query(collection(db, 'moderator_chat'), orderBy('created_at', 'desc'));
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModeratorMessage[];
      setModeratorMessages(messages);
    });

    // 2. Listen to Reports
    const reportsQuery = query(collection(db, 'moderation_reports'), orderBy('created_at', 'desc'));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      const loadedReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModerationReport[];
      setReports(loadedReports);
    });

    // 3. Listen to Professional Applications
    const profQuery = query(collection(db, 'professional_applications'), where('status', '==', 'pending_verification'));
    const unsubscribeProf = onSnapshot(profQuery, (snapshot) => {
      const profs = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'professional',
        name: doc.data().name,
        email: doc.data().email,
        status: doc.data().status,
        documents: doc.data().documents,
        details: doc.data(),
        created_at: doc.data().createdAt
      })) as VerificationRequest[];

      setVerifications(prev => {
        const others = prev.filter(v => v.type !== 'professional');
        return [...others, ...profs];
      });
    });

    // 4. Listen to Partner Applications
    const partnerQuery = query(collection(db, 'partner_applications'), where('status', '==', 'pending_verification'));
    const unsubscribePartner = onSnapshot(partnerQuery, (snapshot) => {
      const partners = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'partner',
        name: doc.data().companyName, // Use company name for partners
        email: doc.data().email,
        status: doc.data().status,
        documents: doc.data().documents,
        details: doc.data(),
        created_at: doc.data().createdAt
      })) as VerificationRequest[];

      setVerifications(prev => {
        const others = prev.filter(v => v.type !== 'partner');
        return [...others, ...partners];
      });
    });

    return () => {
      unsubscribeChat();
      unsubscribeReports();
      unsubscribeProf();
      unsubscribePartner();
    };
  }, [navigate]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await addDoc(collection(db, 'moderator_chat'), {
        moderator_name: user.displayName || 'Moderador',
        specialty: 'Geral',
        content: newMessage,
        message_type: messageType,
        room_mention: roomMention || null,
        created_at: new Date().toISOString()
      });
      setNewMessage('');
      setRoomMention('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'moderation_reports', reportId), { status: newStatus });
    } catch (error) {
      console.error('Failed to update report:', error);
    }
  };

  const handleVerification = async (req: VerificationRequest, approved: boolean) => {
    try {
      const collectionName = req.type === 'professional' ? 'professional_applications' : 'partner_applications';
      const newStatus = approved ? 'verified' : 'rejected';

      // 1. Update Application Status
      await updateDoc(doc(db, collectionName, req.id), { status: newStatus });

      // 2. Update User Role if approved
      if (approved) {
        const role = req.type === 'professional' ? 'professional' : 'partner';
        await updateDoc(doc(db, 'users', req.id), {
          role: role,
          verified: true,
          verifiedAt: new Date().toISOString()
        });
      }

      alert(`Solicitação ${approved ? 'APROVADA' : 'REJEITADA'} com sucesso.`);

    } catch (error) {
      console.error('Verification error:', error);
      alert('Erro ao processar verificação.');
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-red-100 text-red-800';
      case 'resolution': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'harassment': return 'bg-red-100 text-red-800';
      case 'health_misinformation': return 'bg-orange-100 text-orange-800';
      case 'inappropriate_content': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-red-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Central de Moderação</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin')} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Home className="w-5 h-5 mr-2" /> Admin
              </button>
              <button onClick={() => { localStorage.removeItem('user'); navigate('/'); }} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <LogOut className="w-5 h-5 mr-2" /> Sair
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 border-b border-gray-200 pb-1">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'reports' ? 'bg-white text-red-600 border-t border-l border-r border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Relatórios ({reports.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'verifications' ? 'bg-white text-red-600 border-t border-l border-r border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Verificações Pendentes ({verifications.length})
            </button>
          </div>
        </div>

        {activeTab === 'reports' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Moderator Chat */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <MessageCircle className="w-6 h-6 text-blue-600 mr-2" />
                Chat de Moderação
              </h2>

              <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4">
                {moderatorMessages.map((message) => (
                  <div key={message.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900">{message.moderator_name}</span>
                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{message.specialty}</span>
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${getMessageTypeColor(message.message_type)}`}>{message.message_type}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(message.created_at).toLocaleTimeString()}</span>
                    </div>
                    {message.room_mention && <p className="text-sm text-blue-600 mb-1">📍 Sala: {message.room_mention}</p>}
                    <p className="text-gray-700">{message.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={sendMessage} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select value={messageType} onChange={(e) => setMessageType(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="discussion">Discussão</option>
                    <option value="alert">Alerta</option>
                    <option value="resolution">Resolução</option>
                  </select>
                  <input type="text" placeholder="Sala mencionada" value={roomMention} onChange={(e) => setRoomMention(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="flex space-x-2">
                  <input type="text" placeholder="Mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" required />
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"><Send className="w-5 h-5" /></button>
                </div>
              </form>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                Relatórios de Moderação
              </h2>
              <div className="h-[500px] overflow-y-auto space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${getReportTypeColor(report.report_type)}`}>{report.report_type.replace('_', ' ')}</span>
                        <span className={`text-xs px-2 py-1 rounded ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : report.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{report.status}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <p><strong>Reportado por:</strong> {report.reported_by_name}</p>
                      {report.reported_user_name && <p><strong>Usuário:</strong> {report.reported_user_name}</p>}
                      {report.room_name && <p><strong>Sala:</strong> {report.room_name}</p>}
                    </div>
                    <p className="text-gray-700">{report.description}</p>
                    {report.status === 'pending' && (
                      <div className="mt-3 flex space-x-2">
                        <button onClick={() => updateReportStatus(report.id, 'resolved')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Resolver</button>
                        <button onClick={() => updateReportStatus(report.id, 'dismissed')} className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">Dispensar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              Solicitações de Verificação ({verifications.length})
            </h2>

            {verifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma solicitação pendente.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {verifications.map(req => (
                  <div key={req.id} className="border border-gray-200 rounded-lg p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase mr-2 ${req.type === 'professional' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                          {req.type === 'professional' ? 'Profissional' : 'Parceiro'}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900">{req.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-1"><strong>Email:</strong> {req.email}</p>

                      {req.type === 'professional' ? (
                        <div className="text-sm text-gray-700 space-y-1 mt-2">
                          <p><strong>Especialidade:</strong> {req.details.specialty}</p>
                          <p><strong>Conselho:</strong> {req.details.council?.type} - {req.details.council?.number}</p>
                          <p><strong>Bio:</strong> {req.details.bio}</p>
                          <div className="flex gap-2 mt-1">
                            {req.details.socialLinks?.linkedin && <a href={req.details.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">LinkedIn</a>}
                            {req.details.socialLinks?.instagram && <a href={req.details.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline text-xs">Instagram</a>}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700 space-y-1 mt-2">
                          <p><strong>Empresa:</strong> {req.details.companyName} (CNPJ: {req.details.cnpj})</p>
                          <p><strong>Tipo:</strong> {req.details.businessType}</p>
                          <p><strong>Descrição:</strong> {req.details.description}</p>
                          <div className="flex gap-2 mt-1">
                            {req.details.website && <a href={req.details.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">Site</a>}
                            {req.details.socialLinks?.instagram && <a href={req.details.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline text-xs">Instagram</a>}
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <p className="text-xs font-bold text-gray-500 mb-2">DOCUMENTOS:</p>
                        <div className="flex flex-wrap gap-2">
                          {req.documents?.map((doc, idx) => (
                            <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs text-blue-600 hover:bg-gray-200">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {doc.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center space-y-2 border-l pl-6 border-gray-100">
                      <button
                        onClick={() => handleVerification(req, true)}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                      </button>
                      <button
                        onClick={() => handleVerification(req, false)}
                        className="flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationDashboard;
