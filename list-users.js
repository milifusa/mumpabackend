const admin = require('firebase-admin');

// Configurar Firebase Admin
const serviceAccount = require('./mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listUsers() {
  try {
    console.log('📋 Listando todos los usuarios...\n');
    
    // Listar usuarios de Firebase Auth
    const listUsersResult = await admin.auth().listUsers(100);
    
    console.log(`Total usuarios en Firebase Auth: ${listUsersResult.users.length}\n`);
    
    for (const userRecord of listUsersResult.users) {
      console.log('─'.repeat(50));
      console.log('👤 Usuario:', userRecord.email);
      console.log('   UID:', userRecord.uid);
      console.log('   Display Name:', userRecord.displayName || 'N/A');
      console.log('   Provider:', userRecord.providerData.map(p => p.providerId).join(', '));
      
      // Obtener datos de Firestore
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('   Firestore:');
        console.log('     - role:', userData.role || 'N/A');
        console.log('     - isAdmin:', userData.isAdmin || false);
        console.log('     - isActive:', userData.isActive !== false);
      } else {
        console.log('   Firestore: ❌ No existe documento');
      }
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();

