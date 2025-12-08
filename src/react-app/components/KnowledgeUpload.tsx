import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const KnowledgeUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
                setUploadStatus('idle');
                setMessage('');
            } else {
                setMessage('Por favor, selecione apenas arquivos PDF.');
                setUploadStatus('error');
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            setMessage('Você precisa estar logado para enviar arquivos.');
            setUploadStatus('error');
            return;
        }

        setIsUploading(true);
        setUploadStatus('idle');

        try {
            const storage = getStorage();
            // Path: knowledge_base/{userId}/{filename} - Updated path with underscore
            const storageRef = ref(storage, `knowledge_base/${user.uid}/${file.name}`);

            await uploadBytes(storageRef, file);

            setUploadStatus('success');
            setMessage(`Arquivo "${file.name}" enviado com sucesso! A Dra. Clara irá estudá-lo em breve.`);
            setFile(null);
        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus('error');
            setMessage('Erro ao enviar o arquivo. Tente novamente.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Base de Conhecimento (NotebookLM)
            </h2>

            <p className="text-sm text-gray-600 mb-6">
                Envie os PDFs gerados pelo NotebookLM para enriquecer o conhecimento da Dra. Clara.
            </p>

            <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                            </p>
                            <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="application/pdf"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>

                {file && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center">
                            <FileText className="w-4 h-4 text-purple-600 mr-2" />
                            <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
                        </button>
                    </div>
                )}

                {message && (
                    <div className={`p-3 rounded-lg flex items-center ${uploadStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {uploadStatus === 'success' ? (
                            <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                            <AlertCircle className="w-4 h-4 mr-2" />
                        )}
                        <span className="text-sm">{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeUpload;
