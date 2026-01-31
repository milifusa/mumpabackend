// Seed de curvas de percentiles para weight/height/head (M/F)
require('dotenv').config();
const admin = require('firebase-admin');

const requiredEnvVars = [
  'FIREBASE_TYPE',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_AUTH_URI',
  'FIREBASE_TOKEN_URI',
  'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
  'FIREBASE_CLIENT_X509_CERT_URL'
];

const missingVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingVars.length > 0) {
  console.error(`❌ Faltan variables de entorno: ${missingVars.join(', ')}`);
  process.exit(1);
}

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY
    .replace(/\\n/g, '\n')
    .replace(/"/g, '')
    .trim(),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'mumpabackend.firebasestorage.app'
  });
}

const db = admin.firestore();

const buildDefaultPercentiles = (sex, type) => {
  const presets = {
    weight: {
      F: { start: { p3: 2.4, p50: 3.2, p97: 4.0 }, end: { p3: 5.8, p50: 7.2, p97: 8.6 } },
      M: { start: { p3: 2.5, p50: 3.3, p97: 4.1 }, end: { p3: 6.0, p50: 7.5, p97: 9.0 } }
    },
    height: {
      F: { start: { p3: 46.5, p50: 49.1, p97: 52.0 }, end: { p3: 60.5, p50: 65.0, p97: 69.5 } },
      M: { start: { p3: 47.0, p50: 49.9, p97: 53.0 }, end: { p3: 61.5, p50: 66.5, p97: 71.0 } }
    },
    head: {
      F: { start: { p3: 32.0, p50: 34.0, p97: 36.0 }, end: { p3: 40.0, p50: 42.0, p97: 44.0 } },
      M: { start: { p3: 32.5, p50: 34.5, p97: 36.5 }, end: { p3: 40.5, p50: 42.5, p97: 44.5 } }
    }
  };

  const preset = presets[type]?.[sex];
  if (!preset) return [];

  const points = [];
  const totalWeeks = 26;
  for (let week = 0; week <= totalWeeks; week += 1) {
    const ratio = totalWeeks === 0 ? 0 : week / totalWeeks;
    const lerp = (a, b) => a + (b - a) * ratio;
    points.push({
      ageWeeks: week,
      p3: lerp(preset.start.p3, preset.end.p3),
      p50: lerp(preset.start.p50, preset.end.p50),
      p97: lerp(preset.start.p97, preset.end.p97)
    });
  }
  return points;
};

const seed = async () => {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const types = ['weight', 'height', 'head'];
  const sexes = ['F', 'M'];
  const batch = db.batch();

  types.forEach((type) => {
    sexes.forEach((sex) => {
      const docId = `${type}_${sex}`;
      const ref = db.collection('growth_percentiles').doc(docId);
      batch.set(ref, {
        type,
        sex,
        points: buildDefaultPercentiles(sex, type),
        createdAt: now,
        updatedAt: now
      }, { merge: true });
    });
  });

  await batch.commit();
  console.log('✅ Curvas de percentiles cargadas (weight/height/head, M/F).');
};

seed().catch((error) => {
  console.error('❌ Error cargando curvas:', error);
  process.exit(1);
});
