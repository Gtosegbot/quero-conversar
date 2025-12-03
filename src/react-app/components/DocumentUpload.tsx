import React, { useState, useCallback, useEffect } from 'react';
import { Upload, File, Download, Trash2, FileText, Image, Video } from 'lucide-react';
import PulsingHeart from './PulsingHeart';
import { db, storage } from '../../firebase-config';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface DocumentUploadProps {
  appointmentId?: string;
  userType: 'patient' | 'professional';
  userId?: string;
  professionalId?: string;
}

interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  document_type: string;
  description?: string;
  is_prescription: boolean;
  created_at: any;
  url: string;
  storagePath: string;
  userId?: string;
  professionalId?: string;
  appointmentId?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  appointmentId,
  userType,
  userId,
  professionalId
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no userId, don't fetch anything
    if (!userId) {
      setLoading(false);
      return;
    }

    // Query only by userId to ensure we get all user documents
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];

      console.log('📄 Documents fetched:', docs.length, docs);

      // Client-side filtering if needed
      let filteredDocs = docs;
      if (appointmentId) {
        filteredDocs = filteredDocs.filter(doc => doc.appointmentId === appointmentId);
      }
      if (professionalId) {
        filteredDocs = filteredDocs.filter(doc => doc.professionalId === professionalId);
      }

      console.log('📄 Filtered documents:', filteredDocs.length, filteredDocs);
      setDocuments(filteredDocs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching documents:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appointmentId, userId, professionalId]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        // 1. Upload to Firebase Storage
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `documents/${userId || 'anonymous'}/${Date.now()}_${sanitizedName}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        // 2. Determine document type
        let documentType = 'general';
        if (file.type.includes('pdf')) documentType = 'pdf';
        else if (file.type.includes('image')) documentType = 'image';
        else if (file.type.includes('video')) documentType = 'video';

        // 3. Save metadata to Firestore
        const documentData: any = {
          original_filename: file.name,
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          document_type: documentType,
          description: `Documento enviado via ${userType === 'professional' ? 'profissional' : 'paciente'}`,
          is_prescription: false,
          created_at: serverTimestamp(),
          url: downloadUrl,
          storagePath: storagePath
        };

        // Only add fields if they are defined
        if (userId) documentData.userId = userId;
        if (professionalId) documentData.professionalId = professionalId;
        if (appointmentId) documentData.appointmentId = appointmentId;

        await addDoc(collection(db, 'documents'), documentData);

      } catch (error) {
        console.error('Upload error:', error);
        alert(`Erro ao enviar ${file.name}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      }
    }

    setUploading(false);
  }, [appointmentId, userId, professionalId, userType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const downloadDocument = (document: Document) => {
    window.open(document.url, '_blank');
  };

  const deleteDocument = async (document: Document) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      // 1. Delete from Storage
      if (document.storagePath) {
        const storageRef = ref(storage, document.storagePath);
        await deleteObject(storageRef);
      }

      // 2. Delete from Firestore
      await deleteDoc(doc(db, 'documents', document.id));

    } catch (error) {
      console.error('Delete error:', error);
      alert('Erro ao excluir documento');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (fileType.includes('image')) return <Image className="w-6 h-6 text-green-500" />;
    if (fileType.includes('video')) return <Video className="w-6 h-6 text-blue-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <PulsingHeart color="text-purple-600" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragOver
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-300 hover:border-purple-400'
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov,.avi"
          onChange={handleFileInputChange}
          disabled={uploading}
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            {uploading ? 'Enviando...' : 'Clique ou arraste arquivos aqui'}
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOC, DOCX, JPG, PNG, MP4, MOV, AVI
          </p>
        </label>
      </div>

      {/* Document Types Guide */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Tipos de documentos aceitos:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {userType === 'patient' ? (
            <>
              <li>• Exames médicos (PDF, imagens)</li>
              <li>• Receituários antigos</li>
              <li>• Documentos de identificação</li>
              <li>• Histórico médico</li>
            </>
          ) : (
            <>
              <li>• Receituários médicos</li>
              <li>• Relatórios de consulta</li>
              <li>• Planos de tratamento</li>
              <li>• Orientações terapêuticas</li>
            </>
          )}
        </ul>
      </div>

      {/* Documents List */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center">
          <File className="w-4 h-4 mr-2" />
          Documentos ({documents.length})
        </h4>

        {documents.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">
            Nenhum documento enviado ainda
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center flex-1">
                  {getFileIcon(doc.file_type)}
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.original_filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.file_size)} • {
                        doc.created_at?.toDate
                          ? new Date(doc.created_at.toDate()).toLocaleDateString('pt-BR')
                          : doc.created_at
                            ? new Date(doc.created_at).toLocaleDateString('pt-BR')
                            : 'Agora'
                      }
                    </p>
                    {doc.description && (
                      <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                    )}
                    {doc.is_prescription && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                        Receituário
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Allow deletion if it's the user's own document or if professional */}
                  <button
                    onClick={() => deleteDocument(doc)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;

