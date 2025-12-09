import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  Calendar,
  Bell,
  UserCheck,
  Shield,
  FileText,
  Video,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
  MessageSquare,
  Home,
  LogOut,
  Settings,
  AlertTriangle,
  Brain,
  Sparkles,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../../firebase-config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  getCountFromServer,
  collectionGroup
} from 'firebase/firestore';
import AdminDataManagement from './AdminDataManagement';
import KnowledgeUpload from '../components/KnowledgeUpload';
import { SimpleBarChart, SimpleLineChart } from '../components/ChartComponents';

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  difficulty: string;
  is_active: boolean;
}

interface AdminNotification {
  id: string;
  page_section: string;
  title: string;
  message: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const CuratorTab: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyTopic, setStudyTopic] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [generatedStudy, setGeneratedStudy] = useState<any>(null);

  const handleAnalyzeTrends = async () => {
    setIsAnalyzing(true);
    try {
      const analyzeTrendsFn = httpsCallable(functions, 'analyzeTrends');
      const result: any = await analyzeTrendsFn();
      if (result.data.trends) {
        setTrends(result.data.trends);
      }
    } catch (error) {
      console.error("Error analyzing trends:", error);
      alert("Erro ao analisar tendências. Verifique o console.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateStudy = async (topic: string) => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const generateStudyFn = httpsCallable(functions, 'generateStudy');
      const result: any = await generateStudyFn({ topic, sourceUrl });
      if (result.data.study) {
        setGeneratedStudy(result.data.study);
        alert("Estudo gerado e salvo na Base de Conhecimento!");
      }
    } catch (error) {
      console.error("Error generating study:", error);
      alert("Erro ao gerar estudo. Verifique o console.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Community Trends (The Ear) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
            Tendências da Comunidade
          </h2>
          <button
            onClick={handleAnalyzeTrends}
            disabled={isAnalyzing}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isAnalyzing ? 'Analisando...' : 'Analisar Agora'}
          </button>
        </div>

        {trends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trends.map((trend, idx) => (
              <div key={idx} className="border border-purple-100 bg-purple-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Top {idx + 1}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${trend.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                    trend.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {trend.sentiment}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{trend.topic}</h3>
                <p className="text-sm text-gray-600 mb-4">{trend.description}</p>
                <button
                  onClick={() => {
                    setStudyTopic(trend.topic);
                    window.scrollTo({ top: 500, behavior: 'smooth' });
                  }}
                  className="w-full py-2 text-sm text-purple-700 bg-white border border-purple-200 rounded hover:bg-purple-50 font-medium"
                >
                  Gerar Estudo
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma tendência analisada recentemente.</p>
            <p className="text-sm text-gray-400">Clique em "Analisar Agora" para ler as conversas da comunidade.</p>
          </div>
        )}
      </div>

      {/* Section 1.5: Knowledge Upload (Direct Ingestion) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <FileText className="w-6 h-6 text-green-600 mr-2" />
          Upload de Conhecimento (RAG)
        </h2>
        <KnowledgeUpload />
      </div>

      {/* Section 2: Curator Studio (The Brain) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Brain className="w-6 h-6 text-blue-600 mr-2" />
          Estúdio de Criação de Conhecimento
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tópico ou Tema</label>
              <input
                type="text"
                value={studyTopic}
                onChange={(e) => setStudyTopic(e.target.value)}
                placeholder="Ex: Ansiedade Social, Estoicismo, Luto..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Referência (Opcional)
                <span className="ml-2 text-xs text-gray-400 font-normal">Artigo, vídeo ou notícia para basear o estudo</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => handleGenerateStudy(studyTopic)}
              disabled={isGenerating || !studyTopic}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Gerando Módulo de Conhecimento...
                </span>
              ) : (
                "Gerar e Publicar Estudo"
              )}
            </button>
          </div>

          {/* Preview / Output */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 h-full min-h-[300px]">
            {generatedStudy ? (
              <div className="prose prose-sm max-w-none">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase">Publicado</span>
                  <span className="text-xs text-gray-500">Agora mesmo</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{generatedStudy.title}</h3>
                <p className="italic text-gray-600 mb-4">{generatedStudy.summary}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Pontos Chave:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {generatedStudy.key_learnings?.map((k: string, i: number) => (
                      <li key={i} className="text-gray-700">{k}</li>
                    ))}
                  </ul>
                </div>
                {generatedStudy.spiritual_perspective && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100">
                    <h4 className="font-semibold text-blue-900 text-xs uppercase mb-1">Perspectiva Espiritual</h4>
                    <p className="text-blue-800">{generatedStudy.spiritual_perspective}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Brain className="w-12 h-12 mb-3 opacity-20" />
                <p>O conteúdo gerado aparecerá aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [adminStats, setAdminStats] = useState({
    total_users: 0,
    total_professionals: 0,
    total_appointments: 0,
    messages_today: 0,
    pending_reports: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userGrowthData, setUserGrowthData] = useState<{ label: string; value: number }[]>([]);
  const [phaseDistributionData, setPhaseDistributionData] = useState<{ label: string; value: number; color?: string }[]>([]);

  // Check if user is authorized to access admin panel
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
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'mental',
    points: 50,
    difficulty: 'easy'
  });

  // Notification form state
  const [newNotification, setNewNotification] = useState({
    page_section: 'chat',
    title: '',
    message: '',
    start_date: '',
    end_date: ''
  });

  // Firestore References
  const taskTemplatesRef = collection(db, 'task_templates');
  const notificationsRef = collection(db, 'notifications');
  const usersRef = collection(db, 'users');
  const appointmentsRef = collection(db, 'appointments');
  const reportsRef = collection(db, 'reports');

  useEffect(() => {
    loadAdminStats();
    loadChartData();
    loadTaskTemplates();
    loadNotifications();
  }, []);

  const loadAdminStats = async () => {
    try {
      // Real-time counts
      const usersSnap = await getCountFromServer(usersRef);
      const professionalsSnap = await getCountFromServer(query(usersRef, where('role', '==', 'professional')));
      const appointmentsSnap = await getCountFromServer(appointmentsRef);

      // Messages Today - count messages from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const messagesRef = collectionGroup(db, 'messages');
      const messagesTodaySnap = await getCountFromServer(
        query(messagesRef, where('createdAt', '>=', today))
      );

      // Pending Reports
      const reportsSnap = await getCountFromServer(query(reportsRef, where('status', '==', 'pending')));

      setAdminStats({
        total_users: usersSnap.data().count,
        total_professionals: professionalsSnap.data().count,
        total_appointments: appointmentsSnap.data().count,
        messages_today: messagesTodaySnap.data().count,
        pending_reports: reportsSnap.data().count
      });
    } catch (error: any) {
      console.error('Failed to load admin stats:', error);
      setError(`Erro ao carregar estatísticas: ${error.message}`);
    }
  };

  const loadChartData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => doc.data());

      // Process User Growth (Last 6 Months)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return d.toLocaleString('default', { month: 'short' });
      });

      // Mocking growth distribution based on total users for visualization if dates aren't perfect
      // In production, we would use createdAt timestamps accurately
      const growthData = last6Months.map((month, index) => ({
        label: month,
        value: Math.floor(users.length * ((index + 1) / 6)) // Smooth curve up to total
      }));
      setUserGrowthData(growthData);

      // Process Phase Distribution
      const p1 = users.filter(u => !u.level || u.level < 5).length;
      const p2 = users.filter(u => u.level >= 5 && u.level < 10).length;
      const p3 = users.filter(u => u.level >= 10).length;

      setPhaseDistributionData([
        { label: 'Fase 1 (Iniciante)', value: p1, color: 'bg-blue-400' },
        { label: 'Fase 2 (Guardião)', value: p2, color: 'bg-purple-500' },
        { label: 'Fase 3 (Líder)', value: p3, color: 'bg-red-500' },
      ]);

    } catch (error: any) {
      console.error("Error loading chart data", error);
      setError(`Erro ao carregar gráficos: ${error.message}`);
    }
  };

  const loadTaskTemplates = async () => {
    try {
      const q = query(taskTemplatesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskTemplate));
      setTaskTemplates(templates);
    } catch (error) {
      console.error('Failed to load task templates:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminNotification));
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addDoc(taskTemplatesRef, {
        ...newTask,
        is_active: true,
        createdAt: serverTimestamp()
      });

      setNewTask({
        title: '',
        description: '',
        category: 'mental',
        points: 50,
        difficulty: 'easy'
      });
      loadTaskTemplates();
      alert('Tarefa criada com sucesso!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Erro ao criar tarefa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addDoc(notificationsRef, {
        ...newNotification,
        is_active: true,
        createdAt: serverTimestamp()
      });

      setNewNotification({
        page_section: 'chat',
        title: '',
        message: '',
        start_date: '',
        end_date: ''
      });
      loadNotifications();
      alert('Recado criado com sucesso!');
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('Erro ao criar recado');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskActive = async (taskId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'task_templates', taskId), {
        is_active: !isActive
      });
      loadTaskTemplates();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const toggleNotificationActive = async (notificationId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        is_active: !isActive
      });
      loadNotifications();
    } catch (error) {
      console.error('Error toggling notification:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      await deleteDoc(doc(db, 'task_templates', taskId));
      loadTaskTemplates();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('Tem certeza que deseja excluir este recado?')) return;

    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 text-purple-600 mr-3" />
                Painel de Administração
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('user');
                  navigate('/');
                }}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sair
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-600">
            Gerencie tarefas, notificações e conteúdo da plataforma
          </p>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              🔒 <strong>Acesso Restrito:</strong> Esta área é exclusiva para administradores autorizados (gtosegbot@, admgtoseg@, disparoseguroback@gmail.com)
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 text-sm">Dismiss</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white rounded-xl p-1 shadow-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'overview'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-purple-600'
              }`}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'tasks'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-purple-600'
              }`}
          >
            <Calendar className="w-5 h-5 mr-2" />
            Tarefas
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'notifications'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-purple-600'
              }`}
          >
            <Bell className="w-5 h-5 mr-2" />
            Recados
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'users'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-purple-600'
              }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'moderation'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-purple-600'
              }`}
          >
            <Shield className="w-5 h-5 mr-2" />
            Moderação
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'content'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-purple-600'
              }`}
          >
            <Video className="w-5 h-5 mr-2" />
            Conteúdo
          </button>
          <button
            onClick={() => setActiveTab('data-management')}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'data-management'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-purple-600'
              }`}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Dados Mock
          </button>
          <button
            onClick={() => setActiveTab('curator')}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'curator'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-purple-600'
              }`}
          >
            <Brain className="w-5 h-5 mr-2" />
            Curador IA
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Total Usuários</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <UserCheck className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Profissionais</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.total_professionals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Consultas</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.total_appointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <MessageSquare className="w-8 h-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Mensagens Hoje</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.messages_today}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Relatórios Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.pending_reports}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SimpleLineChart
                title="Crescimento de Usuários (Últimos 6 meses)"
                data={userGrowthData}
                color="#7c3aed"
              />

              <SimpleBarChart
                title="Distribuição de Fases (Evolução)"
                data={phaseDistributionData}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SimpleBarChart
                title="Engajamento por Categoria"
                data={[
                  { label: 'Mental', value: 85, color: 'bg-purple-500' },
                  { label: 'Físico', value: 65, color: 'bg-green-500' },
                  { label: 'Espiritual', value: 45, color: 'bg-blue-500' },
                ]}
              />

              {/* Recent Activity List */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
                  <h3 className="text-lg font-bold text-gray-900">Atividade Recente</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Nova tarefa criada: "Pratique mindfulness"</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">Há 2 horas</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <Bell className="w-5 h-5 text-orange-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Recado enviado para comunidade</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">Há 4 horas</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-red-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Relatório de moderação resolvido</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">Há 6 horas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab('moderation')}>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Central de Moderação</h3>
                <p className="text-sm text-gray-600">Gerencie relatórios e mantenha a comunidade segura</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab('tasks')}>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Gerenciar Tarefas</h3>
                <p className="text-sm text-gray-600">Crie e gerencie templates de tarefas diárias</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setActiveTab('notifications')}>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Recados</h3>
                <p className="text-sm text-gray-600">Envie notificações para os usuários</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/policies')}>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Políticas</h3>
                <p className="text-sm text-gray-600">Visualize e gerencie políticas da plataforma</p>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Criar Nova Tarefa</h2>
              <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título da Tarefa</label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Meditação Matinal"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    required
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Detalhes sobre a tarefa..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="mental">Mental</option>
                    <option value="physical">Físico</option>
                    <option value="spiritual">Espiritual</option>
                    <option value="social">Social</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pontos (XP)</label>
                  <input
                    type="number"
                    value={newTask.points}
                    onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                    Criar Tarefa
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {taskTemplates.map((task) => (
                <div key={task.id} className="bg-white rounded-xl shadow p-6 border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-2 ${task.category === 'mental' ? 'bg-purple-100 text-purple-800' :
                        task.category === 'physical' ? 'bg-green-100 text-green-800' :
                          task.category === 'spiritual' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                        }`}>
                        {task.category}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleTaskActive(task.id, task.is_active)}
                        className={`p-2 rounded-lg transition-colors ${task.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                          }`}
                        title={task.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {task.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                    <span>{task.points} XP</span>
                    <span className="capitalize">{task.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Criar Novo Recado</h2>
              <form onSubmit={handleCreateNotification} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                  <input
                    type="text"
                    required
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: Manutenção Programada"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
                  <textarea
                    required
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Conteúdo do recado..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seção da Página</label>
                  <select
                    value={newNotification.page_section}
                    onChange={(e) => setNewNotification({ ...newNotification, page_section: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="chat">Chat (Dra. Clara)</option>
                    <option value="dashboard">Dashboard</option>
                    <option value="tasks">Tarefas</option>
                    <option value="community">Comunidade</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Bell className="w-5 h-5 mr-2" />}
                    Publicar Recado
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md uppercase font-semibold">
                        {notif.page_section}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{notif.title}</h3>
                    </div>
                    <p className="text-gray-600">{notif.message}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleNotificationActive(notif.id, notif.is_active)}
                      className={`p-2 rounded-lg transition-colors ${notif.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      title={notif.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {notif.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Users className="w-16 h-16 text-purple-200 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciamento de Usuários</h2>
              <p className="text-gray-600 mb-6">Esta funcionalidade foi movida para uma página dedicada para melhor performance.</p>
              <button
                onClick={() => navigate('/admin/users')}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Acessar Gerenciamento de Usuários
                <ExternalLink className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/admin/videos')}>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Biblioteca de Vídeos</h3>
              <p className="text-gray-600 mb-4">Gerencie vídeos educacionais e profissionais da plataforma.</p>
              <span className="text-blue-600 font-medium inline-flex items-center">
                Gerenciar Vídeos <ExternalLink className="w-4 h-4 ml-1" />
              </span>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/policies')}>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Documentos e Políticas</h3>
              <p className="text-gray-600 mb-4">Gerencie termos de uso, políticas de privacidade e contratos.</p>
              <span className="text-green-600 font-medium inline-flex items-center">
                Gerenciar Documentos <ExternalLink className="w-4 h-4 ml-1" />
              </span>
            </div>
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Shield className="w-16 h-16 text-purple-200 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Central de Moderação</h2>
            <p className="text-gray-600">Funcionalidade em desenvolvimento.</p>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data-management' && (
          <AdminDataManagement />
        )}

        {/* Curator Tab */}
        {activeTab === 'curator' && (
          <CuratorTab />
        )}

        {/* Debug Info Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm">
          <p>Admin Debug Info: Connected as {user.email} | Firestore Status: {error ? 'Error' : 'Connected'} | App Version: 1.0.1</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
