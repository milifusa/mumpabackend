const admin = require('firebase-admin');
const serviceAccount = require('./mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listCategories() {
  const snapshot = await db.collection('milestoneCategories').get();
  console.log('📋 Categorías en la base de datos:\n');
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Nombre: "${data.name}"`);
    console.log(`---`);
  });
  process.exit(0);
}

listCategories();
