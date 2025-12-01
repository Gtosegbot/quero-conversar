import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { VertexAI } from "@google-cloud/vertexai";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import OpenAI from "openai";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT || "quero-conversar-app", location: "us-central1" });
const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Initialize TTS Client
const ttsClient = new TextToSpeechClient();

const SYSTEM_PROMPT = `
Você é a Dra. Clara Mendes, uma psicóloga virtual empática e experiente.
Sua missão é guiar o paciente em uma jornada de autoconhecimento.
Utilize o contexto fornecido (Knowledge Base) para embasar suas respostas, mas mantenha sempre o tom acolhedor.
Se o contexto incluir informações sobre Motivação ou Espiritualidade, integre-as naturalmente.

IMPORTANTE:
- Seja concisa. Evite respostas muito longas.
- Use parágrafos curtos.
- Foque em uma ou duas orientações práticas por vez.
- Termine sempre com uma pergunta aberta para manter o diálogo.
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
        const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
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
        const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
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
        const scriptText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
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
 * 4. Chat Response (Updated for Native RAG + Web Search)
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
        // Declare variables outside try block for scope access in catch
        let userProfile = "";
        let knowledgeContext = "";
        let socialContext = "";
        try {
            // 1. Fetch User Context
            const conversationDoc = await db.doc(`conversations/${conversationId}`).get();
            const userId = conversationDoc.data()?.userId;
            console.log(`[onNewMessage] User ID: ${userId}`);
            if (userId) {
                const userDoc = await db.collection("users").doc(userId).get();
                const userData = userDoc.data();
                userProfile = `
                PERFIL DO PACIENTE:
                Nome: ${userData?.name || "Usuário"}
                Idade: ${userData?.age || "Não informado"}
                Profissão: ${userData?.profession || "Não informado"}
                Objetivos: ${userData?.goals || "Bem-estar geral"}
                `;
            }
            // 2. RAG - Knowledge Base (Scientific Basis)
            const knowledgeSnap = await db.collection("knowledge_base")
                .where("active", "==", true)
                .orderBy("createdAt", "desc")
                .limit(3)
                .get();
            knowledgeContext = knowledgeSnap.docs.map(doc => {
                const d = doc.data();
                return `ESTUDO CIENTÍFICO: ${d.title}\nRESUMO: ${d.summary}\nCONTEÚDO: ${d.content}\n`;
            }).join("\n\n---\n\n");
            console.log(`[onNewMessage] Retrieved ${knowledgeSnap.size} knowledge docs.`);
            // 3. RAG - Social Context (Community)
            if (userId) {
                const communitySnap = await db.collection("community_messages")
                    .where("user_id", "==", userId)
                    .orderBy("created_at", "desc")
                    .limit(5)
                    .get();
                if (!communitySnap.empty) {
                    const recentMessages = communitySnap.docs.map(doc => `"${doc.data().content}"`).join("\n");
                    socialContext = `
                    CONTEXTO SOCIAL RECENTE (Comunidade):
                    ${recentMessages}
                    (Use isso para entender o estado emocional atual, mas não cite explicitamente a menos que relevante).
                    `;
                }
            }
            // 4. Chat History
            const historySnap = await db.collection(`conversations/${conversationId}/messages`)
                .orderBy("createdAt", "asc")
                .limitToLast(15) // Increased context window
                .get();
            const history = historySnap.docs
                .filter(doc => doc.id !== snap.id)
                .map(doc => ({
                    role: doc.data().type === "user" ? "user" : "model",
                    parts: [{ text: doc.data().content }]
                }));
            console.log(`[onNewMessage] Retrieved ${history.length} history messages.`);
            // 5. Initialize Model with Tools (Web Search)
            // Note: Web Search requires Vertex AI setup in Google Cloud Console.
            const generativeModel = vertexAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                // tools: [{
                //     googleSearchRetrieval: {} // Temporarily disabled for 1.0 Pro test
                // }]
            });
            const chat = generativeModel.startChat({
                history: history,
            });
            const fullPrompt = `
            ${SYSTEM_PROMPT}
            ${userProfile}
            BASE DE CONHECIMENTO CIENTÍFICA (Prioridade Alta):
            ${knowledgeContext}
            ${socialContext}
            INSTRUÇÕES ADICIONAIS:
            1. Se a resposta não estiver na Base de Conhecimento, use a Busca na Web (Google Search) para encontrar informações científicas confiáveis.
            2. Cite fontes quando possível (ex: "Segundo estudos...").
            3. Mantenha a persona da Dra. Clara: acolhedora, profissional, mas baseada em evidências.
            Usuário: ${message.content}
            `;
            console.log("[onNewMessage] Sending prompt to Gemini with Web Search...");
            const result = await chat.sendMessage(fullPrompt);
            const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log("[onNewMessage] Received response from Gemini.");
            await db.collection(`conversations/${conversationId}/messages`).add({
                type: "bot",
                content: response,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return null;
        } catch (error) {
            console.error("Error generating response with Gemini:", error);
            console.log("Attempting fallback to OpenAI (GPT-4o-mini)...");
            try {
                // Debug logging for API Key (Masked)
                const configKey = functions.config().openai?.key;
                const envKey = process.env.OPENAI_API_KEY;
                console.log(`[OpenAI Debug] Config Key present: ${!!configKey}, Env Key present: ${!!envKey}`);
                // Initialize OpenAI lazily
                const openai = new OpenAI({
                    apiKey: configKey || envKey,
                });
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `${SYSTEM_PROMPT}\n\n${userProfile}\n\nBASE DE CONHECIMENTO CIENTÍFICA:\n${knowledgeContext}\n\n${socialContext}\n\nINSTRUÇÕES: Você é a Dra. Clara. Use o contexto acima. Se falhar, seja empática.`
                        },
                        { role: "user", content: message.content }
                    ],
                });
                const response = completion.choices[0].message.content;
                await db.collection(`conversations/${conversationId}/messages`).add({
                    type: "bot",
                    content: response,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return null;
            } catch (openaiError) {
                console.error("OpenAI Fallback failed:", openaiError);
                // Final Fallback message if BOTH fail
                await db.collection(`conversations/${conversationId}/messages`).add({
                    type: "bot",
                    content: `Sinto muito, tive um lapso de conexão com meus dois centros de processamento. (Erro Técnico: ${error instanceof Error ? error.message : String(error)} | Fallback: ${openaiError instanceof Error ? openaiError.message : String(openaiError)})`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return null;
            }
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

/**
 * 6. Stripe Webhook
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const event = req.body;

    try {
        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            console.log("Payment Succeeded:", paymentIntent.id);
            // In a real implementation, you would update the payment status in Firestore
        }
        res.json({ received: true });
    } catch (err) {
        console.error(err);
        res.status(400).send(`Webhook Error: ${err}`);
    }
});

export * from './payment-functions';
export * from './rag-functions';
