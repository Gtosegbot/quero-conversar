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
            // In a real app, we call the Cloud Function:
            // const chatFn = httpsCallable(functions, 'chatWithDraClara');
            // const result = await chatFn({ message, history, fileId });
            // return result.data.response;

            // SIMULATION (Local RAG):
            console.log(`[RAG] Sending message: "${message}" with context file: ${fileId || 'None'}`);

            return new Promise<string>((resolve) => {
                setTimeout(() => {
                    const lowerMsg = message.toLowerCase();

                    if (fileId) {
                        resolve(`(Analisando documento ${fileId}...) Com base no arquivo enviado, percebo que este tema é central para o seu desenvolvimento. O texto sugere que...`);
                        return;
                    }

                    if (lowerMsg.includes('ansiedade') || lowerMsg.includes('medo')) {
                        resolve("Sinto muito que esteja passando por isso. A ansiedade é uma resposta natural, mas pode ser avassaladora. Com base no que conversamos (e consultando minha base de conhecimento sobre TCC), sugiro começarmos com uma técnica de respiração diafragmática. O que acha?");
                    } else if (lowerMsg.includes('olá') || lowerMsg.includes('oi')) {
                        resolve("Olá! Sou a Dra. Clara. Estou aqui para te ouvir e te apoiar. Como você está se sentindo hoje?");
                    } else {
                        resolve("Entendo. É um ponto interessante. Na psicologia, costumamos olhar para isso como uma oportunidade de autoconhecimento. Você poderia me dar mais detalhes sobre como isso te faz sentir?");
                    }
                }, 1500);
            });

        } catch (error) {
            console.error("RAG Service Error:", error);
            throw error;
        }
    }
};
