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

const rawItems = [
  { id: 'bcg', name: 'BCG', ageMonths: 0, notes: 'Al nacer' },
  { id: 'hepb-birth', name: 'Hepatitis B', ageMonths: 0, notes: 'Al nacer (primeras 24 horas)' },

  { id: 'penta-2m', name: 'Pentavalente', ageMonths: 2, notes: '1ra dosis' },
  { id: 'polio-2m', name: 'Polio (IPV)', ageMonths: 2, notes: '1ra dosis' },
  { id: 'rota-2m', name: 'Rotavirus', ageMonths: 2, notes: '1ra dosis' },
  { id: 'neumo-2m', name: 'Neumococo conjugada', ageMonths: 2, notes: '1ra dosis' },

  { id: 'penta-4m', name: 'Pentavalente', ageMonths: 4, notes: '2da dosis' },
  { id: 'polio-4m', name: 'Polio (IPV)', ageMonths: 4, notes: '2da dosis' },
  { id: 'rota-4m', name: 'Rotavirus', ageMonths: 4, notes: '2da dosis' },
  { id: 'neumo-4m', name: 'Neumococo conjugada', ageMonths: 4, notes: '2da dosis' },

  { id: 'penta-6m', name: 'Pentavalente', ageMonths: 6, notes: '3ra dosis' },
  { id: 'polio-6m', name: 'Polio (IPV)', ageMonths: 6, notes: '3ra dosis' },
  { id: 'hepb-6m', name: 'Hepatitis B', ageMonths: 6, notes: 'Dosis incluida en esquema' },

  { id: 'influenza-6m', name: 'Influenza', ageMonths: 6, notes: '1ra dosis (requiere refuerzo)' },
  { id: 'influenza-7m', name: 'Influenza', ageMonths: 7, notes: '2da dosis (refuerzo)' },

  { id: 'spr-12m', name: 'SRP (Sarampion, Rubeola, Paperas)', ageMonths: 12, notes: '1ra dosis' },
  { id: 'neumo-12m', name: 'Neumococo conjugada', ageMonths: 12, notes: 'Refuerzo' },
  { id: 'fiebre-amarilla-12m', name: 'Fiebre Amarilla', ageMonths: 12, notes: 'Dosis unica (zonas de riesgo)' },

  { id: 'spr-18m', name: 'SRP (Sarampion, Rubeola, Paperas)', ageMonths: 18, notes: '2da dosis' },
  { id: 'polio-18m', name: 'Polio (IPV)', ageMonths: 18, notes: 'Refuerzo' },
  { id: 'dpt-18m', name: 'DPT', ageMonths: 18, notes: 'Refuerzo' },

  { id: 'dpt-5y', name: 'DPT', ageYears: 5, notes: 'Refuerzo escolar' },
  { id: 'polio-5y', name: 'Polio', ageYears: 5, notes: 'Refuerzo escolar' },
  { id: 'spr-5y', name: 'SRP', ageYears: 5, notes: 'Refuerzo' },

  { id: 'hpv-9y', name: 'VPH (Virus del Papiloma Humano)', ageYears: 9, notes: '1ra dosis (ninas y ninos)' },
  { id: 'hpv-9y-2', name: 'VPH (Virus del Papiloma Humano)', ageYears: 9.5, notes: '2da dosis (6 meses despues)' },

  { id: 'td-15y', name: 'Td (Tetano y Difteria)', ageYears: 15, notes: 'Refuerzo adolescentes' },
  { id: 'td-18y', name: 'Td (Tetano y Difteria)', ageYears: 18, notes: 'Refuerzo final adolescencia' }
];

const normalizeItems = (items) => items.map((item) => {
  if (Number.isFinite(item.ageMonths)) {
    return { ...item, ageMonths: item.ageMonths };
  }
  if (Number.isFinite(item.ageYears)) {
    return { ...item, ageMonths: Math.round(item.ageYears * 12 * 10) / 10 };
  }
  return item;
}).map(({ ageYears, ...rest }) => rest);

const seed = async () => {
  const countrySnapshot = await db.collection('countries')
    .where('name', '==', 'Ecuador')
    .limit(1)
    .get();

  if (countrySnapshot.empty) {
    console.error('❌ No existe el pais Ecuador en countries');
    process.exit(1);
  }

  const countryDoc = countrySnapshot.docs[0];
  const countryId = countryDoc.id;
  const countryName = countryDoc.data().name;

  const items = normalizeItems(rawItems);
  const payload = {
    countryId,
    countryName,
    name: 'Calendario Ecuador',
    isActive: true,
    items,
    updatedAt: new Date(),
    createdAt: new Date()
  };

  const existingSnapshot = await db.collection('vaccine_schedules')
    .where('countryId', '==', countryId)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    const existingRef = existingSnapshot.docs[0].ref;
    await existingRef.update({
      ...payload,
      createdAt: existingSnapshot.docs[0].data().createdAt || new Date()
    });
    console.log(`✅ Calendario Ecuador actualizado (${existingSnapshot.docs[0].id})`);
    return;
  }

  const ref = await db.collection('vaccine_schedules').add(payload);
  console.log(`✅ Calendario Ecuador creado (${ref.id})`);
};

seed().catch((error) => {
  console.error('❌ Error cargando calendario Ecuador:', error);
  process.exit(1);
});
