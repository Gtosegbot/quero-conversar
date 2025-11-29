import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { VertexAI } from "@google-cloud/vertexai";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT || "quero-conversar-app", location: "us-central1" });
const model = vertexAI.preview.getGenerativeModel({ model: "gemini-1.5-pro" });

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
 * Triggers: Scheduled or Callable from Admin Dashboard
 * Action: Reads recent community messages -> Gemini -> Top 3 Topics
 */
export const analyzeTrends = functions.https.onCall(async (data, context) => {
    // Security: Check if user is admin (skip for prototype)
    // if (!context.auth?.token.admin) return { error: "Unauthorized" };

    try {
        // 1. Fetch recent messages from 'community_general' (simulated collection)
        const snapshot = await db.collection("community_general")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        if (snapshot.empty) {
            return { message: "No messages to analyze." };
        }

        const messages = snapshot.docs.map(doc => doc.data().content).join("\n");

        // 2. Ask Gemini to identify trends
        const prompt = `
      Analise as seguintes mensagens de um grupo de apoio emocional e bem-estar.
      Identifique os 3 principais tópicos ou sentimentos emergentes (ex: Ansiedade no trabalho, Solidão, Gratidão).
      
      Mensagens:
      ${messages}

      Retorne APENAS um JSON no formato:
      {
        "trends": [
          { "topic": "Nome do Tópico", "description": "Breve descrição do contexto", "sentiment": "positive|neutral|negative" }
        ]
      }
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.candidates[0].content.parts[0].text;

        const jsonString = responseText?.replace(/```json/g, "").replace(/```/g, "").trim();
        const trendsData = JSON.parse(jsonString || "{}");

        // 3. Save to Firestore
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
 * Triggers: Admin clicks "Generate Study" on a trend
 * Action: Topic -> Gemini -> Structured Knowledge Module -> Firestore
 */
export const generateStudy = functions.https.onCall(async (data, context) => {
    const { topic, sourceUrl } = data;

    if (!topic) return { error: "Topic is required." };

    try {
        const prompt = `
      Atue como a Dra. Clara Mendes (Psicóloga Sênior).
      Crie um "Módulo de Conhecimento" estruturado sobre o tema: "${topic}".
      ${sourceUrl ? `Baseie-se também neste conteúdo: ${sourceUrl}` : ""}

      O conteúdo deve ser profundo, acolhedor e prático.
      
      Retorne APENAS um JSON no formato:
      {
        "title": "Título do Estudo",
        "summary": "Resumo executivo (2-3 frases)",
        "content": "Texto completo e detalhado sobre o tema, com técnicas e reflexões.",
        "key_learnings": ["Ponto chave 1", "Ponto chave 2", "Ponto chave 3"],
        "spiritual_perspective": "Uma visão holística/espiritual sobre o tema (opcional mas recomendado)",
        "suggested_exercises": ["Exercício prático 1", "Exercício prático 2"]
      }
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.candidates[0].content.parts[0].text;
        const jsonString = responseText?.replace(/```json/g, "").replace(/```/g, "").trim();
        const studyData = JSON.parse(jsonString || "{}");

        // Save to Knowledge Base
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
 * Triggers: Scheduled (e.g. 6:00 AM) or Callable from Admin
 * Action: Trends -> Script -> TTS -> Storage -> Firestore
 */
export const generateDailyPodcast = functions.https.onCall(async (data, context) => {
    try {
        // 1. Get Latest Trends
        const trendsSnap = await db.collection("admin_insights")
            .where("type", "==", "daily_trends")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (trendsSnap.empty) return { error: "No trends found to generate podcast." };
        const trends = trendsSnap.docs[0].data().trends;

        // 2. Generate Script with Gemini
        const scriptPrompt = `
      Atue como a Dra. Clara Mendes.
      Crie um roteiro curto (aprox. 2 minutos de fala) para o podcast diário "Bom Dia com Dra. Clara".
      
      Baseie-se nestas tendências da comunidade de ontem:
      ${JSON.stringify(trends)}

      Estrutura:
      1. Saudação calorosa e empática.
      2. Comentário sobre os temas que a comunidade está sentindo (sem expor ninguém).
      3. Uma reflexão profunda ou conselho prático sobre o tema principal.
      4. Mensagem final de esperança e convite para interagir no app.

      Retorne APENAS o texto do roteiro, pronto para ser lido (sem marcações de cena).
    `;

        const result = await model.generateContent(scriptPrompt);
        const scriptText = result.response.candidates[0].content.parts[0].text;

        if (!scriptText) throw new Error("Failed to generate script.");

        // 3. Convert to Audio (Google Cloud TTS)
        const request = {
            input: { text: scriptText },
            // Voice Selection: 'pt-BR-Neural2-A' (Female) or similar high-quality voice
            voice: { languageCode: "pt-BR", name: "pt-BR-Neural2-A" },
            audioConfig: { audioEncoding: "MP3" as const },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);
        const audioBuffer = response.audioContent;

        if (!audioBuffer) throw new Error("Failed to synthesize speech.");

        // 4. Upload to Firebase Storage
        const fileName = `podcasts/daily_${new Date().toISOString().split('T')[0]}.mp3`;
        const bucket = storage.bucket();
        const file = bucket.file(fileName);

        await file.save(Buffer.from(audioBuffer), {
            contentType: 'audio/mpeg',
            metadata: {
                metadata: {
                    firebaseStorageDownloadTokens: fileName // Simple token strategy for demo
                }
            }
        });

        // Get Public URL (or signed URL)
        // For simplicity in this demo, we construct a download URL assuming public access or token usage
        // In prod, use getSignedUrl or make public
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

        // 5. Save Metadata to Firestore
        const podcastRef = await db.collection("podcasts").add({
            title: `Reflexão do Dia: ${trends[0].topic}`,
            summary: `Dra. Clara fala sobre ${trends.map((t: any) => t.topic).join(", ")}`,
            audioUrl: downloadUrl,
            script: scriptText,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            duration: "2:00", // Estimated
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

        if (message.type !== "user") return null;

        try {
            // 0. Get User ID from Conversation
            const conversationDoc = await db.doc(`conversations/${conversationId}`).get();
            const userId = conversationDoc.data()?.userId;

            // 1. Retrieve Context from Knowledge Base
            const knowledgeSnap = await db.collection("knowledge_base")
                .where("active", "==", true)
                .orderBy("createdAt", "desc")
                .limit(3)
                .get();

            const knowledgeContext = knowledgeSnap.docs.map(doc => {
                const d = doc.data();
                return `TEMA: ${d.title}\nRESUMO: ${d.summary}\nCONTEÚDO: ${d.content}\nPERSPECTIVA ESPIRITUAL: ${d.spiritual_perspective}`;
            }).join("\n\n---\n\n");

            // 2. Retrieve Social Context (Community Messages)
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

            // 3. Retrieve History (excluding current message)
            const historySnap = await db.collection(`conversations/${conversationId}/messages`)
                .orderBy("createdAt", "asc")
                .limitToLast(11) // Fetch 11 to ensure we have context even if we filter one out
                .get();

            const history = historySnap.docs
                .filter(doc => doc.id !== snap.id) // Exclude current message
                .map(doc => ({
                    role: doc.data().type === "user" ? "user" : "model",
                    parts: [{ text: doc.data().content }]
                }));

            // 4. Generate Response
            const chat = model.startChat({
                history: history,
                systemInstruction: {
                    role: "system",
                    parts: [{ text: SYSTEM_PROMPT + "\n\nBASE DE CONHECIMENTO (Estudos Recentes):\n" + knowledgeContext + socialContext }]
                }
            });

            const result = await chat.sendMessage(message.content);
            const response = result.response.candidates[0].content.parts[0].text;

            await db.collection(`conversations/${conversationId}/messages`).add({
                type: "bot",
                content: response,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error("Error generating response:", error);
        }
    });

export * from './payment-functions';
export * from './rag-functions';
