/**
 * Script para actualizar profesionales existentes
 * Agrega campos de consultas médicas a profesionales que solo tienen datos de artículos
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Inicializar Firebase Admin
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

async function updateProfessionals() {
  try {
    console.log('🔄 Iniciando actualización de profesionales...\n');
    
    // Obtener todos los profesionales
    const snapshot = await db.collection('professionals').get();
    
    console.log(`📊 Total de profesionales encontrados: ${snapshot.size}\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const id = doc.id;
      
      // Si ya tiene canAcceptConsultations, saltar
      if (data.canAcceptConsultations !== undefined) {
        console.log(`⏭️  ${data.name}: Ya tiene canAcceptConsultations (${data.canAcceptConsultations})`);
        skipped++;
        continue;
      }
      
      console.log(`\n✏️  Actualizando: ${data.name} (${id})`);
      
      // Determinar accountType basado en specialties
      let accountType = 'specialist'; // Por defecto
      const specialties = data.specialties || [];
      
      if (specialties.some(s => s.toLowerCase().includes('nutrición') || s.toLowerCase().includes('nutricionista'))) {
        accountType = 'nutritionist';
      } else if (specialties.some(s => s.toLowerCase().includes('lactancia') || s.toLowerCase().includes('doula') || s.toLowerCase().includes('sueño'))) {
        accountType = 'coach';
      } else if (specialties.some(s => s.toLowerCase().includes('psicólog'))) {
        accountType = 'psychologist';
      }
      
      console.log(`   📋 Tipo detectado: ${accountType}`);
      
      // Datos a agregar
      const updateData = {
        // Habilitar consultas
        canAcceptConsultations: true,
        accountType: accountType,
        
        // Información profesional
        professionalInfo: {
          licenseNumber: null,
          university: null,
          yearsExperience: 5,
          certifications: []
        },
        
        // Disponibilidad
        availability: {
          schedule: {},
          timezone: 'America/Guayaquil',
          maxConsultationsPerDay: 10
        },
        
        // Precios de consultas
        consultationPricing: {
          chatConsultation: 25,
          videoConsultation: 40,
          currency: 'USD',
          acceptsFreeConsultations: false
        },
        
        // Estadísticas iniciales
        consultationStats: {
          totalConsultations: 0,
          averageRating: 0,
          responseTime: 0,
          completionRate: 100
        },
        
        // Permisos según tipo
        permissions: {
          canAcceptConsultations: true,
          canPrescribe: accountType === 'specialist',
          canDiagnose: ['specialist', 'psychologist'].includes(accountType),
          canSellProducts: ['nutritionist', 'coach'].includes(accountType),
          canCreateMealPlans: accountType === 'nutritionist',
          canWriteArticles: true
        },
        
        updatedAt: new Date()
      };
      
      // Actualizar en Firestore
      await db.collection('professionals').doc(id).update(updateData);
      
      console.log(`   ✅ Actualizado exitosamente`);
      console.log(`      - canAcceptConsultations: true`);
      console.log(`      - accountType: ${accountType}`);
      console.log(`      - consultationPricing: $25 chat / $40 video`);
      
      updated++;
      
      // Pausa para no sobrecargar Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Resumen:');
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ⏭️  Saltados: ${skipped}`);
    console.log(`   📝 Total: ${snapshot.size}`);
    console.log('='.repeat(50));
    
    if (updated > 0) {
      console.log('\n🎉 ¡Actualización completada exitosamente!');
      console.log('\nAhora todos los profesionales pueden:');
      console.log('  ✅ Aceptar consultas médicas');
      console.log('  ✅ Aparecer en el endpoint /api/admin/specialists');
      console.log('  ✅ Ser vinculados con usuarios del app');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Timeout de seguridad
setTimeout(() => {
  console.error('❌ Timeout: El script tardó más de 2 minutos');
  process.exit(1);
}, 120000);

console.log('🚀 Iniciando script de actualización de profesionales...\n');
updateProfessionals();
