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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.onUserCreated = exports.onNewMessage = exports.generateDailyPodcast = exports.generateStudy = exports.analyzeTrends = exports.sendEmployeeInvite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const vertexai_1 = require("@google-cloud/vertexai");
const text_to_speech_1 = require("@google-cloud/text-to-speech");
const openai_1 = __importDefault(require("openai"));
const nodemailer = __importStar(require("nodemailer"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const storage = admin.storage();
// Initialize Vertex AI
const vertexAI = new vertexai_1.VertexAI({ project: process.env.GCLOUD_PROJECT || "quero-conversar-app", location: "us-central1" });
const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// Initialize SMTP Transporter
// NOTE: User must set these env vars via `firebase functions:config:set smtp.email="email@gmail.com" smtp.password="app_password"`
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL || functions.config().smtp?.email,
        pass: process.env.SMTP_PASSWORD || functions.config().smtp?.password
    }
});
/**
 * 3. Send Employee Invite Email (Real Email)
 */
exports.sendEmployeeInvite = functions.firestore
    .document("employee_invites/{inviteId}")
    .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : null;
    const previousData = change.before.exists ? change.before.data() : null;
    // Exit if deleted or no email
    if (!data || !data.email)
        return null;
    // Check if it's a new invite OR a resend (invited_at changed)
    const isNew = !previousData;
    const isResend = previousData && data.invited_at && previousData.invited_at !== data.invited_at;
    if (!isNew && !isResend)
        return null;
    const mailOptions = {
        from: '"Quero Conversar" <noreply@queroconversar.com>',
        to: data.email,
        subject: isResend ? "Lembrete: Convite para Quero Conversar Enterprise" : "Convite para Quero Conversar Enterprise",
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Você foi convidado!</h2>
            <p>Olá,</p>
            <p>Você foi convidado para participar do programa de bem-estar corporativo <strong>Quero Conversar</strong>.</p>
            <p>Clique no botão abaixo para aceitar o convite e criar sua conta:</p>
            <a href="https://quero-conversar.vercel.app/invite/${context.params.inviteId}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
               Aceitar Convite
            </a>
            <p style="color: #666; font-size: 14px;">Se o botão não funcionar, copie este link: https://quero-conversar.vercel.app/invite/${context.params.inviteId}</p>
        </div>
      `
    };
    try {
        if (!process.env.SMTP_EMAIL && !functions.config().smtp?.email) {
            console.warn("SMTP credentials missing. Email simulated:", mailOptions.to);
            return null;
        }
        await transporter.sendMail(mailOptions);
        console.log("Invite email sent to:", data.email);
    }
    catch (error) {
        console.error("Error sending invite email:", error);
        return null;
    }
    return null; // Ensure all paths return
});
// Initialize TTS Client
const ttsClient = new text_to_speech_1.TextToSpeechClient();
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
exports.analyzeTrends = functions.https.onCall(async (data, context) => {
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
    }
    catch (error) {
        console.error("Error analyzing trends:", error);
        return { error: "Failed to analyze trends." };
    }
});
/**
 * 2. Generate Study from Topic (The "Brain")
 */
exports.generateStudy = functions.https.onCall(async (data, context) => {
    const { topic, sourceUrl } = data;
    if (!topic)
        return { error: "Topic is required." };
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
    }
    catch (error) {
        console.error("Error generating study:", error);
        return { error: "Failed to generate study." };
    }
});
/**
 * 3. Generate Daily Podcast (The "Voice")
 */
exports.generateDailyPodcast = functions.https.onCall(async (data, context) => {
    try {
        const trendsSnap = await db.collection("admin_insights")
            .where("type", "==", "daily_trends")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        if (trendsSnap.empty)
            return { error: "No trends found." };
        const trends = trendsSnap.docs[0].data().trends;
        const scriptPrompt = `
      Crie um roteiro curto (2 min) para o podcast "Bom Dia com Dra. Clara".
      Baseie-se nestas tendências: ${JSON.stringify(trends)}
      Retorne APENAS o texto do roteiro.
    `;
        const result = await model.generateContent(scriptPrompt);
        const scriptText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!scriptText)
            throw new Error("Failed to generate script.");
        const request = {
            input: { text: scriptText },
            voice: { languageCode: "pt-BR", name: "pt-BR-Neural2-A" },
            audioConfig: { audioEncoding: "MP3" },
        };
        const [response] = await ttsClient.synthesizeSpeech(request);
        const audioBuffer = response.audioContent;
        if (!audioBuffer)
            throw new Error("Failed to synthesize speech.");
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
            summary: `Dra. Clara fala sobre ${trends.map((t) => t.topic).join(", ")}`,
            audioUrl: downloadUrl,
            script: scriptText,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            duration: "2:00",
            likes: 0
        });
        return { success: true, id: podcastRef.id, url: downloadUrl };
    }
    catch (error) {
        console.error("Error generating podcast:", error);
        return { error: "Failed to generate podcast." };
    }
});
/**
 * 4. Chat Response (Updated for Native RAG + Web Search)
 */
exports.onNewMessage = functions.firestore
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
            const userRef = db.collection("users").doc(userId);
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            // --- INTERACTION LIMIT LOGIC ---
            const isPremium = userData?.plan === 'premium' || userData?.plan === 'enterprise' || userData?.role === 'admin';
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const lastInteractionDate = userData?.lastInteractionDate?.toDate().toISOString().split('T')[0];
            let currentInteractions = userData?.dailyInteractions;
            // Reset if new day (or if never set)
            if (lastInteractionDate !== todayStr || currentInteractions === undefined) {
                currentInteractions = isPremium ? 9999 : 15;
                await userRef.update({
                    dailyInteractions: currentInteractions,
                    lastInteractionDate: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // Check Limit (Skip for Admin/Premium/Enterprise effectively by high limit, but strict check for free)
            if (currentInteractions <= 0 && !isPremium) {
                await db.collection(`conversations/${conversationId}/messages`).add({
                    type: "bot",
                    content: "Você atingiu seu limite diário de mensagens gratuitas (15/dia). Atualize para o Plano Premium para continuar conversando ilimitadamente! 🌟",
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return null; // Stop execution
            }
            // Decrement Logic
            await userRef.update({
                dailyInteractions: admin.firestore.FieldValue.increment(-1),
                lastInteractionDate: admin.firestore.FieldValue.serverTimestamp()
            });
            // -----------------------------
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
    }
    catch (error) {
        console.error("Error generating response with Gemini:", error);
        console.log("Attempting fallback to OpenAI (GPT-4o-mini)...");
        try {
            // Debug logging for API Key (Masked)
            const configKey = functions.config().openai?.key;
            const envKey = process.env.OPENAI_API_KEY;
            console.log(`[OpenAI Debug] Config Key present: ${!!configKey}, Env Key present: ${!!envKey}`);
            // Initialize OpenAI lazily
            const openai = new openai_1.default({
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
        }
        catch (openaiError) {
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
exports.onUserCreated = functions.firestore
    .document("users/{userId}")
    .onCreate(async (snap, context) => {
    const newUser = snap.data();
    const referrerId = newUser.referredBy;
    if (!referrerId)
        return null;
    try {
        const referrerRef = db.collection("users").doc(referrerId);
        await referrerRef.update({
            energyPoints: admin.firestore.FieldValue.increment(50),
        });
        console.log(`Awarded 50 XP to ${referrerId} for referring ${newUser.uid}`);
        return { success: true };
    }
    catch (error) {
        console.error("Error awarding referral XP:", error);
        return null;
    }
});
/**
 * 6. Stripe Webhook
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    // const sig = req.headers["stripe-signature"]; // Não usado ainda
    const event = req.body;
    try {
        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            console.log("Payment Succeeded:", paymentIntent.id);
            // In a real implementation, you would update the payment status in Firestore
        }
        res.json({ received: true });
    }
    catch (err) {
        console.error(err);
        res.status(400).send(`Webhook Error: ${err}`);
    }
});
__exportStar(require("./payment-functions"), exports);
__exportStar(require("./rag-functions"), exports);
__exportStar(require("./admin-setup"), exports);
//# sourceMappingURL=index.js.map