import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MessageCircle,
  Clock,
  Heart,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';
import NotificationBanner from '../components/NotificationBanner';

interface CommunityRoom {
  id: string;
  name: string;
  description: string;
  category: 'mental' | 'physical' | 'spiritual' | 'general';
  memberCount: number;
  lastActivity: string;
  isActive: boolean;
}

// Firestore References
import { collection, query, where, onSnapshot, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase-config';

const Community: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [communityRooms, setCommunityRooms] = useState<CommunityRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'community_rooms'), orderBy('memberCount', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityRoom[];
      setCommunityRooms(rooms);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = [
    { id: 'all', name: 'Todas', color: 'text-gray-600' },
    { id: 'mental', name: 'Saúde Mental', color: 'text-purple-600' },
    { id: 'physical', name: 'Saúde Física', color: 'text-green-600' },
    { id: 'spiritual', name: 'Espiritualidade', color: 'text-blue-600' },
    { id: 'general', name: 'Geral', color: 'text-orange-600' }
  ];

  const filteredRooms = communityRooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mental': return 'text-purple-600';
      case 'physical': return 'text-green-600';
      case 'spiritual': return 'text-blue-600';
      case 'general': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'mental': return 'bg-purple-100';
      case 'physical': return 'bg-green-100';
      case 'spiritual': return 'bg-blue-100';
      case 'general': return 'bg-orange-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <PulsingHeart color="text-green-600" size="lg" />
            <h1 className="ml-3 text-3xl font-bold text-gray-900">Comunidade</h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Conecte-se com pessoas que entendem sua jornada. Compartilhe, apoie e cresça juntos.
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar salas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <PulsingHeart color="text-purple-600" size="md" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Membros Ativos</p>
                <p className="text-2xl font-bold text-gray-900">1,170</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <PulsingHeart color="text-green-600" size="md" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Salas Disponíveis</p>
                <p className="text-2xl font-bold text-gray-900">{communityRooms.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <PulsingHeart color="text-blue-600" size="md" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Mensagens Hoje</p>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
              </div>
            </div>
          </div>
        </div>

        {/* Community Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Link
              key={room.id}
              to={`/community/${room.id}`}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <PulsingHeart color={getCategoryColor(room.category)} size="md" />
                  <div className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getCategoryBg(room.category)} ${getCategoryColor(room.category)}`}>
                    {room.category === 'mental' ? 'Mental' :
                      room.category === 'physical' ? 'Físico' :
                        room.category === 'spiritual' ? 'Espiritual' : 'Geral'}
                  </div>
                </div>

                {room.isActive && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="ml-1 text-xs text-green-600 font-medium">Ativo</span>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{room.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{room.memberCount} membros</span>
                </div>

                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{room.lastActivity}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-purple-600">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Participar</span>
                </div>

                <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" />
              </div>
            </Link>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <PulsingHeart color="text-gray-400" size="xl" className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhuma sala encontrada
            </h3>
            <p className="text-gray-500">
              Tente ajustar seus filtros ou criar uma nova sala para sua comunidade.
            </p>
          </div>
        )}

        {/* Create Room Button */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-4">
          {/* Seed Button (Admin Only) */}
          <button
            onClick={async () => {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              const isSuperAdmin = ['gtosegbot@', 'admgtoseg@', 'disparoseguroback@gmail.com'].some(email => user.email?.includes(email));

              if (!isSuperAdmin) return;

              if (!confirm('Criar 6 salas padrão?')) return;

              const defaultRooms = [
                { name: 'Ansiedade e Pânico', description: 'Espaço seguro para compartilhar experiências e técnicas de superação.', category: 'mental' },
                { name: 'Depressão e Solidão', description: 'Você não está sozinho. Apoio mútuo e acolhimento.', category: 'mental' },
                { name: 'Relacionamentos', description: 'Conversas sobre amor, família e amizades.', category: 'general' },
                { name: 'Carreira e Propósito', description: 'Discuta desafios profissionais e encontre seu caminho.', category: 'general' },
                { name: 'Mindfulness e Meditação', description: 'Práticas de atenção plena para o dia a dia.', category: 'spiritual' },
                { name: 'Saúde Física e Bem-estar', description: 'Dicas de alimentação, exercícios e sono.', category: 'physical' }
              ];

              try {
                for (const room of defaultRooms) {
                  await addDoc(collection(db, 'community_rooms'), {
                    ...room,
                    memberCount: 0,
                    lastActivity: 'Agora',
                    isActive: true,
                    createdAt: new Date()
                  });
                }
                alert('Salas criadas com sucesso!');
              } catch (error) {
                console.error('Error seeding rooms:', error);
                alert('Erro ao criar salas.');
              }
            }}
            className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-900 transition-all"
            title="Criar Salas Padrão (Admin)"
          >
            <Filter className="w-6 h-6" />
          </button>

          {/* Create Room Button */}
          <button
            onClick={async () => {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              const role = localStorage.getItem('userRole');
              const isSuperAdmin = ['gtosegbot@', 'admgtoseg@', 'disparoseguroback@gmail.com'].some(email => user.email?.includes(email));
              const canCreate = isSuperAdmin || role === 'professional' || role === 'partner';

              if (!canCreate) {
                alert('A criação de novas salas é exclusiva para Profissionais e Parceiros.');
                return;
              }

              const name = prompt('Nome da nova sala:');
              if (!name) return;

              const description = prompt('Descrição da sala:');
              if (!description) return;

              const category = prompt('Categoria (mental, physical, spiritual, general):')?.toLowerCase();
              if (!category || !['mental', 'physical', 'spiritual', 'general'].includes(category)) {
                alert('Categoria inválida.');
                return;
              }

              try {
                await addDoc(collection(db, 'community_rooms'), {
                  name,
                  description,
                  category,
                  memberCount: 1,
                  lastActivity: 'Agora',
                  isActive: true,
                  createdAt: new Date(),
                  createdBy: user.uid
                });
                alert('Sala criada com sucesso!');
              } catch (error) {
                console.error('Error creating room:', error);
                alert('Erro ao criar sala.');
              }
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Community;
