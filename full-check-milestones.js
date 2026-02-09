const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fullCheck() {
  try {
    console.log('🔍 Verificación completa de hitos...\n');

    // Obtener todos los hitos
    const snapshot = await db.collection('milestones').get();

    console.log(`📊 TOTAL DE HITOS: ${snapshot.size}\n`);

    // Agrupar por mes
    const byMonth = {};
    const byCategory = {};
    let withoutCategory = 0;
    let withoutAge = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Verificar categoría
      if (!data.category) {
        withoutCategory++;
      } else {
        byCategory[data.category] = (byCategory[data.category] || 0) + 1;
      }

      // Verificar edad
      if (!data.ageRangeMonths || !data.ageRangeMonths.min) {
        withoutAge++;
      } else {
        const month = data.ageRangeMonths.min;
        byMonth[month] = (byMonth[month] || 0) + 1;
      }
    });

    console.log('📅 HITOS POR MES:');
    for (let i = 1; i <= 12; i++) {
      const count = byMonth[i] || 0;
      console.log(`  Mes ${i}: ${count} hitos`);
    }

    console.log('\n🏷️  HITOS POR CATEGORÍA:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} hitos`);
    });

    console.log('\n⚠️  PROBLEMAS:');
    console.log(`  Sin categoría: ${withoutCategory}`);
    console.log(`  Sin rango de edad: ${withoutAge}`);

    // Mostrar ejemplos de cada mes
    console.log('\n📋 EJEMPLOS (primeros 3 meses):');
    for (let month = 1; month <= 3; month++) {
      const monthSnapshot = await db.collection('milestones')
        .where('ageRangeMonths.min', '==', month)
        .limit(2)
        .get();
      
      console.log(`\n  📅 Mes ${month}:`);
      monthSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`    - [${data.category}] ${data.title}`);
      });
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fullCheck();
