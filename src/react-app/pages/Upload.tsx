import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Check, AlertTriangle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase-config';

const Upload: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'article',
        category: 'mental',
        url: '',
        thumbnailUrl: ''
    });

    useEffect(() => {
        // Check permissions
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = localStorage.getItem('userRole');

        const allowedRoles = ['admin', 'professional', 'partner'];
        const isSuperAdmin = ['gtosegbot@', 'admgtoseg@', 'disparoseguroback@gmail.com'].some(email => user.email?.includes(email));

        if (!isSuperAdmin && !allowedRoles.includes(role || '')) {
            alert('Acesso restrito a Profissionais e Parceiros.');
            navigate('/dashboard');
        }
    }, [navigate]);

    const getVideoId = (url: string) => {
        try {
            if (url.includes('youtu.be')) return new URL(url).pathname.slice(1);
            return new URL(url).searchParams.get('v') || '';
        } catch { return ''; }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            await addDoc(collection(db, 'partner_content'), {
                partnerId: user.uid, // Changed from authorId to match schema
                title: formData.title,
                description: formData.description,
                type: formData.type, // 'article' or 'video'
                category: formData.category,
                videoUrl: formData.type === 'video' ? formData.url : '', // Map based on type
                link: formData.type === 'article' ? formData.url : '',
                thumbnailUrl: formData.thumbnailUrl || (formData.type === 'video' ? `https://img.youtube.com/vi/${getVideoId(formData.url)}/hqdefault.jpg` : ''),
                authorName: user.displayName || 'Parceiro',
                views: 0,
                likes: 0,
                createdAt: serverTimestamp()
            });

            alert('Conteúdo publicado com sucesso!');
            navigate('/gallery');
        } catch (error) {
            console.error("Error uploading content:", error);
            alert('Erro ao publicar conteúdo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-8">
                    <div className="p-3 bg-purple-100 rounded-full mr-4">
                        <UploadIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Publicar Conteúdo</h1>
                        <p className="text-gray-600">Compartilhe conhecimento com a comunidade.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Ex: Como lidar com a ansiedade"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Breve resumo do conteúdo..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conteúdo</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="article">Artigo / Texto</option>
                                <option value="video">Vídeo</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="mental">Saúde Mental</option>
                                <option value="physical">Saúde Física</option>
                                <option value="spiritual">Espiritualidade</option>
                                <option value="career">Carreira & Propósito</option>
                                <option value="relationships">Relacionamentos</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL do Conteúdo</label>
                        <input
                            type="url"
                            required
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="https://..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Link para o artigo, PDF ou vídeo (YouTube/Vimeo).</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem de Capa (Opcional)</label>
                        <input
                            type="url"
                            value={formData.thumbnailUrl}
                            onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? 'Publicando...' : 'Publicar Conteúdo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Upload;
