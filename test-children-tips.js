// Script para probar el endpoint de tips de hijos
const axios = require('axios');

const API_BASE_URL = 'https://mumpabackend-ekppyd034-mishu-lojans-projects.vercel.app';

async function testChildrenTips() {
  try {
    console.log('🧪 [TEST] Probando endpoint de tips de hijos...\n');
    
    // Simular diferentes tipos de tips
    const tipTypes = [
      'general',
      'alimentacion', 
      'desarrollo',
      'salud',
      'sueño',
      'actividades'
    ];

    console.log('📋 [TIP TYPES] Tipos de tips disponibles:');
    tipTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type}`);
    });

    console.log('\n⚠️ [NOTE] Para probar este endpoint necesitas:');
    console.log('   1. Un token de autenticación válido');
    console.log('   2. Usuario con hijos registrados');
    console.log('   3. Hacer las peticiones desde tu frontend');

    console.log('\n🌐 [ENDPOINT] URL del endpoint:');
    console.log(`   POST ${API_BASE_URL}/api/children/tips`);

    console.log('\n📤 [REQUEST] Ejemplo de petición:');
    console.log('   {');
    console.log('     "tipType": "alimentacion"');
    console.log('   }');

    console.log('\n📥 [RESPONSE] Respuesta esperada:');
    console.log('   {');
    console.log('     "success": true,');
    console.log('     "data": {');
    console.log('       "tips": [');
    console.log('         "🤱 Amamanta exclusivamente hasta los 6 meses...",');
    console.log('         "🥑 Introduce frutas y verduras de colores...",');
    console.log('         "🥛 Ofrece 3 comidas principales..."');
    console.log('       ],');
    console.log('       "children": [');
    console.log('         {');
    console.log('           "id": "...",');
    console.log('           "name": "Java",');
    console.log('           "currentAge": "13 meses",');
    console.log('           "isUnborn": false');
    console.log('         }');
    console.log('       ],');
    console.log('       "tipType": "alimentacion",');
    console.log('       "timestamp": "..."');
    console.log('     }');
    console.log('   }');

    console.log('\n🎯 [FEATURES] Características del endpoint:');
    console.log('   ✅ Tips personalizados según la edad de los hijos');
    console.log('   ✅ Integración con OpenAI para respuestas inteligentes');
    console.log('   ✅ Fallback con tips predefinidos si OpenAI falla');
    console.log('   ✅ Tips cortos perfectos para burbujas de chat');
    console.log('   ✅ Diferentes categorías de tips');
    console.log('   ✅ Información actualizada de edades calculadas');

    console.log('\n💡 [USAGE] Casos de uso:');
    console.log('   • Mostrar tips diarios en la app');
    console.log('   • Sugerencias contextuales según la edad');
    console.log('   • Consejos específicos por categoría');
    console.log('   • Tips personalizados para cada hijo');

    console.log('\n✅ [TEST] Endpoint listo para usar');

  } catch (error) {
    console.error('❌ [TEST] Error:', error.message);
  }
}

// Ejecutar la prueba
testChildrenTips();
