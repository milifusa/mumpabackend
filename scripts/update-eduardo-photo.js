/**
 * Script rápido para agregar la foto al profesional de Eduardo
 */

require('dotenv').config();
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function updatePhoto() {
  try {
    const professionalId = 'btYqYoOjpXJEyTC1k7Ku';
    const photoUrl = 'https://lh3.googleusercontent.com/a/ACg8ocKXOBfjfMnSTayyEvYzlF9y25k7Bf4PFuZWGb6D97TSInXPkijOKg=s96-c';
    
    console.log(`🔄 Actualizando foto del profesional ${professionalId}...`);
    
    await db.collection('professionals').doc(professionalId).update({
      photoUrl: photoUrl,
      updatedAt: new Date()
    });
    
    console.log('✅ Foto actualizada exitosamente!');
    console.log(`   URL: ${photoUrl}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updatePhoto();
