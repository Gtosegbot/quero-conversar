import React, { useState, useEffect } from 'react';
import { Play, Clock, Star, Eye, Search, Upload, Youtube } from 'lucide-react';
import PulsingHeart from './PulsingHeart';
import { db, storage } from '../../firebase-config';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface VideoContent {
  id: string;
  title: string;
  description: string;
  video_type: 'youtube' | 'recorded' | 'live';
  youtube_url?: string;
  r2_key?: string; // Legacy field, kept for compatibility
  url?: string; // New field for direct URL
  thumbnail_url?: string;
  duration_minutes?: number;
  category: string;
  is_premium: boolean;
  view_count: number;
  rating: number;
  professional_name: string;
  professional_specialty: string;
  created_at: any;
}

interface VideoLibraryProps {
  userPlan: 'free' | 'premium' | 'enterprise';
  professionalId?: string;
  isManagement?: boolean;
}

const VideoLibrary: React.FC<VideoLibraryProps> = ({
  userPlan,
  professionalId,
  isManagement = false
}) => {
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const categories = [
    { id: 'all', name: 'Todas as Categorias' },
    { id: 'mental', name: 'Saúde Mental' },
    { id: 'physical', name: 'Saúde Física' },
    { id: 'spiritual', name: 'Bem-estar Espiritual' },
    { id: 'nutrition', name: 'Nutrição' },
    { id: 'exercise', name: 'Exercícios' },
    { id: 'meditation', name: 'Meditação' },
    { id: 'therapy', name: 'Terapia' },
  ];

  useEffect(() => {
    // Construct query
    let q = query(collection(db, 'videos'), orderBy('created_at', 'desc'));

    if (professionalId) {
      q = query(collection(db, 'videos'), where('professionalId', '==', professionalId), orderBy('created_at', 'desc'));
    }

    // Note: Firestore doesn't support multiple inequality filters easily, so we filter category and search client-side or use simple equality
    if (selectedCategory !== 'all') {
      q = query(q, where('category', '==', selectedCategory));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videoList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoContent[];
      setVideos(videoList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching videos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [professionalId, selectedCategory]);

  const playVideo = async (video: VideoContent) => {
    // Check if user can access premium content
    if (video.is_premium && userPlan === 'free') {
      alert('Este conteúdo é exclusivo para assinantes Premium. Faça upgrade para acessar!');
      return;
    }

    // Track view
    try {
      const videoRef = doc(db, 'videos', video.id);
      await updateDoc(videoRef, {
        view_count: increment(1)
      });
    } catch (err) {
      console.error("Error updating view count", err);
    }

    // Open video
    if (video.video_type === 'youtube' && video.youtube_url) {
      window.open(video.youtube_url, '_blank');
    } else if (video.url) {
      window.open(video.url, '_blank');
    } else if (video.r2_key) {
      // Legacy fallback
      alert("Vídeo antigo não migrado.");
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.professional_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <PulsingHeart color="text-purple-600" size="xl" className="mx-auto mb-4" />
        <p className="text-gray-600">Carregando vídeos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PulsingHeart color="text-blue-600" size="lg" />
          <h2 className="ml-3 text-2xl font-bold text-gray-900">
            {isManagement ? 'Gerenciar Vídeos' : 'Biblioteca de Vídeos'}
          </h2>
        </div>

        {isManagement && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Adicionar Vídeo
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar vídeos, profissionais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>

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

      {/* Plan Notice for Free Users */}
      {userPlan === 'free' && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
          <div className="flex items-center">
            <PulsingHeart color="text-purple-600" size="md" />
            <div className="ml-3">
              <p className="text-purple-900 font-medium">
                Alguns vídeos são exclusivos para assinantes Premium
              </p>
              <p className="text-purple-700 text-sm">
                Faça upgrade para acessar todo o conteúdo exclusivo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <div key={video.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            {/* Video Thumbnail */}
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    {video.video_type === 'youtube' ? (
                      <Youtube className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    ) : (
                      <Play className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                    )}
                  </div>
                )}
              </div>

              {/* Play Button Overlay */}
              <button
                onClick={() => playVideo(video)}
                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center group"
              >
                <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-purple-600 fill-current" />
                </div>
              </button>

              {/* Premium Badge */}
              {video.is_premium && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  Premium
                </div>
              )}

              {/* Duration */}
              {video.duration_minutes && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {video.duration_minutes} min
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                  {video.title}
                </h3>
                <div className="flex items-center ml-2">
                  {video.video_type === 'youtube' && (
                    <Youtube className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {video.description}
              </p>

              {/* Professional Info */}
              <div className="flex items-center mb-3">
                <PulsingHeart color="text-purple-500" size="sm" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-900">
                    {video.professional_name || 'Profissional'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {video.professional_specialty || 'Especialista'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {video.view_count || 0} visualizações
                </div>

                {video.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                    {video.rating.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="mt-3">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {categories.find(cat => cat.id === video.category)?.name || video.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <PulsingHeart color="text-gray-400" size="xl" className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Nenhum vídeo encontrado
          </h3>
          <p className="text-gray-500">
            Tente ajustar seus filtros ou pesquisar por outros termos.
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <VideoUploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            setShowUploadModal(false);
          }}
          professionalId={professionalId}
        />
      )}
    </div>
  );
};

// Video Upload Modal Component
interface VideoUploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
  professionalId?: string;
}

const VideoUploadModal: React.FC<VideoUploadModalProps> = ({ onClose, onUploadComplete, professionalId }) => {
  const [videoType, setVideoType] = useState<'youtube' | 'recorded'>('youtube');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'mental',
    youtube_url: '',
    is_premium: false,
    duration_minutes: 0,
    thumbnail_url: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = [
    { id: 'mental', name: 'Saúde Mental' },
    { id: 'physical', name: 'Saúde Física' },
    { id: 'spiritual', name: 'Bem-estar Espiritual' },
    { id: 'nutrition', name: 'Nutrição' },
    { id: 'exercise', name: 'Exercícios' },
    { id: 'meditation', name: 'Meditação' },
    { id: 'therapy', name: 'Terapia' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let downloadUrl = '';

      // 1. Upload Video if applicable
      if (videoType === 'recorded' && file) {
        const storagePath = `videos/${professionalId || 'admin'}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        downloadUrl = await getDownloadURL(storageRef);
      }

      // 1b. Upload Thumbnail if applicable
      let thumbnailUrl = formData.thumbnail_url;
      if (thumbnailFile) {
        const thumbPath = `thumbnails/${professionalId || 'admin'}/${Date.now()}_${thumbnailFile.name}`;
        const thumbRef = ref(storage, thumbPath);
        await uploadBytes(thumbRef, thumbnailFile);
        thumbnailUrl = await getDownloadURL(thumbRef);
      } else if (videoType === 'youtube' && formData.youtube_url && !thumbnailUrl) {
        // Auto-extract YouTube thumbnail
        const videoIdMatch = formData.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/.*v=)([^&]+)/);
        if (videoIdMatch && videoIdMatch[1]) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
        }
      }

      // 2. Save to Firestore
      await addDoc(collection(db, 'videos'), {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        video_type: videoType,
        is_premium: formData.is_premium,
        youtube_url: formData.youtube_url,
        url: downloadUrl,
        thumbnail_url: thumbnailUrl,
        duration_minutes: formData.duration_minutes,
        professionalId: professionalId,
        professional_name: 'Você', // Should fetch real name
        professional_specialty: 'Especialista',
        view_count: 0,
        rating: 0,
        created_at: serverTimestamp()
      });

      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Erro ao fazer upload do vídeo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Adicionar Vídeo</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Vídeo
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="youtube"
                    checked={videoType === 'youtube'}
                    onChange={(e) => setVideoType(e.target.value as 'youtube')}
                    className="mr-2"
                  />
                  <Youtube className="w-4 h-4 mr-1 text-red-500" />
                  YouTube
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="recorded"
                    checked={videoType === 'recorded'}
                    onChange={(e) => setVideoType(e.target.value as 'recorded')}
                    className="mr-2"
                  />
                  <Upload className="w-4 h-4 mr-1" />
                  Arquivo Gravado
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Video Source */}
            {videoType === 'youtube' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do YouTube *
                </label>
                <input
                  type="url"
                  required
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo de Vídeo *
                </label>
                <input
                  type="file"
                  required
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            )}

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capa do Vídeo (Thumbnail)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {videoType === 'youtube' ? 'Se não enviar, tentaremos pegar a capa do YouTube automaticamente.' : 'Opcional. Se não enviar, será exibido um ícone padrão.'}
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração (minutos)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            {/* Premium Content */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_premium"
                checked={formData.is_premium}
                onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_premium" className="text-sm font-medium text-gray-700">
                Conteúdo Premium (apenas para assinantes)
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <PulsingHeart color="text-white" size="sm" className="mr-2" />
                    {videoType === 'youtube' ? 'Salvando...' : 'Enviando...'}
                  </>
                ) : (
                  'Adicionar Vídeo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoLibrary;
