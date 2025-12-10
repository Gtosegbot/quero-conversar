
import React, { useState } from 'react';
import { Upload, X, FileText, Video, File, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../../../firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ContentUploadFormProps {
    companyId: string;
    onClose: () => void;
}

const ContentUploadForm: React.FC<ContentUploadFormProps> = ({ companyId, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('training');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);
        try {
            // Simulator upload - preventing Storage bucket requirement for now to avoid CORS/Permissions issues
            // In a real scenario, we would upload to Firebase Storage here.

            // Mock storage URL
            const mockUrl = `https://fake-storage.com/${companyId}/${file.name}`;

            await addDoc(collection(db, 'company_contents'), {
                company_id: companyId,
                title,
                description,
                category,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                url: mockUrl,
                status: 'active',
                created_at: serverTimestamp(),
                uploaded_at: serverTimestamp()
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Error uploading content:", error);
            alert("Erro ao salvar conteúdo.");
        } finally {
            setUploading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Concluído!</h3>
                    <p className="text-gray-600">Seu conteúdo foi adicionado à biblioteca da empresa.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Upload de Material</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título do Material</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Manual de Integração 2024"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="training">Treinamento</option>
                            <option value="onboarding">Onboarding</option>
                            <option value="policy">Políticas</option>
                            <option value="compliance">Compliance</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição (Opcional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            {file ? (
                                <div className="flex items-center justify-center text-blue-600">
                                    <File className="w-8 h-8 mr-2" />
                                    <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                    <Upload className="w-8 h-8 mb-2" />
                                    <span className="font-medium">Clique para selecionar arquivo</span>
                                    <span className="text-xs mt-1">PDF, Vídeo, PPT ou DOC</span>
                                </div>
                            )}
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || !file || !title}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {uploading ? 'Enviando...' : 'Fazer Upload'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContentUploadForm;
