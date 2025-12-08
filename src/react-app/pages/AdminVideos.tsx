import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Video, Plus, Edit, Trash2 } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase-config';

interface VideoContent {
    id: string;
    title: string;
    description: string;
    url: string;
    category: string;
    createdAt: any;
}

const AdminVideos: React.FC = () => {
    const [videos, setVideos] = useState<VideoContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newVideo, setNewVideo] = useState({
        title: '',
        description: '',
        url: '',
        category: 'professional'
    });

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            const videosRef = collection(db, 'videos');
            const snapshot = await getDocs(videosRef);

            const videosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as VideoContent));

            setVideos(videosData);
        } catch (error) {
            console.error('Error loading videos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const videosRef = collection(db, 'videos');
            await addDoc(videosRef, {
                ...newVideo,
                createdAt: new Date()
            });

            setNewVideo({ title: '', description: '', url: '', category: 'professional' });
            setShowAddForm(false);
            loadVideos();
        } catch (error) {
            console.error('Error adding video:', error);
            alert('Erro ao adicionar vídeo');
        }
    };

    const handleDeleteVideo = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;

        try {
            await deleteDoc(doc(db, 'videos', id));
            loadVideos();
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('Erro ao excluir vídeo');
        }
    };

    return (
        <div className=\"min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8\">
            < div className =\"max-w-7xl mx-auto\">
    {/* Header */ }
    <div className=\"mb-8\">
        < Link
    to =\"/admin\"
    className =\"inline-flex items-center text-blue-600 hover:text-blue-700 mb-4\"
        >
        <ArrowLeft className=\"w-5 h-5 mr-2\" />
            Voltar ao Admin
          </Link >
    <div className=\"flex items-center justify-between\">
        < h1 className =\"text-3xl font-bold text-gray-900 flex items-center\">
            < Video className =\"w-8 h-8 mr-3 text-blue-600\" />
              Biblioteca de Vídeos
            </h1 >
    <button
        onClick={() => setShowAddForm(!showAddForm)}
        className=\"bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center\"
            >
            <Plus className=\"w-5 h-5 mr-2\" />
              Adicionar Vídeo
            </button >
          </div >
        </div >

    {/* Add Form */ }
{
    showAddForm && (
        <div className=\"bg-white rounded-xl shadow-lg p-6 mb-6\">
            < h2 className =\"text-xl font-bold text-gray-900 mb-4\">Novo Vídeo</h2>
                < form onSubmit = { handleAddVideo } className =\"space-y-4\">
                    < div >
                    <label className=\"block text-sm font-medium text-gray-700 mb-2\">
    Título
                </label >
        <input
            type=\"text\"
    required
    value = { newVideo.title }
    onChange = {(e) => setNewVideo({ ...newVideo, title: e.target.value })
}
className =\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
    />
              </div >
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Descrição
                </label>
                <textarea
                  required
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  rows={3}
                  className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
    />
              </div >
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  URL do Vídeo
                </label>
                <input
                  type=\"url\"
required
value = { newVideo.url }
onChange = {(e) => setNewVideo({ ...newVideo, url: e.target.value })}
placeholder =\"https://youtube.com/watch?v=...\"
className =\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
    />
              </div >
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-2\">
                  Categoria
                </label>
                <select
                  value={newVideo.category}
                  onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })}
                  className=\"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"
    >
    <option value=\"professional\">Vídeos Profissionais</option>
        < option value =\"educational\">Vídeos Educacionais</option>
                </select >
              </div >
    <div className=\"flex gap-4\">
        < button
type =\"submit\"
className =\"bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors\"
    >
    Salvar
                </button >
    <button
        type=\"button\"
onClick = {() => setShowAddForm(false)}
className =\"bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors\"
    >
    Cancelar
                </button >
              </div >
            </form >
          </div >
        )}

{/* Videos List */ }
<div className=\"bg-white rounded-xl shadow-lg p-6\">
{
    loading ? (
        <div className=\"text-center py-8\">
            < div className =\"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto\"></div>
                < p className =\"mt-4 text-gray-600\">Carregando vídeos...</p>
            </div >
          ) : videos.length === 0 ? (
        <div className=\"text-center py-8\">
            < Video className =\"w-16 h-16 text-gray-300 mx-auto mb-4\" />
                < p className =\"text-gray-600\">Nenhum vídeo cadastrado</p>
            </div >
          ) : (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
    {
        videos.map((video) => (
            <div key={video.id} className=\"border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow\">
        < div className =\"aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center\">
        < Video className =\"w-12 h-12 text-gray-400\" />
                  </div >
            <h3 className=\"font-semibold text-gray-900 mb-2\">{video.title}</h3>
        < p className =\"text-sm text-gray-600 mb-3 line-clamp-2\">{video.description}</p>
        < div className =\"flex items-center justify-between\">
        < span className = {`text-xs px-2 py-1 rounded-full ${video.category === 'professional'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
                { video.category === 'professional' ? 'Profissional' : 'Educacional' }
                    </span >
        <button
            onClick={() => handleDeleteVideo(video.id)}
            className=\"text-red-600 hover:text-red-700 p-2\"
                >
                <Trash2 className=\"w-4 h-4\" />
                    </button >
                  </div >
                </div >
              ))
}
            </div >
          )}
        </div >

    {/* Stats */ }
    < div className =\"mt-6 grid grid-cols-1 md:grid-cols-2 gap-6\">
        < div className =\"bg-white rounded-xl shadow-lg p-6\">
            < div className =\"text-sm text-gray-600\">Vídeos Profissionais</div>
                < div className =\"text-3xl font-bold text-blue-600\">
{ videos.filter(v => v.category === 'professional').length }
            </div >
          </div >
    <div className=\"bg-white rounded-xl shadow-lg p-6\">
        < div className =\"text-sm text-gray-600\">Vídeos Educacionais</div>
            < div className =\"text-3xl font-bold text-green-600\">
{ videos.filter(v => v.category === 'educational').length }
            </div >
          </div >
        </div >
      </div >
    </div >
  );
};

export default AdminVideos;
