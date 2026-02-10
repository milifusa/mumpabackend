#!/usr/bin/env node

/**
 * Script para agregar un espacio al final del displayName de todos los usuarios
 * Uso: node scripts/add-space-to-usernames.js
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

async function addSpaceToUsernames() {
  try {
    console.log('🔄 Iniciando actualización de nombres de usuarios...\n');

    // Obtener todos los usuarios
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`📊 Total de usuarios encontrados: ${usersSnapshot.size}\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Verificar si tiene displayName
      if (!userData.displayName) {
        console.log(`⏭️  Usuario ${userId}: Sin displayName, saltando...`);
        skipped++;
        continue;
      }

      // Verificar si ya termina en espacio
      if (userData.displayName.endsWith(' ')) {
        console.log(`⏭️  ${userData.displayName}: Ya tiene espacio al final`);
        skipped++;
        continue;
      }

      try {
        const newDisplayName = userData.displayName + ' ';
        
        await db.collection('users').doc(userId).update({
          displayName: newDisplayName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ "${userData.displayName}" → "${newDisplayName}"`);
        updated++;

        // Pequeña pausa para no saturar Firestore
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        console.error(`❌ Error actualizando ${userData.displayName}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ⏭️  Saltados: ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📝 Total: ${usersSnapshot.size}`);

    if (updated > 0) {
      console.log('\n🎉 ¡Actualización completada exitosamente!');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
console.log('⚠️  Este script agregará un espacio al final del displayName de todos los usuarios.');
console.log('   Presiona Ctrl+C en los próximos 3 segundos para cancelar...\n');

setTimeout(() => {
  addSpaceToUsernames();
}, 3000);
