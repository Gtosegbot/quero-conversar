import React, { useState, useEffect } from 'react';
import {
  User,
  Edit,
  Camera,
  Calendar,
  FileText,
  Video,
  Star,
  Settings,
  Loader2
} from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';
import DocumentUpload from '../components/DocumentUpload';
import VideoLibrary from '../components/VideoLibrary';

import { db, auth, storage } from '../../firebase-config';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  plan: 'free' | 'premium';
  avatar?: string;
  bio?: string;
  phone?: string;
  created_at: string;
}

interface ProfessionalProfile {
  id: string;
  specialty: string;
  bio: string;
  hourly_rate: number;
  location?: string;
  experience_years: number;
  is_verified: boolean;
  languages?: string;
  popularity_score: number;
}

interface UserStats {
  total_consultations: number;
  total_videos_watched: number;
  total_documents_uploaded: number;
  streak_days: number;
  level: number;
  energy_points: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'videos' | 'appointments'>('profile');
  const [isProfessional, setIsProfessional] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. User Profile Listener
    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          id: data.uid || user.uid,
          name: data.name || user.displayName || 'Usuário',
          email: data.email || user.email || '',
          age: data.age,
          plan: data.plan || 'free',
          avatar: data.avatar || user.photoURL,
          bio: data.bio,
          phone: data.phone,
          created_at: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        });

        // Check professional status
        if (data.role === 'professional') {
          setIsProfessional(true);
          setProfessionalProfile({
            id: data.uid,
            specialty: data.specialty || 'Geral',
            bio: data.professionalBio || data.bio || '',
            hourly_rate: data.hourlyRate || 150,
            experience_years: data.experienceYears || 0,
            is_verified: data.verified || false,
            location: data.location,
            languages: data.languages,
            popularity_score: data.popularityScore || 100
          });
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setLoading(false);
    });

    // 2. Stats Listener (Mocked for now, but ready for real data)
    setUserStats({
      total_consultations: 0,
      total_videos_watched: 0,
      total_documents_uploaded: 0,
      streak_days: 1,
      level: 1,
      energy_points: 0
    });

    return () => {
      unsubscribeUser();
    };
  }, []);

  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, 'users', user.uid), updatedData);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil.');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) return;

    setUploadingAvatar(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), { avatar: downloadUrl });

    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Erro ao atualizar foto de perfil.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const becomeProfessional = () => {
    navigate('/register-professional');
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'documents', name: 'Documentos', icon: FileText },
    { id: 'videos', name: 'Vídeos', icon: Video },
    { id: 'appointments', name: 'Consultas', icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <PulsingHeart color="text-purple-600" size="xl" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Carregando perfil...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                  {uploadingAvatar ? (
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  ) : userProfile?.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-purple-600" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors cursor-pointer shadow-sm">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>

              {/* User Info */}
              <div className="ml-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {userProfile?.name}
                </h1>
                <p className="text-gray-600 mb-2">{userProfile?.email}</p>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${userProfile?.plan === 'premium'
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}>
                    {userProfile?.plan === 'premium' ? 'Premium' : 'Gratuito'}
                  </span>
                  {isProfessional && professionalProfile?.is_verified && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Profissional Verificado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {!isProfessional && (
                <button
                  onClick={becomeProfessional}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Ser Profissional
                </button>
              )}
              <button
                onClick={() => setEditing(!editing)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <PulsingHeart color="text-purple-600" size="md" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-purple-900">{userStats.level}</p>
                    <p className="text-sm text-purple-700">Nível</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-green-900">{userStats.total_consultations}</p>
                    <p className="text-sm text-green-700">Consultas</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Video className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-blue-900">{userStats.total_videos_watched}</p>
                    <p className="text-sm text-blue-700">Vídeos Assistidos</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-orange-900">{userStats.total_documents_uploaded}</p>
                    <p className="text-sm text-orange-700">Documentos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Professional Profile Section */}
        {isProfessional && professionalProfile && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Star className="w-6 h-6 text-yellow-500 mr-2" />
              Perfil Profissional
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Especialidade</label>
                  <p className="text-lg font-semibold text-gray-900">{professionalProfile.specialty}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Experiência</label>
                  <p className="text-lg font-semibold text-gray-900">{professionalProfile.experience_years} anos</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Valor por Hora</label>
                  <p className="text-lg font-semibold text-green-600">R$ {professionalProfile.hourly_rate.toFixed(2)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Popularidade</label>
                  <p className="text-lg font-semibold text-purple-600">{professionalProfile.popularity_score}%</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Localização</label>
                  <p className="text-lg font-semibold text-gray-900">{professionalProfile.location || 'Online'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Idiomas</label>
                  <p className="text-lg font-semibold text-gray-900">{professionalProfile.languages || 'Português'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Bio Profissional</label>
              <p className="text-gray-600 mt-1">{professionalProfile.bio}</p>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <ProfileEditForm
                profile={userProfile}
                editing={editing}
                onSave={handleProfileUpdate}
                onCancel={() => setEditing(false)}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentUpload
                userType={isProfessional ? 'professional' : 'patient'}
                userId={userProfile?.id}
                professionalId={isProfessional ? professionalProfile?.id : undefined}
              />
            )}

            {activeTab === 'videos' && (
              <VideoLibrary
                userPlan={userProfile?.plan || 'free'}
                professionalId={isProfessional ? professionalProfile?.id : undefined}
                isManagement={isProfessional}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsList userId={userProfile?.id} isProfessional={isProfessional} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Edit Form Component
interface ProfileEditFormProps {
  profile: UserProfile | null;
  editing: boolean;
  onSave: (data: Partial<UserProfile>) => void;
  onCancel: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profile,
  editing,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    age: profile?.age || '',
    bio: profile?.bio || '',
    phone: profile?.phone || '',
  });

  // Update form data when profile changes (e.g. initial load)
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        age: profile.age || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      age: typeof formData.age === 'string' ? parseInt(formData.age) || undefined : formData.age
    };
    onSave(submitData);
  };

  if (!editing) {
    return (
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Nome Completo</label>
          <p className="text-lg text-gray-900">{profile?.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">E-mail</label>
          <p className="text-lg text-gray-900">{profile?.email}</p>
        </div>

        {profile?.age && (
          <div>
            <label className="text-sm font-medium text-gray-700">Idade</label>
            <p className="text-lg text-gray-900">{profile.age} anos</p>
          </div>
        )}

        {profile?.bio && (
          <div>
            <label className="text-sm font-medium text-gray-700">Sobre mim</label>
            <p className="text-gray-900">{profile.bio}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">Membro desde</label>
          <p className="text-lg text-gray-900">
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome Completo
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          E-mail
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Idade
        </label>
        <input
          type="number"
          min="13"
          max="120"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || '' })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Telefone
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sobre mim
        </label>
        <textarea
          rows={4}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          placeholder="Conte um pouco sobre você..."
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
        >
          Salvar Alterações
        </button>
      </div>
    </form>
  );
};

// Appointments List Component
interface AppointmentsListProps {
  userId?: string;
  isProfessional: boolean;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({ userId, isProfessional }) => {
  const [appointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data or simple query for now to prevent crash
    // In real implementation: query(collection(db, 'appointments'), where('userId', '==', userId))
    setLoading(false);
  }, [userId, isProfessional]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <PulsingHeart color="text-purple-600" size="lg" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          Nenhuma consulta agendada
        </h3>
        <p className="text-gray-500">
          {isProfessional
            ? 'Seus pacientes ainda não agendaram consultas.'
            : 'Você ainda não agendou nenhuma consulta.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {isProfessional ? 'Consultas Agendadas' : 'Minhas Consultas'}
      </h3>

      {/* Appointments would be rendered here */}
      <div className="text-center py-8">
        <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
      </div>
    </div>
  );
};

export default Profile;
