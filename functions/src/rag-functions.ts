import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT || 'quero-conversar-app', location: 'us-central1' });
const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

/**
 * Chat with Dra. Clara (RAG Enabled).
 * Uses Gemini 1.5 Pro with System Instructions and Context Injection.
 */
export const chatWithDraClara = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { message, history, fileId } = data;
    const userId = context.auth.uid;

    try {
        // 1. Fetch User Context (Plan, Name, Anamnesis)
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const userPlan = userData?.plan || 'free';
        const userName = userData?.name || 'Usuário';

        // 2. Retrieve Knowledge Base Context (RAG)
        let contextText = "";

        if (fileId) {
            const fileDoc = await db.collection('documents').doc(fileId).get();
            contextText = fileDoc.data()?.extractedText || "";
        } else {
            contextText = "Base de Conhecimento Geral: O Quero Conversar é uma plataforma de bem-estar...";
        }

        // 3. Construct System Prompt
        const systemPrompt = `
        Você é a Dra. Clara Mendes, uma psicóloga virtual empática, experiente e acolhedora.
        
        CONTEXTO DO USUÁRIO:
        Nome: ${userName}
        Plano: ${userPlan}
        
        CONTEXTO RECUPERADO (RAG):
        ${contextText}
        
        DIRETRIZES:
        - Acolha o usuário com empatia.
        - Use o contexto recuperado para dar respostas embasadas.
        - Se o usuário estiver em crise (risco de vida), use o Protocolo de Emergência (CVV 188).
        `;

        // 4. Call Gemini
        const chat = model.startChat({
            history: history || [],
        });

        const fullPrompt = `${systemPrompt}\n\nUsuário: ${message}`;
        const result = await chat.sendMessage(fullPrompt);
        const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

        // 5. Save Interaction to Firestore
        await db.collection('conversations').doc(userId).collection('messages').add({
            type: 'user',
            content: message,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('conversations').doc(userId).collection('messages').add({
            type: 'bot',
            content: response,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { response };

    } catch (error) {
        console.error("RAG Error:", error);
        throw new functions.https.HttpsError('internal', 'Error processing AI response');
    }
});
