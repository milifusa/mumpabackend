const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixMilestonesStructure() {
  try {
    console.log('🚀 Corrigiendo estructura de hitos...\n');

    // 1. Obtener todas las categorías para crear el mapeo nombre -> ID
    console.log('📋 Obteniendo categorías...');
    const categoriesSnapshot = await db.collection('milestoneCategories').get();
    
    const categoryNameToId = {};
    categoriesSnapshot.forEach(doc => {
      const data = doc.data();
      categoryNameToId[data.name] = doc.id;
      console.log(`  ✓ ${data.name} -> ${doc.id}`);
    });
    
    console.log('\n🔄 Procesando hitos...\n');

    // 2. Obtener todos los hitos
    const milestonesSnapshot = await db.collection('milestones').get();
    console.log(`📊 Total de hitos a actualizar: ${milestonesSnapshot.size}\n`);

    let updated = 0;
    let errors = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const doc of milestonesSnapshot.docs) {
      const data = doc.data();
      
      try {
        const updates = {};
        let needsUpdate = false;

        // Convertir category (nombre) a categoryId
        if (data.category && !data.categoryId) {
          const categoryId = categoryNameToId[data.category];
          if (categoryId) {
            updates.categoryId = categoryId;
            // Eliminar el campo category antiguo
            updates.category = admin.firestore.FieldValue.delete();
            needsUpdate = true;
          } else {
            console.warn(`⚠️  No se encontró ID para categoría: ${data.category}`);
          }
        }

        // Convertir ageRangeMonths a ageMonthsMin/Max
        if (data.ageRangeMonths && !data.ageMonthsMin) {
          updates.ageMonthsMin = data.ageRangeMonths.min || 0;
          updates.ageMonthsMax = data.ageRangeMonths.max || 0;
          // Eliminar el campo ageRangeMonths antiguo
          updates.ageRangeMonths = admin.firestore.FieldValue.delete();
          needsUpdate = true;
        }

        if (needsUpdate) {
          batch.update(doc.ref, updates);
          batchCount++;
          updated++;

          // Firestore batch tiene límite de 500 operaciones
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`  ✅ Batch de 500 hitos actualizado (total: ${updated})`);
            batchCount = 0;
          }
        }

      } catch (error) {
        errors++;
        console.error(`  ❌ Error en hito ${doc.id}:`, error.message);
      }
    }

    // Commit del batch final
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Batch final de ${batchCount} hitos actualizado`);
    }

    console.log('\n🎉 ¡Corrección completada!');
    console.log(`✅ Hitos actualizados: ${updated}`);
    console.log(`❌ Errores: ${errors}`);

    // Verificar un ejemplo
    console.log('\n🔍 Verificando un ejemplo...');
    const sampleDoc = await db.collection('milestones').limit(1).get();
    if (!sampleDoc.empty) {
      const sample = sampleDoc.docs[0].data();
      console.log('Ejemplo de hito actualizado:');
      console.log(`  title: ${sample.title}`);
      console.log(`  categoryId: ${sample.categoryId || 'NO DEFINIDO'}`);
      console.log(`  ageMonthsMin: ${sample.ageMonthsMin || 'NO DEFINIDO'}`);
      console.log(`  ageMonthsMax: ${sample.ageMonthsMax || 'NO DEFINIDO'}`);
      console.log(`  category (viejo): ${sample.category || 'ELIMINADO ✓'}`);
      console.log(`  ageRangeMonths (viejo): ${sample.ageRangeMonths ? 'AÚN EXISTE' : 'ELIMINADO ✓'}`);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error en corrección:', error);
    process.exit(1);
  }
}

fixMilestonesStructure();
