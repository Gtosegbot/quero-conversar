import React, { useState, useEffect } from 'react';
import { Play, FileText, Search, Filter, Lock, Package, DollarSign } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase-config';

interface ContentItem {
    id: string;
    title: string;
    description: string;
    type: 'video' | 'article';
    category: string;
    url?: string;
    videoUrl?: string; // Para vídeos
    link?: string; // Para produtos
    thumbnailUrl?: string;
    imageUrl?: string; // Para produtos
    authorName: string;
    createdAt: any;
    isPaid?: boolean;
    price?: number;
}

const Gallery: React.FC = () => {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'video' | 'article'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            const [contentSnap, productsSnap] = await Promise.all([
                getDocs(query(collection(db, 'partner_content'), orderBy('createdAt', 'desc'))),
                getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')))
            ]);

            const freeItems = contentSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'video', // Assumindo vídeo para partner_content por enquanto
                isPaid: false
            })) as ContentItem[];

            const paidItems = productsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: doc.data().category === 'course' ? 'video' : 'article',
                isPaid: true
            })) as ContentItem[];

            setContent([...freeItems, ...paidItems]);
        } catch (error) {
            console.error("Error loading content:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredContent = content.filter(item => {
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Galeria de Conteúdo</h1>
                        <p className="text-gray-600 mt-2">Artigos, vídeos e cursos para seu desenvolvimento.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar conteúdos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-lg ${filterType === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterType('video')}
                            className={`px-4 py-2 rounded-lg flex items-center ${filterType === 'video' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <Play className="w-4 h-4 mr-2" /> Vídeos/Cursos
                        </button>
                        <button
                            onClick={() => setFilterType('article')}
                            className={`px-4 py-2 rounded-lg flex items-center ${filterType === 'article' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <FileText className="w-4 h-4 mr-2" /> E-books/Artigos
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-12">Carregando...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContent.map(item => (
                            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                                <div className="h-48 bg-gray-200 relative">
                                    {item.thumbnailUrl || item.imageUrl ? (
                                        <img src={item.thumbnailUrl || item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                                            {item.type === 'video' ? <Play className="w-12 h-12 text-purple-400" /> : <Package className="w-12 h-12 text-blue-400" />}
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex space-x-2">
                                        <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs uppercase font-bold backdrop-blur-sm">
                                            {item.type === 'video' ? 'Vídeo' : 'Material'}
                                        </span>
                                        {item.isPaid && item.price && (
                                            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs uppercase font-bold shadow-sm">
                                                R$ {item.price}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                                            {item.category || (item.isPaid ? 'Premium' : 'Gratuito')}
                                        </div>
                                        {item.isPaid ? (
                                            <div className="flex items-center text-amber-600 text-xs font-bold">
                                                <DollarSign className="w-3 h-3 mr-1" />
                                                Comprar
                                            </div>
                                        ) : (
                                            <span className="text-green-600 text-xs font-bold">Gratuito</span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                        <span className="text-sm text-gray-500 truncate max-w-[120px]">
                                            {item.authorName || 'Parceiro'}
                                        </span>
                                        <a
                                            href={item.videoUrl || item.link || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`font-medium text-sm flex items-center ${item.isPaid
                                                ? 'text-white bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700'
                                                : 'text-purple-600 hover:text-purple-800'
                                                }`}
                                        >
                                            {item.isPaid ? 'Adquirir Agora' : 'Acessar Conteúdo'}
                                            {!item.isPaid && <span className="ml-1">&rarr;</span>}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredContent.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        Nenhum conteúdo encontrado.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gallery;
