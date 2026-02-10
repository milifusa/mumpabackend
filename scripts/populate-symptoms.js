#!/usr/bin/env node

/**
 * Script para poblar síntomas en el sistema de consultas médicas
 * Uso: node scripts/populate-symptoms.js
 */

const axios = require('axios');

// ⚠️ CONFIGURACIÓN
const API_URL = 'https://api.munpa.online';  // Cambiar si es diferente
const ADMIN_TOKEN = 'TU_ADMIN_TOKEN_AQUI';   // ⚠️ Reemplazar con tu token real

// 🩺 Lista completa de síntomas
const symptoms = [
  // ==================== GENERAL ====================
  {
    name: 'Fiebre',
    description: 'Temperatura corporal elevada por encima de 37.5°C',
    category: 'general',
    severity: 'moderate',
    order: 1
  },
  {
    name: 'Dolor General',
    description: 'Malestar o dolor en cualquier parte del cuerpo',
    category: 'general',
    severity: 'moderate',
    order: 2
  },
  {
    name: 'Irritabilidad',
    description: 'El bebé está más inquieto o llorón de lo normal',
    category: 'general',
    severity: 'mild',
    order: 3
  },
  {
    name: 'Falta de Apetito',
    description: 'No quiere comer o rechaza alimentos',
    category: 'general',
    severity: 'moderate',
    order: 4
  },
  {
    name: 'Sueño Excesivo',
    description: 'Duerme mucho más de lo habitual',
    category: 'general',
    severity: 'moderate',
    order: 5
  },

  // ==================== DIGESTIVO ====================
  {
    name: 'Vómito',
    description: 'Expulsión forzada del contenido del estómago',
    category: 'digestivo',
    severity: 'moderate',
    order: 6
  },
  {
    name: 'Diarrea',
    description: 'Heces líquidas o muy blandas, más frecuentes',
    category: 'digestivo',
    severity: 'moderate',
    order: 7
  },
  {
    name: 'Estreñimiento',
    description: 'Dificultad para evacuar, heces duras',
    category: 'digestivo',
    severity: 'mild',
    order: 8
  },
  {
    name: 'Gases Excesivos',
    description: 'Mucha acumulación de gas en el estómago',
    category: 'digestivo',
    severity: 'mild',
    order: 9
  },
  {
    name: 'Cólicos',
    description: 'Llanto intenso y prolongado, abdomen tenso',
    category: 'digestivo',
    severity: 'moderate',
    order: 10
  },
  {
    name: 'Reflujo',
    description: 'Regurgitación frecuente después de comer',
    category: 'digestivo',
    severity: 'mild',
    order: 11
  },

  // ==================== RESPIRATORIO ====================
  {
    name: 'Tos Seca',
    description: 'Tos sin flema, irritativa',
    category: 'respiratorio',
    severity: 'mild',
    order: 12
  },
  {
    name: 'Tos con Flema',
    description: 'Tos productiva con secreciones',
    category: 'respiratorio',
    severity: 'moderate',
    order: 13
  },
  {
    name: 'Congestión Nasal',
    description: 'Nariz tapada, dificultad para respirar por la nariz',
    category: 'respiratorio',
    severity: 'mild',
    order: 14
  },
  {
    name: 'Dificultad para Respirar',
    description: 'Respiración rápida o laboriosa',
    category: 'respiratorio',
    severity: 'severe',
    order: 15
  },
  {
    name: 'Sibilancias',
    description: 'Silbido al respirar',
    category: 'respiratorio',
    severity: 'moderate',
    order: 16
  },
  {
    name: 'Estornudos Frecuentes',
    description: 'Estornudos repetidos',
    category: 'respiratorio',
    severity: 'mild',
    order: 17
  },

  // ==================== PIEL ====================
  {
    name: 'Sarpullido',
    description: 'Erupción cutánea, manchas rojas',
    category: 'piel',
    severity: 'moderate',
    order: 18
  },
  {
    name: 'Dermatitis del Pañal',
    description: 'Enrojecimiento e irritación en el área del pañal',
    category: 'piel',
    severity: 'moderate',
    order: 19
  },
  {
    name: 'Urticaria',
    description: 'Ronchas o habones en la piel',
    category: 'piel',
    severity: 'moderate',
    order: 20
  },
  {
    name: 'Piel Seca o Escamosa',
    description: 'Resequedad o descamación de la piel',
    category: 'piel',
    severity: 'mild',
    order: 21
  },
  {
    name: 'Eccema',
    description: 'Parches de piel seca, enrojecida y con picazón',
    category: 'piel',
    severity: 'moderate',
    order: 22
  },

  // ==================== NEUROLÓGICO ====================
  {
    name: 'Convulsiones',
    description: 'Movimientos involuntarios o pérdida de conciencia',
    category: 'neurologico',
    severity: 'severe',
    order: 23
  },
  {
    name: 'Temblores',
    description: 'Movimientos involuntarios suaves',
    category: 'neurologico',
    severity: 'moderate',
    order: 24
  },
  {
    name: 'Debilidad o Letargo',
    description: 'Falta de energía, muy decaído',
    category: 'neurologico',
    severity: 'moderate',
    order: 25
  },

  // ==================== OJOS Y OÍDOS ====================
  {
    name: 'Conjuntivitis',
    description: 'Ojos rojos, lagrimeo, secreción',
    category: 'ojos_oidos',
    severity: 'moderate',
    order: 26
  },
  {
    name: 'Dolor de Oído',
    description: 'Se toca o jala la oreja, llanto al acostarse',
    category: 'ojos_oidos',
    severity: 'moderate',
    order: 27
  },
  {
    name: 'Supuración de Oído',
    description: 'Líquido saliendo del oído',
    category: 'ojos_oidos',
    severity: 'moderate',
    order: 28
  },
  {
    name: 'Ojos Llorosos',
    description: 'Lagrimeo excesivo',
    category: 'ojos_oidos',
    severity: 'mild',
    order: 29
  },

  // ==================== OTROS ====================
  {
    name: 'Accidente o Caída',
    description: 'Golpe, caída o trauma reciente',
    category: 'otros',
    severity: 'severe',
    order: 30
  },
  {
    name: 'Intoxicación Sospechosa',
    description: 'Posible ingesta de sustancia tóxica',
    category: 'otros',
    severity: 'severe',
    order: 31
  },
  {
    name: 'Reacción Alérgica',
    description: 'Hinchazón, ronchas o dificultad respiratoria',
    category: 'otros',
    severity: 'severe',
    order: 32
  },
  {
    name: 'Sangrado',
    description: 'Sangrado que no para o en lugares inusuales',
    category: 'otros',
    severity: 'severe',
    order: 33
  },
  {
    name: 'Otro Síntoma',
    description: 'Algo diferente que te preocupa',
    category: 'otros',
    severity: 'moderate',
    order: 34
  }
];

// Función para crear un síntoma
async function createSymptom(symptom) {
  try {
    const response = await axios.post(
      `${API_URL}/api/admin/symptoms`,
      symptom,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Creado: ${symptom.name}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error creando ${symptom.name}:`, error.response.data.message);
    } else {
      console.error(`❌ Error creando ${symptom.name}:`, error.message);
    }
    return null;
  }
}

// Función principal
async function populateSymptoms() {
  console.log('🩺 Iniciando población de síntomas...\n');

  if (ADMIN_TOKEN === 'TU_ADMIN_TOKEN_AQUI') {
    console.error('❌ ERROR: Debes configurar tu ADMIN_TOKEN en el script');
    console.log('\n📝 Obtén tu token desde el dashboard admin o genera uno nuevo.\n');
    process.exit(1);
  }

  let created = 0;
  let failed = 0;

  for (const symptom of symptoms) {
    const result = await createSymptom(symptom);
    if (result) {
      created++;
    } else {
      failed++;
    }
    
    // Pequeña pausa para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Resumen:');
  console.log(`   ✅ Creados: ${created}`);
  console.log(`   ❌ Fallidos: ${failed}`);
  console.log(`   📝 Total: ${symptoms.length}`);

  if (created > 0) {
    console.log('\n🎉 ¡Síntomas creados exitosamente!');
    console.log(`\n👉 Verifica en: ${API_URL}/api/symptoms\n`);
  }
}

// Ejecutar
populateSymptoms().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
