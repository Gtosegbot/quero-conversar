import React, { useState } from 'react';
import { Video, X, Loader2, Link as LinkIcon } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../../firebase-config';

interface ContentUploadFormProps {
    userId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const ContentUploadForm: React.FC<ContentUploadFormProps> = ({ userId, onSuccess, onCancel }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        videoUrl: '', // YouTube/Vimeo link
        thumbnailUrl: '' // Optional custom thumb
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Check content limit (Max 15 items per partner for now)
            const countQuery = query(
                collection(db, 'partner_content'),
                where('partnerId', '==', userId)
            );
            const snapshot = await getCountFromServer(countQuery);
            const currentCount = snapshot.data().count;

            if (currentCount >= 15) {
                alert("Você atingiu o limite de 15 vídeos/conteúdos. Remova alguns itens antigos para publicar novos.");
                setIsLoading(false);
                return;
            }

            // Basic validation for YouTube links
            let videoId = '';
            if (formData.videoUrl.includes('youtube.com') || formData.videoUrl.includes('youtu.be')) {
                // Extract ID logic (simplified)
                const url = new URL(formData.videoUrl);
                if (url.hostname === 'youtu.be') {
                    videoId = url.pathname.slice(1);
                } else {
                    videoId = url.searchParams.get('v') || '';
                }
            }

            await addDoc(collection(db, 'partner_content'), {
                partnerId: userId,
                title: formData.title,
                description: formData.description,
                videoUrl: formData.videoUrl,
                videoId, // Store ID for embedding
                thumbnailUrl: formData.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                views: 0,
                likes: 0,
                createdAt: serverTimestamp()
            });

            onSuccess();
        } catch (error) {
            console.error("Error uploading content:", error);
            alert("Erro ao publicar conteúdo. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Video className="w-5 h-5 mr-2 text-orange-600" />
                    Novo Conteúdo
                </h2>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título do Vídeo</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Ex: 5 Dicas para Dormir Melhor"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link do YouTube</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LinkIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="url"
                            required
                            value={formData.videoUrl}
                            onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                            className="w-full rounded-lg border-gray-300 border p-2 pl-10 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Sobre o que é este vídeo?"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Publicando...
                            </>
                        ) : (
                            'Publicar Vídeo'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContentUploadForm;
