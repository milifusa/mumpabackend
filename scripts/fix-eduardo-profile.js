/**
 * Script para actualizar el professionalProfile del usuario Eduardo
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

async function updateUser() {
  try {
    const userId = '68R3xOI7SDaxcwNe2vw5OjaK4CP2';
    const newSpecialistId = 'btYqYoOjpXJEyTC1k7Ku';
    
    console.log(`🔄 Actualizando usuario ${userId}...`);
    console.log(`   Nuevo specialistId: ${newSpecialistId}\n`);
    
    // Actualizar usuario
    await db.collection('users').doc(userId).update({
      'professionalProfile.specialistId': newSpecialistId,
      'professionalProfile.verifiedAt': new Date(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Usuario actualizado exitosamente');
    
    // Actualizar el profesional con linkedUserId
    await db.collection('professionals').doc(newSpecialistId).update({
      linkedUserId: userId,
      userId: userId,
      updatedAt: new Date()
    });
    
    console.log('✅ Profesional vinculado exitosamente');
    console.log('\n🎉 Proceso completado!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateUser();
