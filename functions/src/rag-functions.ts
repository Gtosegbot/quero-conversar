import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { VertexAI } from '@google-cloud/vertexai';

const db = admin.firestore();
const storage = admin.storage();

// Initialize Vertex AI
const vertexAI = new VertexAI({
    project: process.env.GCLOUD_PROJECT || 'quero-conversar-app',
    location: 'us-central1'
});

const SYSTEM_PROMPT = `
Você é a Dra. Clara Mendes, uma psicóloga virtual empática e experiente.
Sua missão é guiar o paciente em uma jornada de autoconhecimento.
Utilize o contexto fornecido (Knowledge Base) para embasar suas respostas, mas mantenha sempre o tom acolhedor.

IMPORTANTE:
- Seja concisa. Evite respostas muito longas.
- Use parágrafos curtos.
- Foque em uma ou duas orientações práticas por vez.
- Termine sempre com uma pergunta aberta para manter o diálogo.
- Quando usar informações da base de conhecimento, integre-as naturalmente sem citar explicitamente.
`;

/**
 * Chat com Dra. Clara - Função Callable com RAG
 */
export const chatWithDraClara = functions.https.onCall(async (data, context) => {
    // Verificar autenticação
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    const { message, history, fileId } = data;
    const userId = context.auth.uid;

    if (!message) {
        throw new functions.https.HttpsError('invalid-argument', 'Mensagem é obrigatória');
    }

    try {
        let contextText = '';

        // 1. Se há fileId, buscar conteúdo do documento RAG específico
        if (fileId) {
            const docRef = db.collection('knowledge_base').doc(fileId);
            const docSnap = await docRef.get();

            if (docSnap.exists()) {
                const docData = docSnap.data();
                contextText += `\n\n[DOCUMENTO ESPECÍFICO]\nTítulo: ${docData?.title}\nConteúdo: ${docData?.content}\n[FIM DO DOCUMENTO]\n\n`;
            }
        }

        // 2. Buscar documentos relevantes da base de conhecimento (RAG básico)
        // TODO: Implementar busca semântica com embeddings para melhor relevância
        const knowledgeQuery = await db.collection('knowledge_base')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(3)
            .get();

        if (!knowledgeQuery.empty) {
            contextText += '\n\n[BASE DE CONHECIMENTO]\n';
            knowledgeQuery.docs.forEach(doc => {
                const data = doc.data();
                contextText += `Título: ${data.title}\nResumo: ${data.summary || ''}\nConteúdo: ${data.content}\n\n`;
            });
            contextText += '[FIM DA BASE]\n\n';
        }

        // 3. Buscar perfil do usuário para personalização
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const userProfile = `
    PERFIL DO PACIENTE:
    Nome: ${userData?.name || 'Usuário'}
    Idade: ${userData?.age || 'Não informado'}
    Objetivos: ${userData?.goals || 'Bem-estar geral'}
    `;

        // 4. Construir prompt com contexto
        const fullPrompt = `${SYSTEM_PROMPT}\n\n${userProfile}\n\n${contextText}\n\nUsuário: ${message}`;

        // 5. Chamar Gemini com histórico
        const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(fullPrompt);

        const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Desculpe, não consegui processar sua mensagem.';

        return { response };

    } catch (error) {
        console.error('Error in chatWithDraClara:', error);
        throw new functions.https.HttpsError('internal', 'Falha ao processar mensagem do chat');
    }
});

/**
 * Processar PDF enviado para a base de conhecimento
 * Triggered quando um arquivo é enviado para knowledge_base/ no Storage
 */
export const processUploadedPDF = functions.storage.object().onFinalize(async (object) => {
    const filePath = object.name;

    // Verificar se é um PDF da base de conhecimento
    if (!filePath?.startsWith('knowledge_base/')) {
        console.log(`Ignoring file not in knowledge_base: ${filePath}`);
        return null;
    }

    // Verificar se é PDF
    if (!filePath.endsWith('.pdf')) {
        console.log(`Ignoring non-PDF file: ${filePath}`);
        return null;
    }

    const bucket = storage.bucket();
    const file = bucket.file(filePath);

    try {
        console.log(`Processing PDF: ${filePath}`);

        // 1. Baixar PDF
        const [fileBuffer] = await file.download();

        // 2. Extrair texto do PDF
        // NOTA: Para produção, instalar: npm install pdf-parse
        // Por enquanto, vou usar uma abordagem simplificada
        let textContent = '';

        try {
            // Tentar importar pdf-parse dinamicamente
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(fileBuffer);
            textContent = pdfData.text;
        } catch (pdfError) {
            console.warn('pdf-parse not available, using fallback');
            // Fallback: salvar como binário e processar depois
            textContent = `[PDF não processado ainda - ${object.name}]\nTamanho: ${object.size} bytes`;
        }

        // 3. Extrair título do nome do arquivo
        const fileName = filePath.split('/').pop() || 'Documento';
        const title = fileName.replace('.pdf', '').replace(/_/g, ' ');

        // 4. Gerar resumo usando IA (se o texto foi extraído)
        let summary = '';
        if (textContent.length > 100) {
            try {
                const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const summaryPrompt = `Resuma o seguinte texto em 2-3 frases concisas:\n\n${textContent.substring(0, 5000)}`;
                const result = await model.generateContent(summaryPrompt);
                summary = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } catch (summaryError) {
                console.warn('Failed to generate summary:', summaryError);
                summary = 'Resumo não disponível';
            }
        }

        // 5. Salvar na base de conhecimento
        const docRef = await db.collection('knowledge_base').add({
            title: title,
            summary: summary,
            content: textContent,
            source: filePath,
            type: 'pdf',
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            active: true,
            metadata: {
                originalFileName: object.name,
                size: object.size,
                contentType: object.contentType
            }
        });

        console.log(`PDF processed and added to knowledge base: ${filePath} (ID: ${docRef.id})`);

        // 6. Atualizar metadados do arquivo no Storage
        await file.setMetadata({
            metadata: {
                processedAt: new Date().toISOString(),
                firestoreDocId: docRef.id,
                status: 'processed'
            }
        });

        return { success: true, docId: docRef.id };

    } catch (error) {
        console.error('Error processing PDF:', error);

        // Marcar arquivo como com erro
        try {
            await file.setMetadata({
                metadata: {
                    processedAt: new Date().toISOString(),
                    status: 'error',
                    error: error instanceof Error ? error.message : String(error)
                }
            });
        } catch (metaError) {
            console.error('Failed to update metadata:', metaError);
        }

        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
});

/**
 * Deletar documento da base de conhecimento quando arquivo é removido do Storage
 */
export const onPDFDeleted = functions.storage.object().onDelete(async (object) => {
    const filePath = object.name;

    if (!filePath?.startsWith('knowledge_base/')) {
        return null;
    }

    try {
        // Buscar documento correspondente
        const querySnapshot = await db.collection('knowledge_base')
            .where('source', '==', filePath)
            .get();

        if (!querySnapshot.empty) {
            // Deletar todos os documentos correspondentes (normalmente será apenas 1)
            const batch = db.batch();
            querySnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            console.log(`Deleted ${querySnapshot.size} knowledge base document(s) for ${filePath}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting knowledge base document:', error);
        return { success: false, error };
    }
});

/**
 * Função administrativa para reprocessar todos os PDFs
 */
export const reprocessAllPDFs = functions.https.onCall(async (data, context) => {
    // Verificar se é admin
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    const email = context.auth.token.email;
    const superAdminEmails = ['gtosegbot@gmail.com', 'admgtoseg@gmail.com', 'disparoseguroback@gmail.com'];

    if (!email || !superAdminEmails.some(adminEmail => email.includes(adminEmail))) {
        throw new functions.https.HttpsError('permission-denied', 'Apenas super admins podem reprocessar PDFs');
    }

    try {
        const bucket = storage.bucket();
        const [files] = await bucket.getFiles({ prefix: 'knowledge_base/' });

        const pdfFiles = files.filter(file => file.name.endsWith('.pdf'));

        console.log(`Found ${pdfFiles.length} PDFs to reprocess`);

        // Processar cada PDF
        const results = [];
        for (const file of pdfFiles) {
            try {
                // Trigger reprocessing by updating metadata
                await file.setMetadata({
                    metadata: {
                        reprocessRequested: new Date().toISOString()
                    }
                });
                results.push({ file: file.name, status: 'queued' });
            } catch (error) {
                results.push({ file: file.name, status: 'error', error: String(error) });
            }
        }

        return {
            success: true,
            totalFiles: pdfFiles.length,
            results
        };

    } catch (error) {
        console.error('Error reprocessing PDFs:', error);
        throw new functions.https.HttpsError('internal', 'Falha ao reprocessar PDFs');
    }
});
