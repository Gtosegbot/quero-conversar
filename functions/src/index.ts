import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { VertexAI } from "@google-cloud/vertexai";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const storage = admin.storage();

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT || "quero-conversar-app", location: "us-central1" });
const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

// Initialize TTS Client
const ttsClient = new TextToSpeechClient();

const SYSTEM_PROMPT = `
Você é a Dra. Clara Mendes, uma psicóloga virtual empática e experiente.
Sua missão é guiar o paciente em uma jornada de autoconhecimento.
Utilize o contexto fornecido (Knowledge Base) para embasar suas respostas, mas mantenha sempre o tom acolhedor.
Se o contexto incluir informações sobre Motivação ou Espiritualidade, integre-as naturalmente.
`;

/**
 * 1. Analyze Community Trends (The "Ear")
 */
export const analyzeTrends = functions.https.onCall(async (data, context) => {
    try {
        const snapshot = await db.collection("community_general")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        if (snapshot.empty) {
            return { message: "No messages to analyze." };
        }

        const messages = snapshot.docs.map(doc => doc.data().content).join("\n");

        const prompt = `
      Analise as seguintes mensagens de um grupo de apoio emocional e bem-estar.
      Identifique os 3 principais tópicos ou sentimentos emergentes.
      
      Mensagens:
      ${messages}

      Retorne APENAS um JSON no formato:
      {
        "trends": [
          { "topic": "Nome do Tópico", "description": "Breve descrição", "sentiment": "positive|neutral|negative" }
        ]
      }
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.candidates[0].content.parts[0].text;
        const jsonString = responseText?.replace(/```json/g, "").replace(/```/g, "").trim();
        const trendsData = JSON.parse(jsonString || "{}");

        const insightRef = await db.collection("admin_insights").add({
            type: "daily_trends",
            trends: trendsData.trends,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, id: insightRef.id, trends: trendsData.trends };

    } catch (error) {
        console.error("Error analyzing trends:", error);
        return { error: "Failed to analyze trends." };
    }
});

/**
 * 2. Generate Study from Topic (The "Brain")
 */
export const generateStudy = functions.https.onCall(async (data, context) => {
    const { topic, sourceUrl } = data;
    if (!topic) return { error: "Topic is required." };

    try {
        const prompt = `
      Atue como a Dra. Clara Mendes.
      Crie um "Módulo de Conhecimento" estruturado sobre o tema: "${topic}".
      ${sourceUrl ? `Baseie-se também neste conteúdo: ${sourceUrl}` : ""}
      
      Retorne APENAS um JSON no formato:
      {
        "title": "Título do Estudo",
        "summary": "Resumo executivo",
        "content": "Texto completo e detalhado.",
        "key_learnings": ["Ponto 1", "Ponto 2"],
        "spiritual_perspective": "Visão espiritual (opcional)",
        "suggested_exercises": ["Exercício 1"]
      }
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.candidates[0].content.parts[0].text;
        const jsonString = responseText?.replace(/```json/g, "").replace(/```/g, "").trim();
        const studyData = JSON.parse(jsonString || "{}");

        const studyRef = await db.collection("knowledge_base").add({
            ...studyData,
            topic: topic,
            source: sourceUrl || "Community Trend",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            active: true
        });

        return { success: true, id: studyRef.id, study: studyData };

    } catch (error) {
        console.error("Error generating study:", error);
        return { error: "Failed to generate study." };
    }
});

/**
 * 3. Generate Daily Podcast (The "Voice")
 */
export const generateDailyPodcast = functions.https.onCall(async (data, context) => {
    try {
        const trendsSnap = await db.collection("admin_insights")
            .where("type", "==", "daily_trends")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (trendsSnap.empty) return { error: "No trends found." };
        const trends = trendsSnap.docs[0].data().trends;

        const scriptPrompt = `
      Crie um roteiro curto (2 min) para o podcast "Bom Dia com Dra. Clara".
      Baseie-se nestas tendências: ${JSON.stringify(trends)}
      Retorne APENAS o texto do roteiro.
    `;

        const result = await model.generateContent(scriptPrompt);
        const scriptText = result.response.candidates[0].content.parts[0].text;

        if (!scriptText) throw new Error("Failed to generate script.");

        const request = {
            input: { text: scriptText },
            voice: { languageCode: "pt-BR", name: "pt-BR-Neural2-A" },
            audioConfig: { audioEncoding: "MP3" as const },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);
        const audioBuffer = response.audioContent;

        if (!audioBuffer) throw new Error("Failed to synthesize speech.");

        const fileName = `podcasts/daily_${new Date().toISOString().split('T')[0]}.mp3`;
        const bucket = storage.bucket();
        const file = bucket.file(fileName);

        await file.save(Buffer.from(audioBuffer), {
            contentType: 'audio/mpeg',
            metadata: { metadata: { firebaseStorageDownloadTokens: fileName } }
        });

        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

        const podcastRef = await db.collection("podcasts").add({
            title: `Reflexão do Dia: ${trends[0].topic}`,
            summary: `Dra. Clara fala sobre ${trends.map((t: any) => t.topic).join(", ")}`,
            audioUrl: downloadUrl,
            script: scriptText,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            duration: "2:00",
            likes: 0
        });

        return { success: true, id: podcastRef.id, url: downloadUrl };

    } catch (error) {
        console.error("Error generating podcast:", error);
        return { error: "Failed to generate podcast." };
    }
});

/**
 * 4. Chat Response (Updated for Native RAG)
 */
export const onNewMessage = functions.firestore
    .document("conversations/{conversationId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const conversationId = context.params.conversationId;

        console.log(`[onNewMessage] Triggered for conversation ${conversationId}, message ${context.params.messageId}`);

        if (message.type !== "user") {
            console.log("[onNewMessage] Ignoring bot message.");
            return null;
        }

        try {
            const conversationDoc = await db.doc(`conversations/${conversationId}`).get();
            const userId = conversationDoc.data()?.userId;
            console.log(`[onNewMessage] User ID: ${userId}`);

            const knowledgeSnap = await db.collection("knowledge_base")
                .where("active", "==", true)
                .orderBy("createdAt", "desc")
                .limit(3)
                .get();

            const knowledgeContext = knowledgeSnap.docs.map(doc => {
                const d = doc.data();
                return `TEMA: ${d.title}\nRESUMO: ${d.summary}\nCONTEÚDO: ${d.content}\nPERSPECTIVA ESPIRITUAL: ${d.spiritual_perspective}`;
            }).join("\n\n---\n\n");
            console.log(`[onNewMessage] Retrieved ${knowledgeSnap.size} knowledge docs.`);

            let socialContext = "";
            if (userId) {
                const communitySnap = await db.collection("community_messages")
                    .where("user_id", "==", userId)
                    .orderBy("created_at", "desc")
                    .limit(5)
                    .get();

                if (!communitySnap.empty) {
                    const recentMessages = communitySnap.docs.map(doc => `"${doc.data().content}"`).join("\n");
                    socialContext = `
                    \n\nCONTEXTO SOCIAL (O que o usuário falou na comunidade recentemente):
                    ${recentMessages}
                    
                    INSTRUÇÃO: Use este contexto social para entender o estado emocional do usuário, mas NÃO mencione explicitamente que você "leu" essas mensagens para não parecer invasiva. Use como intuição terapêutica.
                    `;
                }
            }

            const historySnap = await db.collection(`conversations/${conversationId}/messages`)
                .orderBy("createdAt", "asc")
                .limitToLast(11)
                .get();

            const history = historySnap.docs
                .filter(doc => doc.id !== snap.id)
                .map(doc => ({
                    role: doc.data().type === "user" ? "user" : "model",
                    parts: [{ text: doc.data().content }]
                }));
            console.log(`[onNewMessage] Retrieved ${history.length} history messages.`);

            const chat = model.startChat({
                history: history,
            });

            const fullPrompt = `${SYSTEM_PROMPT}\n\nBASE DE CONHECIMENTO (Estudos Recentes):\n${knowledgeContext}${socialContext}\n\nUsuário: ${message.content}`;

            console.log("[onNewMessage] Sending prompt to Gemini...");
            const result = await chat.sendMessage(fullPrompt);
            const response = result.response.candidates[0].content.parts[0].text;
            console.log("[onNewMessage] Received response from Gemini.");

            await db.collection(`conversations/${conversationId}/messages`).add({
                type: "bot",
                content: response,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return null;

        } catch (error) {
            console.error("Error generating response:", error);
            return null;
        }
    });

/**
 * 5. Referral System (Award XP)
 */
export const onUserCreated = functions.firestore
    .document("users/{userId}")
    .onCreate(async (snap, context) => {
        const newUser = snap.data();
        const referrerId = newUser.referredBy;

        if (!referrerId) return null;

        try {
            const referrerRef = db.collection("users").doc(referrerId);
            await referrerRef.update({
                energyPoints: admin.firestore.FieldValue.increment(50),
            });
            console.log(`Awarded 50 XP to ${referrerId} for referring ${newUser.uid}`);
            return { success: true };
        } catch (error) {
            console.error("Error awarding referral XP:", error);
            return null;
        }
    });

export * from './payment-functions';
export * from './rag-functions';
