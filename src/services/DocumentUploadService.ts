import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase-config';

export interface UploadResult {
    success: boolean;
    name: string;
    url?: string;
    error?: string;
}

export const DocumentUploadService = {
    /**
     * Sanitiza nome do arquivo para evitar problemas no Storage
     */
    sanitizeFileName: (fileName: string): string => {
        const timestamp = Date.now();
        const extension = fileName.split('.').pop();
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        const sanitized = nameWithoutExt
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-zA-Z0-9]/g, '_') // Substitui caracteres especiais
            .substring(0, 50); // Limita tamanho
        return `${sanitized}_${timestamp}.${extension}`;
    },

    /**
     * Valida arquivo antes do upload
     */
    validateFile: (file: File): { valid: boolean; error?: string } => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

        if (file.size > maxSize) {
            return { valid: false, error: `Arquivo ${file.name} excede 10MB` };
        }

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: `Tipo de arquivo ${file.type} não permitido` };
        }

        return { valid: true };
    },

    /**
     * Faz upload de um único arquivo
     */
    uploadFile: async (
        file: File,
        path: string,
        onProgress?: (progress: number) => void
    ): Promise<UploadResult> => {
        try {
            // Validar arquivo
            const validation = DocumentUploadService.validateFile(file);
            if (!validation.valid) {
                return { success: false, name: file.name, error: validation.error };
            }

            // Sanitizar nome
            const sanitizedName = DocumentUploadService.sanitizeFileName(file.name);
            const storageRef = ref(storage, `${path}/${sanitizedName}`);

            // Upload
            await uploadBytes(storageRef, file);

            // Obter URL
            const url = await getDownloadURL(storageRef);

            return { success: true, name: file.name, url };
        } catch (error: any) {
            console.error(`Upload failed for ${file.name}:`, error);
            return {
                success: false,
                name: file.name,
                error: error.message || 'Erro desconhecido no upload'
            };
        }
    },

    /**
     * Faz upload de múltiplos arquivos
     */
    uploadMultiple: async (
        files: File[],
        path: string,
        onProgress?: (current: number, total: number) => void
    ): Promise<UploadResult[]> => {
        const results: UploadResult[] = [];

        for (let i = 0; i < files.length; i++) {
            const result = await DocumentUploadService.uploadFile(files[i], path);
            results.push(result);

            if (onProgress) {
                onProgress(i + 1, files.length);
            }
        }

        return results;
    }
};
