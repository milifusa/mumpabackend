const admin = require('firebase-admin');
const serviceAccount = require('./mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkMilestones() {
  try {
    console.log('🔍 Verificando hitos...\n');

    // Ver algunos hitos de los primeros meses
    const snapshot = await db.collection('milestones')
      .where('ageMonthsMin', '<=', 4)
      .limit(10)
      .get();

    console.log(`📊 Hitos encontrados para primeros meses: ${snapshot.size}\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Hito: ${data.title}`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  categoryId: ${data.categoryId || 'NO DEFINIDO'}`);
      console.log(`  ageMonthsMin: ${data.ageMonthsMin || 'NO DEFINIDO'}`);
      console.log(`  ageMonthsMax: ${data.ageMonthsMax || 'NO DEFINIDO'}`);
      console.log(`  isActive: ${data.isActive !== undefined ? data.isActive : 'NO DEFINIDO'}`);
      console.log('---\n');
    });

    // Ver todos los que deberían estar para el mes 1
    const month1Snapshot = await db.collection('milestones')
      .where('ageMonthsMin', '==', 1)
      .get();
    
    console.log(`\n📅 Hitos para el mes 1: ${month1Snapshot.size}`);

    // Ver si hay alguno con isActive = false
    const inactiveSnapshot = await db.collection('milestones')
      .where('isActive', '==', false)
      .limit(5)
      .get();
    
    console.log(`\n⚠️  Hitos inactivos: ${inactiveSnapshot.size}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMilestones();
