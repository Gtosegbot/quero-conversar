"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithDraClara = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const vertexai_1 = require("@google-cloud/vertexai");
// Initialize Vertex AI
const vertexAI = new vertexai_1.VertexAI({ project: process.env.GCLOUD_PROJECT || 'quero-conversar-app', location: 'us-central1' });
const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Chat with Dra. Clara (RAG Enabled).
 * Uses Gemini 1.5 Pro with System Instructions and Context Injection.
 */
exports.chatWithDraClara = functions.https.onCall(async (data, context) => {
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
        }
        else {
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
    }
    catch (error) {
        console.error("RAG Error:", error);
        throw new functions.https.HttpsError('internal', 'Error processing AI response');
    }
});
//# sourceMappingURL=rag-functions.js.map