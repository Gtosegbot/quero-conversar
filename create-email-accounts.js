const admin = require('firebase-admin');

// Inicializar com credenciais padrão do ambiente
admin.initializeApp({
    projectId: 'quero-conversar-app'
});

const users = [
    { email: 'disparoseguroback@gmail.com', name: 'Disparo Seguro', admin: true },
    { email: 'teste.prof@exemplo.com', name: 'Profissional Teste', admin: false },
    { email: 'teste.parceiro@exemplo.com', name: 'Parceiro Teste', admin: false }
];

async function createUsers() {
    console.log('🔧 Criando contas com email/senha...\n');

    for (const u of users) {
        try {
            const user = await admin.auth().createUser({
                email: u.email,
                password: 'Temp2025!@#',
                emailVerified: true,
                displayName: u.name
            });

            if (u.admin) {
                await admin.auth().setCustomUserClaims(user.uid, { admin: true });
            }

            console.log(`✅ ${u.email}`);
            console.log(`   Senha: Temp2025!@#`);
            console.log(`   Admin: ${u.admin}`);
            console.log('');
        } catch (err) {
            if (err.code === 'auth/email-already-exists') {
                console.log(`ℹ️  ${u.email} já existe - atualizando senha...`);
                const user = await admin.auth().getUserByEmail(u.email);
                await admin.auth().updateUser(user.uid, { password: 'Temp2025!@#' });
                if (u.admin) {
                    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
                }
                console.log(`✅ Senha atualizada: Temp2025!@#`);
                console.log('');
            } else {
                console.error(`❌ ${u.email}:`, err.message);
            }
        }
    }

    console.log('🎉 Concluído!\n');
    console.log('📝 Para fazer login:');
    console.log('1. Ir em: https://quero-conversar.vercel.app/auth');
    console.log('2. Clicar em "Entrar com Email"');
    console.log('3. Email: disparoseguroback@gmail.com');
    console.log('4. Senha: Temp2025!@#');
    console.log('\n⚠️  Troque a senha após primeiro login!');
}

createUsers()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Erro fatal:', err);
        process.exit(1);
    });
