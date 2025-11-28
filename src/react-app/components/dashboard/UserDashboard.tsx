import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    MessageCircle,
    Calendar,
    Users,
    UserCheck,
    ArrowRight,
    Loader2,
    CheckCircle,
    Shield
} from 'lucide-react';
import PulsingHeart from '../PulsingHeart';
import PodcastGallery from '../PodcastGallery';
import KnowledgeUpload from '../KnowledgeUpload';
import CelebrationModal from '../CelebrationModal';
import { db } from '../../firebase-config';
import { doc, onSnapshot, collection, query, where, getDocs, increment, setDoc } from 'firebase/firestore';

interface DailyTask {
    id: string;
    title: string;
    description: string;
    category: 'mental' | 'physical' | 'spiritual';
    points: number;
    completed: boolean;
}

interface UserStats {
    level: number;
    energyPoints: number;
    maxEnergy: number;
    dailyInteractions: number;
    maxDailyInteractions: number;
    plan: 'free' | 'premium' | 'enterprise';
}

interface UserDashboardProps {
    user: any;
    userStats: UserStats;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, userStats }) => {
    const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [celebration, setCelebration] = useState<{
        isOpen: boolean;
        type: 'task_complete' | 'level_up' | 'streak_milestone' | 'all_tasks_complete';
        message?: string;
        data?: any;
    }>({
        isOpen: false,
        type: 'task_complete'
    });

    const [motivationalQuote, setMotivationalQuote] = useState('');

    useEffect(() => {
        const quotes = [
            'Cada novo dia é uma oportunidade de crescer e se transformar.',
            'A jornada de autoconhecimento começa com um único passo.',
            'Você é mais forte do que imagina e mais capaz do que acredita.',
            'O crescimento acontece fora da sua zona de conforto.',
            'Pequenos progressos diários levam a grandes mudanças.'
        ];
        setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);

        if (user) {
            loadDailyTasks(user.uid);
        }
    }, [user]);

    const loadDailyTasks = async (userId: string) => {
        try {
            // 1. Fetch Active Task Templates
            const templatesQuery = query(collection(db, 'task_templates'), where('is_active', '==', true));
            const templatesSnap = await getDocs(templatesQuery);
            const templates = templatesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            // 2. Fetch User's Completed Tasks for Today
            const today = new Date().toISOString().split('T')[0];
            const completedQuery = query(
                collection(db, 'users', userId, 'completed_tasks'),
                where('date', '==', today)
            );
            const completedSnap = await getDocs(completedQuery);
            const completedIds = new Set(completedSnap.docs.map(doc => doc.data().taskId));

            // 3. Merge
            const tasks = templates.map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                category: t.category,
                points: t.points,
                completed: completedIds.has(t.id)
            }));

            setDailyTasks(tasks);
            setIsLoading(false);
        } catch (error) {
            console.error("Error loading tasks:", error);
            setIsLoading(false);
        }
    };

    const completeTask = async (taskId: string) => {
        if (!user) return;

        try {
            const task = dailyTasks.find(t => t.id === taskId);
            if (!task) return;

            // Optimistic Update
            setDailyTasks(tasks => tasks.map(t => t.id === taskId ? { ...t, completed: true } : t));

            // Firestore Updates
            const today = new Date().toISOString().split('T')[0];
            const batch = (await import('firebase/firestore')).writeBatch(db);

            // 1. Mark as completed in subcollection
            const completionRef = doc(db, 'users', user.uid, 'completed_tasks', `${taskId}_${today}`);
            batch.set(completionRef, {
                taskId,
                date: today,
                completedAt: new Date().toISOString(),
                points: task.points
            });

            // 2. Update User Stats (Energy)
            const userRef = doc(db, 'users', user.uid);
            batch.update(userRef, {
                energyPoints: increment(task.points)
            });

            await batch.commit();

            // Show Celebration
            setCelebration({
                isOpen: true,
                type: 'task_complete',
                message: `Parabéns! Você completou "${task.title}" e ganhou ${task.points} pontos de energia! 🎉`,
                data: { points: task.points }
            });

            // Check all completed
            const allCompleted = dailyTasks.every(t => t.id === taskId || t.completed);
            if (allCompleted) {
                setTimeout(() => {
                    setCelebration({
                        isOpen: true,
                        type: 'all_tasks_complete',
                        message: 'INCRÍVEL! Você completou TODAS as suas tarefas de hoje! 🎉🚀',
                        data: { totalPoints: dailyTasks.reduce((acc, t) => acc + t.points, 0) }
                    });
                }, 2000);
            }

        } catch (error) {
            console.error('Failed to complete task:', error);
            // Revert optimistic update
            setDailyTasks(tasks => tasks.map(t => t.id === taskId ? { ...t, completed: false } : t));
        }
    };

    const energyPercentage = (userStats.energyPoints / userStats.maxEnergy) * 100;
    const interactionsPercentage = (userStats.dailyInteractions / userStats.maxDailyInteractions) * 100;
    const completedTasks = dailyTasks.filter(task => task.completed).length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <>
            <CelebrationModal
                isOpen={celebration.isOpen}
                onClose={() => setCelebration(prev => ({ ...prev, isOpen: false }))}
                type={celebration.type}
                message={celebration.message}
                data={celebration.data}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Daily Podcast Gallery - Prime Time Feature */}
                    <PodcastGallery />

                    {/* Knowledge Upload Section */}
                    <KnowledgeUpload />

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            to="/chat"
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="flex items-center mb-4">
                                <PulsingHeart color="text-purple-600" size="md" />
                                <MessageCircle className="w-8 h-8 text-purple-600 ml-2" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Conversar com Dra. Clara</h3>
                            <p className="text-gray-600 mb-4">Continue sua jornada de autoconhecimento</p>
                            <div className="flex items-center text-purple-600 font-semibold">
                                Iniciar Conversa
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </Link>

                        <Link
                            to="/community"
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="flex items-center mb-4">
                                <PulsingHeart color="text-green-600" size="md" />
                                <Users className="w-8 h-8 text-green-600 ml-2" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Comunidade</h3>
                            <p className="text-gray-600 mb-4">Conecte-se com pessoas que entendem você</p>
                            <div className="flex items-center text-green-600 font-semibold">
                                Participar
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </Link>

                        <Link
                            to="/professionals"
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="flex items-center mb-4">
                                <PulsingHeart color="text-orange-600" size="md" />
                                <UserCheck className="w-8 h-8 text-orange-600 ml-2" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Profissionais</h3>
                            <p className="text-gray-600 mb-4">Consulte especialistas qualificados</p>
                            <div className="flex items-center text-orange-600 font-semibold">
                                Ver Profissionais
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </Link>
                    </div>

                    {/* AdSense Placeholder for Free Users */}
                    {userStats.plan === 'free' && (
                        <div className="w-full h-32 bg-gray-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
                            <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Publicidade</div>
                            <p className="text-gray-500 font-medium">Espaço Publicitário (Google AdSense)</p>
                            <p className="text-xs text-gray-400 mt-1">Banner Responsivo</p>
                        </div>
                    )}

                    {/* Daily Tasks */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <PulsingHeart color="text-indigo-600" size="md" />
                                <h2 className="ml-3 text-2xl font-bold text-gray-900">Tarefas do Dia</h2>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-1" />
                                Hoje
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dailyTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`border-2 rounded-lg p-4 transition-all duration-300 ${task.completed
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <PulsingHeart
                                                    color={
                                                        task.category === 'mental' ? 'text-purple-500' :
                                                            task.category === 'physical' ? 'text-green-500' :
                                                                'text-blue-500'
                                                    }
                                                    size="sm"
                                                />
                                                <span className="ml-2 text-xs font-semibold text-gray-500 uppercase">
                                                    {task.category === 'mental' ? 'Mental' :
                                                        task.category === 'physical' ? 'Físico' : 'Espiritual'}
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                                            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-purple-600">
                                                    +{task.points} pontos
                                                </span>
                                                {!task.completed && (
                                                    <button
                                                        onClick={() => completeTask(task.id)}
                                                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-md text-sm hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                                                    >
                                                        Concluir
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {task.completed && (
                                            <CheckCircle className="w-6 h-6 text-green-500 ml-2" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats */}
                <div className="space-y-8">
                    {/* Energy Level & Phase */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                {/* Dynamic Heart Color based on Phase */}
                                <PulsingHeart
                                    color={
                                        userStats.level >= 10 ? 'text-red-600' :
                                            userStats.level >= 5 ? 'text-purple-600' :
                                                'text-blue-500'
                                    }
                                    size="md"
                                />
                                <div className="ml-3">
                                    <span className="text-lg font-semibold text-gray-900">Nível {userStats.level}</span>
                                    <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{
                                        color: userStats.level >= 10 ? '#dc2626' : userStats.level >= 5 ? '#9333ea' : '#3b82f6'
                                    }}>
                                        {userStats.level >= 10 ? 'Fase 3: Líder' :
                                            userStats.level >= 5 ? 'Fase 2: Guardião' :
                                                'Fase 1: Iniciante'}
                                    </p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-gray-700">{userStats.energyPoints} XP</span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div
                                className={`h-3 rounded-full transition-all duration-300 ${userStats.level >= 10 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    userStats.level >= 5 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                        'bg-gradient-to-r from-blue-400 to-blue-500'
                                    }`}
                                style={{ width: `${energyPercentage}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            {userStats.energyPoints} / {userStats.maxEnergy} para o próximo nível
                        </p>

                        {/* Phase 3 Benefit: Request Moderation */}
                        {userStats.level >= 10 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-600 mb-2">
                                    🏆 <strong>Parabéns!</strong> Você atingiu a Fase 3. Sua experiência pode ajudar outros.
                                </p>
                                <button
                                    onClick={() => alert('Sua solicitação para se tornar Moderador foi enviada para análise!')}
                                    className="w-full py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center"
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Solicitar ser Moderador
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Daily Interactions */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <PulsingHeart color="text-blue-500" size="md" />
                                <span className="ml-3 text-lg font-semibold text-gray-900">Interações Hoje</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">
                                {userStats.dailyInteractions}/{userStats.maxDailyInteractions}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div
                                className="bg-gradient-to-r from-blue-400 to-cyan-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${interactionsPercentage}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                            {userStats.plan === 'free' ? 'Plano Grátis' : 'Plano Premium'}
                        </p>
                    </div>

                    {/* Tasks Completed */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <PulsingHeart color="text-purple-500" size="md" />
                                <span className="ml-3 text-lg font-semibold text-gray-900">Tarefas Hoje</span>
                            </div>
                            <span className="text-2xl font-bold text-purple-600">
                                {completedTasks}/{dailyTasks.length}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div
                                className="bg-gradient-to-r from-purple-400 to-pink-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${(completedTasks / dailyTasks.length) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                            Continue assim! 💪
                        </p>
                    </div>

                    {/* Upgrade Banner for Free Users */}
                    {userStats.plan === 'free' && userStats.dailyInteractions >= userStats.maxDailyInteractions * 0.8 && (
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Está gostando da experiência?</h3>
                                    <p className="text-purple-100 mb-4">
                                        Você está próximo do limite diário. Considere fazer upgrade para acesso ilimitado!
                                    </p>
                                    <Link
                                        to="/plans"
                                        className="inline-flex items-center bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                                    >
                                        Ver Planos
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </div>
                                <PulsingHeart color="text-pink-300" size="xl" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserDashboard;
