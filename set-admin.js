const admin = require('firebase-admin');

// Configurar Firebase Admin
const serviceAccount = require('./mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setAdmin() {
  try {
    // Puedes cambiar este email al que uses
    const email = 'mishulo12@gmail.com';
    
    console.log('🔍 Buscando usuario:', email);
    
    // Buscar usuario por email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('✅ Usuario encontrado:', userRecord.uid);
    
    // Actualizar en Firestore
    await db.collection('users').doc(userRecord.uid).set({
      role: 'admin',
      isAdmin: true,
      isActive: true,
      email: userRecord.email,
      displayName: userRecord.displayName || 'Admin',
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('✅ Usuario actualizado como admin en Firestore');
    
    // Verificar
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    console.log('📋 Datos del usuario:', userDoc.data());
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setAdmin();

