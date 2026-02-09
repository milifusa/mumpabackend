require('dotenv').config();
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function countUserFields() {
  try {
    console.log('🔍 Consultando usuarios...\n');
    
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    let usersWithDisplayName = 0;
    let usersWithName = 0;
    let usersWithBoth = 0;
    let usersWithNeither = 0;
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const hasDisplayName = userData.displayName && userData.displayName.trim() !== '';
      const hasName = userData.name && userData.name.trim() !== '';
      
      if (hasDisplayName) usersWithDisplayName++;
      if (hasName) usersWithName++;
      if (hasDisplayName && hasName) usersWithBoth++;
      if (!hasDisplayName && !hasName) usersWithNeither++;
    });
    
    console.log('📊 RESULTADOS:');
    console.log('═══════════════════════════════════════');
    console.log(`Total de usuarios: ${totalUsers}`);
    console.log('');
    console.log(`✓ Usuarios con displayName: ${usersWithDisplayName} (${((usersWithDisplayName/totalUsers)*100).toFixed(1)}%)`);
    console.log(`✓ Usuarios con name: ${usersWithName} (${((usersWithName/totalUsers)*100).toFixed(1)}%)`);
    console.log(`✓ Usuarios con ambos campos: ${usersWithBoth} (${((usersWithBoth/totalUsers)*100).toFixed(1)}%)`);
    console.log(`✗ Usuarios sin ninguno: ${usersWithNeither} (${((usersWithNeither/totalUsers)*100).toFixed(1)}%)`);
    console.log('═══════════════════════════════════════');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

countUserFields();
