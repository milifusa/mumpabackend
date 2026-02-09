const admin = require('firebase-admin');
const serviceAccount = require('./mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Mapeo de nombres viejos -> nombres nuevos
const categoryNameMapping = {
  'Motor Grueso': 'Motriz',
  'Cognitivo': 'Cognitiva',
  'Social y Emocional': 'Social',
  'Lenguaje y Comunicación': 'Comunicación'
};

async function fixCategoryIds() {
  try {
    console.log('🚀 Asignando categoryId correctamente...\n');

    // 1. Obtener categorías reales de BD
    const categoriesSnapshot = await db.collection('milestoneCategories').get();
    const categoryNameToId = {};
    
    console.log('📋 Categorías disponibles:');
    categoriesSnapshot.forEach(doc => {
      const data = doc.data();
      categoryNameToId[data.name] = doc.id;
      console.log(`  ✓ "${data.name}" -> ${doc.id}`);
    });
    
    console.log('\n🔄 Actualizando hitos...\n');

    // 2. Obtener todos los hitos
    const milestonesSnapshot = await db.collection('milestones').get();
    console.log(`📊 Total de hitos: ${milestonesSnapshot.size}\n`);

    const batch = db.batch();
    let updated = 0;
    let batchCount = 0;

    for (const doc of milestonesSnapshot.docs) {
      const data = doc.data();
      
      // Si tiene category (nombre viejo) y NO tiene categoryId
      if (data.category && !data.categoryId) {
        // Mapear nombre viejo a nombre nuevo
        const newCategoryName = categoryNameMapping[data.category] || data.category;
        const categoryId = categoryNameToId[newCategoryName];
        
        if (categoryId) {
          batch.update(doc.ref, {
            categoryId: categoryId,
            category: admin.firestore.FieldValue.delete()
          });
          updated++;
          batchCount++;

          if (updated % 50 === 0) {
            console.log(`  Procesados: ${updated}...`);
          }

          // Commit cada 500 operaciones
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        } else {
          console.warn(`  ⚠️  No se encontró categoría para: "${data.category}" -> "${newCategoryName}"`);
        }
      }
    }

    // Commit final
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`\n✅ Hitos actualizados: ${updated}`);

    // Verificar
    console.log('\n🔍 Verificando...');
    const sampleSnapshot = await db.collection('milestones').limit(5).get();
    sampleSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  "${data.title}"`);
      console.log(`    categoryId: ${data.categoryId || 'NO DEFINIDO'}`);
      console.log(`    category (viejo): ${data.category || 'ELIMINADO ✓'}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCategoryIds();
