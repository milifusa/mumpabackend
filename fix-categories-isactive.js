const admin = require('firebase-admin');
const serviceAccount = require('./mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixCategories() {
  try {
    console.log('🔍 Verificando categorías...\n');

    const snapshot = await db.collection('milestoneCategories').get();
    
    console.log(`📊 Total de categorías: ${snapshot.size}\n`);

    const batch = db.batch();
    let updated = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Categoría: ${data.name}`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  isActive: ${data.isActive !== undefined ? data.isActive : 'NO DEFINIDO'}`);
      
      if (data.isActive === undefined) {
        console.log(`  ✅ Actualizando para agregar isActive: true`);
        batch.update(doc.ref, { isActive: true });
        updated++;
      }
      console.log('---\n');
    });

    if (updated > 0) {
      await batch.commit();
      console.log(`\n✅ ${updated} categorías actualizadas con isActive: true`);
    } else {
      console.log('\n✅ Todas las categorías ya tienen isActive definido');
    }

    // Verificar resultado
    console.log('\n🔍 Verificando después de actualizar...');
    const verifySnapshot = await db.collection('milestoneCategories').get();
    
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`${data.name}: isActive = ${data.isActive}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCategories();
