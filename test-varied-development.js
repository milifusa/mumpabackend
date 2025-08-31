// Script para probar el sistema de respuestas variadas de desarrollo infantil
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-lyop389dp-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para probar respuestas variadas
const testVariedResponses = async (authToken, childName, ageInMonths, isUnborn = false, gestationWeeks = null) => {
  try {
    console.log(`\n👶 [TEST] Probando respuestas variadas para ${childName}...`);
    
    const responses = [];
    const numTests = 5;
    
    for (let i = 1; i <= numTests; i++) {
      console.log(`\n📋 [TEST] Consulta #${i}/${numTests}`);
      
      const response = await api.post('/api/children/development-info', {
        name: childName,
        ageInMonths,
        isUnborn,
        gestationWeeks
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        console.log(`✅ [TEST] Respuesta #${i}:`);
        console.log(`   📊 Bullets obtenidos: ${data.developmentInfo.length}`);
        console.log(`   📈 Consulta #: ${data.responseCount}`);
        console.log(`   🆕 Información nueva: ${data.isNewInfo ? 'Sí' : 'No'}`);
        
        // Mostrar los bullets
        data.developmentInfo.forEach((info, index) => {
          console.log(`   ${index + 1}. ${info.substring(0, 60)}...`);
        });
        
        responses.push(data);
      } else {
        console.log(`❌ [TEST] Error en consulta #${i}:`, response.data.message);
      }
      
      // Esperar entre consultas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Analizar variabilidad
    console.log('\n📊 [ANÁLISIS] Análisis de variabilidad:');
    
    const allBullets = responses.flatMap(r => r.developmentInfo);
    const uniqueBullets = [...new Set(allBullets)];
    
    console.log(`   📈 Total de respuestas: ${responses.length}`);
    console.log(`   📋 Total de bullets: ${allBullets.length}`);
    console.log(`   🔄 Bullets únicos: ${uniqueBullets.length}`);
    console.log(`   📊 Variabilidad: ${((uniqueBullets.length / allBullets.length) * 100).toFixed(1)}%`);
    
    // Verificar si hay repeticiones
    const bulletCounts = {};
    allBullets.forEach(bullet => {
      bulletCounts[bullet] = (bulletCounts[bullet] || 0) + 1;
    });
    
    const repeatedBullets = Object.entries(bulletCounts)
      .filter(([bullet, count]) => count > 1)
      .map(([bullet, count]) => ({ bullet: bullet.substring(0, 50) + '...', count }));
    
    if (repeatedBullets.length > 0) {
      console.log(`   ⚠️ Bullets repetidos: ${repeatedBullets.length}`);
      repeatedBullets.forEach(({ bullet, count }) => {
        console.log(`      - "${bullet}" (${count} veces)`);
      });
    } else {
      console.log(`   ✅ No hay bullets repetidos`);
    }
    
    return {
      success: true,
      responses,
      analysis: {
        totalResponses: responses.length,
        totalBullets: allBullets.length,
        uniqueBullets: uniqueBullets.length,
        variability: (uniqueBullets.length / allBullets.length) * 100,
        repeatedBullets: repeatedBullets.length
      }
    };
    
  } catch (error) {
    console.error(`❌ [TEST] Error en prueba de variabilidad:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Función para limpiar historial
const clearDevelopmentHistory = async (authToken, childName, ageInMonths, isUnborn = false) => {
  try {
    console.log(`\n🗑️ [TEST] Limpiando historial para ${childName}...`);
    
    const response = await api.delete('/api/children/development-history', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        childName,
        ageInMonths,
        isUnborn
      }
    });
    
    if (response.data.success) {
      console.log(`✅ [TEST] Historial limpiado: ${response.data.data.deletedCount} respuestas eliminadas`);
      return true;
    } else {
      console.log(`❌ [TEST] Error limpiando historial:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ [TEST] Error limpiando historial:`, error.response?.data || error.message);
    return false;
  }
};

// Función principal
const runVariedDevelopmentTests = async () => {
  try {
    console.log('🎯 [VARIED DEVELOPMENT] Iniciando pruebas de respuestas variadas...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [VARIED DEVELOPMENT] Para ejecutar las pruebas, proporciona un token de autenticación:');
      console.log('   node test-varied-development.js tu_token_aqui');
      return;
    }
    
    // 2. Casos de prueba
    const testCases = [
      {
        name: 'María',
        ageInMonths: 6,
        isUnborn: false,
        description: 'Bebé de 6 meses'
      },
      {
        name: 'Juan',
        ageInMonths: 12,
        isUnborn: false,
        description: 'Bebé de 12 meses'
      },
      {
        name: 'Esperanza',
        gestationWeeks: 24,
        isUnborn: true,
        description: 'Bebé de 24 semanas'
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      console.log('=' .repeat(60));
      console.log(`PRUEBA: ${testCase.description}`);
      console.log('=' .repeat(60));
      
      // Limpiar historial antes de la prueba
      await clearDevelopmentHistory(
        authToken, 
        testCase.name, 
        testCase.ageInMonths, 
        testCase.isUnborn
      );
      
      // Probar respuestas variadas
      const result = await testVariedResponses(
        authToken,
        testCase.name,
        testCase.ageInMonths,
        testCase.isUnborn,
        testCase.gestationWeeks
      );
      
      results.push({
        testCase,
        result
      });
      
      // Esperar entre pruebas
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Resumen final
    console.log('\n' + '=' .repeat(60));
    console.log('RESUMEN DE PRUEBAS');
    console.log('=' .repeat(60));
    
    let totalSuccess = 0;
    let totalVariability = 0;
    
    results.forEach(({ testCase, result }) => {
      if (result.success) {
        totalSuccess++;
        totalVariability += result.analysis.variability;
        
        console.log(`✅ ${testCase.description}:`);
        console.log(`   📊 Variabilidad: ${result.analysis.variability.toFixed(1)}%`);
        console.log(`   🔄 Bullets únicos: ${result.analysis.uniqueBullets}/${result.analysis.totalBullets}`);
      } else {
        console.log(`❌ ${testCase.description}: Error`);
      }
    });
    
    const averageVariability = totalVariability / totalSuccess;
    
    console.log(`\n🎯 Resultado: ${totalSuccess}/${results.length} pruebas exitosas`);
    console.log(`📊 Variabilidad promedio: ${averageVariability.toFixed(1)}%`);
    
    if (averageVariability >= 80) {
      console.log('🎉 ¡Excelente variabilidad en las respuestas!');
    } else if (averageVariability >= 60) {
      console.log('👍 Buena variabilidad en las respuestas');
    } else {
      console.log('⚠️ La variabilidad podría mejorarse');
    }
    
  } catch (error) {
    console.error('\n💥 [VARIED DEVELOPMENT] Error en las pruebas:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  runVariedDevelopmentTests();
}

// Exportar funciones
module.exports = {
  testVariedResponses,
  clearDevelopmentHistory,
  runVariedDevelopmentTests
};

/*
INSTRUCCIONES DE USO:

1. Ejecutar todas las pruebas:
   node test-varied-development.js tu_token_aqui

2. Ejecutar prueba específica:
   const { testVariedResponses } = require('./test-varied-development');
   testVariedResponses(token, 'María', 6, false);

PRUEBAS INCLUIDAS:

✅ Bebé de 6 meses (5 consultas)
✅ Bebé de 12 meses (5 consultas)  
✅ Bebé de 24 semanas (5 consultas)
✅ Análisis de variabilidad
✅ Limpieza de historial

RESULTADO:

Verifica que el sistema de respuestas variadas
funcione correctamente y evite repeticiones.
*/
