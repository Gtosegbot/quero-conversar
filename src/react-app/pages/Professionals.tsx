import React, { useState } from 'react';
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  Video,
  MessageCircle,
  Award,
  Search
} from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';
import AppointmentScheduler from '../components/AppointmentScheduler';
import VideoRoom from '../components/VideoRoom';
import NotificationBanner from '../components/NotificationBanner';
import { db } from '../../firebase-config';
import { collection, query, where, getDocs } from 'firebase/firestore';
interface Professional {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  isOnline: boolean;
  experience: number;
  verified: boolean;
  languages: string[];
  availableSlots: string[];
  avatar: string;
  popularityScore: number;
}

const Professionals: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'price'>('popularity');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<string | null>(null);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Professionals from Firestore
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const usersRef = collection(db, 'users');
        // Fetch both candidates and approved professionals
        const q = query(usersRef, where('role', 'in', ['professional', 'professional_candidate']));
        const snapshot = await getDocs(q);

        const loadedProfessionals: Professional[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Profissional',
            specialty: data.specialty || 'Especialista',
            bio: data.bio || 'Sem descrição disponível.',
            rating: data.rating || 5.0,
            reviewCount: data.reviewCount || 0,
            hourlyRate: data.hourlyRate || 100,
            location: data.location || 'Online',
            isOnline: data.isOnline || false,
            experience: data.experienceYears || 0,
            verified: data.verified || (data.role === 'professional'), // Trust role if verified
            languages: Array.isArray(data.languages) ? data.languages : ['Português'],
            availableSlots: data.availableSlots || ['09:00', '14:00', '16:00'], // Default slots if none
            avatar: data.avatar || '🩺', // Default avatar
            popularityScore: data.popularityScore || 80
          };
        });

        setProfessionals(loadedProfessionals);
      } catch (error) {
        console.error("Error fetching professionals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  const specialties = [
    { id: 'all', name: 'Todas as Especialidades' },
    { id: 'Psicologia Clínica', name: 'Psicólogos' },
    { id: 'Psiquiatria', name: 'Psiquiatras' },
    { id: 'Coach', name: 'Coaches' },
    { id: 'Nutricionista', name: 'Nutricionistas' },
    { id: 'Personal Trainer', name: 'Personal Trainers' },
    { id: 'Terapeuta Holístico', name: 'Terapeutas Holísticos' }
  ];

  const filteredProfessionals = professionals
    .filter(prof => {
      const matchesSearch = prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.bio.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty = selectedSpecialty === 'all' ||
        prof.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
      return matchesSearch && matchesSpecialty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.hourlyRate - b.hourlyRate;
        case 'popularity':
        default:
          return b.popularityScore - a.popularityScore;
      }
    });

  const handleScheduleConsultation = (professional: Professional) => {
    setSelectedProfessional(professional);
    setShowScheduler(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <PulsingHeart color="text-orange-600" size="lg" />
            <h1 className="ml-3 text-3xl font-bold text-gray-900">Profissionais</h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Conecte-se com especialistas qualificados em saúde física, mental e espiritual
          </p>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar profissionais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              {specialties.map(specialty => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="popularity">Mais Populares</option>
              <option value="rating">Melhor Avaliação</option>
              <option value="price">Menor Preço</option>
            </select>
          </div>
        </div>

        {/* Admin Notifications */}
        <NotificationBanner pageSection="professionals" />

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <PulsingHeart color="text-purple-600" size="xl" />
            <p className="ml-3 text-gray-500">Buscando especialistas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProfessionals.map((professional) => (
              <div key={professional.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                {/* Professional Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-2xl">
                      {professional.avatar}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-xl font-bold text-gray-900">{professional.name}</h3>
                        {professional.verified && (
                          <Award className="w-5 h-5 text-blue-500 ml-2" title="Profissional Verificado" />
                        )}
                      </div>
                      <p className="text-purple-600 font-medium">{professional.specialty}</p>
                      <div className="flex items-center mt-1">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600">{professional.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center">
                      {professional.isOnline && (
                        <div className="flex items-center mr-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                          <span className="text-xs text-green-600 font-medium">Online</span>
                        </div>
                      )}
                      <PulsingHeart
                        color="text-orange-500"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{professional.bio}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium text-gray-900">
                      {professional.rating} ({professional.reviewCount} avaliações)
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      {professional.experience > 0 ? `${professional.experience} anos exp.` : 'Iniciante'}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-gray-900">
                      R$ {professional.hourlyRate}/hora
                    </span>
                  </div>

                  <div className="flex items-center">
                    <PulsingHeart color="text-purple-500" size="sm" className="mr-1" />
                    <span className="text-sm text-gray-600">
                      {professional.popularityScore}% popularidade
                    </span>
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {professional.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Available Slots */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Horários disponíveis hoje:</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.availableSlots.map((slot, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleScheduleConsultation(professional)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Agendar
                  </button>

                  <button
                    onClick={() => alert('Função de chat em desenvolvimento')}
                    className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-200 flex items-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProfessionals.length === 0 && !loading && (
          <div className="text-center py-12">
            <PulsingHeart color="text-gray-400" size="xl" className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhum profissional encontrado
            </h3>
            <p className="text-gray-500">
              Tente ajustar seus filtros ou pesquisar por outros termos.
            </p>
          </div>
        )}

        {/* Gamification Info */}
        <div className="mt-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <PulsingHeart color="text-purple-600" size="md" />
            <h2 className="ml-3 text-xl font-bold text-gray-900">Para Profissionais</h2>
          </div>
          <p className="text-gray-700 mb-4">
            <strong>Ganhe Popularidade Ajudando Gratuitamente:</strong> Quanto mais você participa
            da comunidade e ajuda outros usuários, mais sua popularidade cresce e mais você é
            indicado para consultas pagas.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <PulsingHeart color="text-green-500" size="sm" className="mr-2" />
              <span>Rateio justo: 80% para você, 20% para a plataforma</span>
            </div>
            <div className="flex items-center">
              <PulsingHeart color="text-blue-500" size="sm" className="mr-2" />
              <span>Preços populares para atingir mais pessoas</span>
            </div>
            <div className="flex items-center">
              <PulsingHeart color="text-purple-500" size="sm" className="mr-2" />
              <span>Sistema de autoridade baseado em contribuições</span>
            </div>
          </div>
        </div>

        {/* Appointment Scheduler Modal */}
        {showScheduler && selectedProfessional && (
          <AppointmentScheduler
            professional={selectedProfessional}
            onClose={() => {
              setShowScheduler(false);
              setSelectedProfessional(null);
            }}
          />
        )}

        {/* Video Call Room */}
        {activeAppointment && (
          <VideoRoom
            appointmentId={activeAppointment}
            userType="patient"
            onLeave={() => setActiveAppointment(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Professionals;
