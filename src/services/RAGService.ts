import { httpsCallable } from 'firebase/functions';
import { functions, db, auth } from '../firebase-config';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface AnamnesisContext {
    preferredName?: string;
    currentSituation?: string;
    goals?: string;
    history?: string;
}

export const RAGService = {
    /**
     * Busca contexto da anamnese do usuário
     */
    getAnamnesisContext: async (): Promise<AnamnesisContext | null> => {
        try {
            const user = auth.currentUser;
            if (!user) return null;

            const anamnesisRef = doc(db, 'users', user.uid, 'anamnesis', 'initial');
            const anamnesisSnap = await getDoc(anamnesisRef);

            if (!anamnesisSnap.exists()) return null;

            const data = anamnesisSnap.data();
            const responses = data.responses || [];

            // Extrair informações relevantes
            const context: AnamnesisContext = {};

            responses.forEach((r: any) => {
                if (r.question?.includes('nome') || r.question?.includes('chamar')) {
                    context.preferredName = r.response;
                }
                if (r.question?.includes('estado emocional') || r.question?.includes('trouxe até aqui')) {
                    context.currentSituation = r.response;
                }
                if (r.question?.includes('espera alcançar') || r.question?.includes('objetivos')) {
                    context.goals = r.response;
                }
            });

            return context;
        } catch (error) {
            console.error('Error fetching anamnesis context:', error);
            return null;
        }
    },

    /**
     * Busca histórico recente de conversas
     */
    getConversationHistory: async (limitCount: number = 10): Promise<ChatMessage[]> => {
        try {
            const user = auth.currentUser;
            if (!user) return [];

            const q = query(
                collection(db, 'users', user.uid, 'chat_history'),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            const messages: ChatMessage[] = [];

            snapshot.docs.reverse().forEach(doc => {
                const data = doc.data();
                messages.push({
                    role: data.role,
                    parts: [{ text: data.message }]
                });
            });

            return messages;
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            return [];
        }
    },

    /**
     * Salva mensagem no histórico
     */
    saveToHistory: async (role: 'user' | 'model', message: string) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            await setDoc(doc(collection(db, 'users', user.uid, 'chat_history')), {
                role,
                message,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    },

    /**
     * Sends a message to Dra. Clara (Cloud Function) with full context.
     */
    sendMessage: async (message: string, history: ChatMessage[], fileId?: string) => {
        try {
            // Buscar contexto da anamnese
            const anamnesisContext = await RAGService.getAnamnesisContext();

            // Salvar mensagem do usuário
            await RAGService.saveToHistory('user', message);

            // Call the Cloud Function with context
            const chatFn = httpsCallable(functions, 'chatWithDraClara');
            const result = await chatFn({
                message,
                history,
                fileId,
                anamnesisContext
            });

            const response = (result.data as any).response;

            // Salvar resposta da Dra. Clara
            await RAGService.saveToHistory('model', response);

            return response;

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
    },

    /**
     * Detecta risco em mensagem do usuário
     */
    detectRisk: (message: string): 'high' | 'moderate' | 'low' => {
        const lowerMessage = message.toLowerCase();

        // Palavras-chave de risco alto
        const highRiskKeywords = [
            'suicídio', 'suicidio', 'me matar', 'acabar com tudo',
            'não quero viver', 'quero morrer', 'vou me matar',
            'plano de suicídio', 'me machucar', 'autolesão'
        ];

        // Palavras-chave de risco moderado
        const moderateRiskKeywords = [
            'depressão', 'depressao', 'ansiedade severa', 'pânico',
            'não aguento mais', 'sem esperança', 'desesperado',
            'isolado', 'sozinho', 'ninguém se importa'
        ];

        if (highRiskKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return 'high';
        }

        if (moderateRiskKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return 'moderate';
        }

        return 'low';
    }
};
