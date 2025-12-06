const admin = require('firebase-admin');

// Inicializar Firebase Admin com credenciais do projeto
admin.initializeApp({
  projectId: 'quero-conversar-app'
});

// Seu UID (já sabemos qual é)
const uid = 'dve4dzFuKmOMBwvrereycOZ2Yju2';
const email = 'admgtoseg@gmail.com';

console.log('🔍 Configurando admin para:', email);
console.log('📝 UID:', uid);

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('✅ SUCESSO! Admin claim configurado!');
    console.log('🔄 Faça logout e login novamente no site para aplicar');
    return admin.auth().getUser(uid);
  })
  .then(user => {
    console.log('📊 Custom claims atuais:', user.customClaims);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro:', error.message);
    console.error('💡 Dica: Execute "firebase login" primeiro');
    process.exit(1);
  });
