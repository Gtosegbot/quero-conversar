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
exports.checkAdminStatus = exports.listAdmins = exports.setAdminClaim = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Função para configurar Custom Claims de admin
 * Apenas super admins podem executar
 */
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
    // Verificar autenticação
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }
    const callerEmail = context.auth.token.email;
    const superAdminEmails = [
        'gtosegbot@gmail.com',
        'admgtoseg@gmail.com',
        'disparoseguroback@gmail.com'
    ];
    // Verificar se o caller é super admin
    const isSuperAdmin = superAdminEmails.some(email => callerEmail?.includes(email.split('@')[0]));
    if (!isSuperAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Apenas super admins podem configurar claims de admin');
    }
    const { uid, admin: isAdmin } = data;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'UID é obrigatório');
    }
    try {
        // Definir custom claim
        await admin.auth().setCustomUserClaims(uid, { admin: isAdmin === true });
        // Log da operação
        console.log(`Admin claim ${isAdmin ? 'set' : 'removed'} for user ${uid} by ${callerEmail}`);
        return {
            success: true,
            message: `Admin claim ${isAdmin ? 'configurado' : 'removido'} para o usuário ${uid}`,
            uid,
            admin: isAdmin
        };
    }
    catch (error) {
        console.error('Error setting admin claim:', error);
        throw new functions.https.HttpsError('internal', `Falha ao configurar claim: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
});
/**
 * Função para listar todos os admins
 * Apenas super admins podem executar
 */
exports.listAdmins = functions.https.onCall(async (data, context) => {
    // Verificar autenticação
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }
    const callerEmail = context.auth.token.email;
    const superAdminEmails = [
        'gtosegbot@gmail.com',
        'admgtoseg@gmail.com',
        'disparoseguroback@gmail.com'
    ];
    const isSuperAdmin = superAdminEmails.some(email => callerEmail?.includes(email.split('@')[0]));
    if (!isSuperAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Apenas super admins');
    }
    try {
        const admins = [];
        // Listar todos os usuários (em lotes de 1000)
        let nextPageToken;
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            for (const userRecord of listUsersResult.users) {
                // Verificar se tem custom claim admin
                if (userRecord.customClaims?.admin === true) {
                    admins.push({
                        uid: userRecord.uid,
                        email: userRecord.email || 'N/A',
                        displayName: userRecord.displayName || 'N/A'
                    });
                }
            }
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        return {
            success: true,
            admins,
            count: admins.length
        };
    }
    catch (error) {
        console.error('Error listing admins:', error);
        throw new functions.https.HttpsError('internal', 'Falha ao listar admins');
    }
});
/**
 * Função para verificar se um usuário é admin
 * Qualquer usuário autenticado pode verificar
 */
exports.checkAdminStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }
    const { uid } = data;
    const targetUid = uid || context.auth.uid;
    try {
        const userRecord = await admin.auth().getUser(targetUid);
        const isAdmin = userRecord.customClaims?.admin === true;
        return {
            success: true,
            uid: targetUid,
            email: userRecord.email,
            isAdmin
        };
    }
    catch (error) {
        console.error('Error checking admin status:', error);
        throw new functions.https.HttpsError('internal', 'Falha ao verificar status de admin');
    }
});
//# sourceMappingURL=admin-setup.js.map