import React, { useState, useEffect } from 'react';
import { Play, FileText, Search, Filter, Lock } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase-config';

interface ContentItem {
    id: string;
    title: string;
    description: string;
    type: 'video' | 'article';
    category: string;
    url: string;
    thumbnailUrl?: string;
    authorName: string;
    createdAt: any;
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
            const q = query(collection(db, 'content_library'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem));
            setContent(items);
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
                        <p className="text-gray-600 mt-2">Artigos e vídeos exclusivos para seu desenvolvimento.</p>
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
                            <Play className="w-4 h-4 mr-2" /> Vídeos
                        </button>
                        <button
                            onClick={() => setFilterType('article')}
                            className={`px-4 py-2 rounded-lg flex items-center ${filterType === 'article' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <FileText className="w-4 h-4 mr-2" /> Artigos
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-12">Carregando...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContent.map(item => (
                            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="h-48 bg-gray-200 relative">
                                    {item.thumbnailUrl ? (
                                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                                            {item.type === 'video' ? <Play className="w-12 h-12 text-purple-400" /> : <FileText className="w-12 h-12 text-blue-400" />}
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs uppercase font-bold">
                                        {item.type === 'video' ? 'Vídeo' : 'Artigo'}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wide">
                                        {item.category}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                        <span className="text-sm text-gray-500">Por {item.authorName}</span>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                                        >
                                            Acessar Conteúdo &rarr;
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
