import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { auth, db } from '../../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// Import Role-Based Dashboards
import UserDashboard from '../components/dashboard/UserDashboard';
import PartnerDashboard from '../components/dashboard/PartnerDashboard';
import ProfessionalDashboard from '../components/dashboard/ProfessionalDashboard';
import EnterpriseDashboard from '../components/dashboard/EnterpriseDashboard';
import NotificationBanner from '../components/NotificationBanner';

interface UserStats {
  level: number;
  energyPoints: number;
  maxEnergy: number;
  dailyInteractions: number;
  maxDailyInteractions: number;
  plan: 'free' | 'premium' | 'enterprise';
  role?: 'user' | 'partner' | 'professional' | 'admin';
  companyId?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  // Dashboard View Mode for Admins
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'professional' | 'partner'>('admin');
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    energyPoints: 0,
    maxEnergy: 1000,
    dailyInteractions: 0,
    maxDailyInteractions: 15,
    plan: 'free',
    role: 'user'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Auth & User Data Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Listen to User Stats
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserStats;
            const superAdminEmails = ['gtosegbot@', 'admgtoseg@', 'disparoseguroback@gmail.com'];
            const isSuperAdmin = superAdminEmails.some(email => currentUser.email?.includes(email));

            setUserStats({
              ...data,
              role: isSuperAdmin ? 'admin' : data.role,
              plan: isSuperAdmin ? 'enterprise' : data.plan,
            });
          } else {
            // Initialize user if not exists
            setDoc(userRef, {
              level: 1,
              energyPoints: 0,
              maxEnergy: 1000,
              dailyInteractions: 0,
              maxDailyInteractions: 15,
              plan: 'free',
              role: 'user',
              email: currentUser.email,
              name: currentUser.displayName
            });
          }
          setIsLoading(false);
        });

        return () => unsubscribeUser();
      } else {
        navigate('/');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando seu espaço...</p>
        </div>
      </div>
    );
  }

  // Dashboard View Mode for Admins
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'professional' | 'partner'>('admin');

  // Role-Based Rendering
  const renderDashboard = () => {
    // Admin Override View
    if (userStats.role === 'admin' || userStats.role === 'super_admin') {
      if (adminViewMode === 'professional') return <ProfessionalDashboard user={user} userStats={userStats} />;
      if (adminViewMode === 'partner') return <PartnerDashboard user={user} userStats={userStats} />;
      // Default Admin View (Enterprise)
      return <EnterpriseDashboard user={user} />;
    }

    // Standard User Views
    switch (userStats.role) {
      case 'partner':
        return <PartnerDashboard user={user} userStats={userStats} />;
      case 'professional':
        return <ProfessionalDashboard user={user} userStats={userStats} />;
      case 'user':
      default:
        return <UserDashboard user={user} userStats={userStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Common Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta, {user?.displayName?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-600">
              {adminViewMode === 'professional' ? 'Modo de Visualização: Profissional' :
                adminViewMode === 'partner' ? 'Modo de Visualização: Parceiro' :
                  userStats.role === 'professional' ? 'Sua agenda e pacientes estão prontos.' :
                    userStats.role === 'partner' ? 'Gerencie seus produtos e impacto.' :
                      'Continue sua jornada de crescimento.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Admin View Switcher */}
            {(userStats.role === 'admin' || user.email?.includes('gtosegbot@') || user.email?.includes('admgtoseg@')) && (
              <div className="bg-white p-2 rounded-lg shadow-sm border border-purple-100">
                <label className="text-xs text-purple-800 font-bold block mb-1">Visualizar como:</label>
                <select
                  value={adminViewMode}
                  onChange={(e) => setAdminViewMode(e.target.value as any)}
                  className="text-sm border-none bg-purple-50 rounded text-purple-900 focus:ring-0 cursor-pointer"
                >
                  <option value="admin">Administrador</option>
                  <option value="professional">Profissional</option>
                  <option value="partner">Parceiro</option>
                </select>
              </div>
            )}

            {/* Admin/Moderator Link */}
            {(user.email?.includes('gtosegbot@') || user.email?.includes('admgtoseg@')) && (
              <button
                onClick={() => navigate('/admin')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Painel Admin
              </button>
            )}
          </div>
        </div>

        {/* Admin Notifications - INTEGRAÇÃO DO SISTEMA DE AVISOS */}
        <NotificationBanner pageSection="dashboard" />

        {/* Role-Based Dashboard Content */}
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;
