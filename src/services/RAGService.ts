import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase-config';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const RAGService = {
    /**
     * Sends a message to Dra. Clara (Cloud Function).
     */
    sendMessage: async (message: string, history: ChatMessage[], fileId?: string) => {
        try {
            // Call the Cloud Function
            const chatFn = httpsCallable(functions, 'chatWithDraClara');
            const result = await chatFn({ message, history, fileId });
            return (result.data as any).response;

        } catch (error: any) {
            console.error("RAG Service Error:", error);

            // Fallback apenas em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
                console.warn('[DEV MODE] Cloud Function failed, using fallback response');
                return "Desculpe, estou com problemas técnicos no momento. Por favor, tente novamente mais tarde.";
            }

            // Em produção, propagar o erro
            throw new Error(`Falha ao comunicar com Dra. Clara: ${error.message || 'Erro desconhecido'}`);
        }
    }
};
