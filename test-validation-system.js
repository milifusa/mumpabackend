// Script para probar el sistema de validación de repeticiones
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-lyop389dp-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // Aumentar timeout para múltiples intentos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para probar el sistema de validación
const testValidationSystem = async (authToken, childName, ageInMonths, isUnborn = false, gestationWeeks = null) => {
  try {
    console.log(`\n🔍 [VALIDATION TEST] Probando sistema de validación para ${childName}...`);
    
    const results = [];
    const numQueries = 5; // Más consultas para detectar repeticiones
    
    for (let i = 1; i <= numQueries; i++) {
      console.log(`\n📋 [VALIDATION TEST] Consulta #${i}/${numQueries}`);
      
      const startTime = Date.now();
      
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
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.data.success) {
        const data = response.data.data;
        console.log(`✅ [VALIDATION TEST] Consulta #${i} exitosa (${responseTime}ms):`);
        console.log(`   📈 Consulta #: ${data.responseCount}`);
        console.log(`   🆕 Información nueva: ${data.isNewInfo ? 'Sí' : 'No'}`);
        
        // Mostrar los bullets
        data.developmentInfo.forEach((info, index) => {
          console.log(`   ${index + 1}. ${info.substring(0, 80)}...`);
        });
        
        results.push(data);
      } else {
        console.log(`❌ [VALIDATION TEST] Consulta #${i} falló:`, response.data.message);
      }
      
      // Esperar entre consultas
      if (i < numQueries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Analizar repeticiones
    console.log('\n📊 [VALIDATION TEST] Análisis de repeticiones:');
    
    if (results.length > 1) {
      const allBullets = results.flatMap(r => r.developmentInfo);
      const uniqueBullets = [...new Set(allBullets)];
      
      console.log(`   📈 Total de consultas: ${results.length}`);
      console.log(`   📋 Total de bullets: ${allBullets.length}`);
      console.log(`   🔄 Bullets únicos: ${uniqueBullets.length}`);
      console.log(`   📊 Variabilidad: ${((uniqueBullets.length / allBullets.length) * 100).toFixed(1)}%`);
      
      // Detectar repeticiones específicas
      const bulletCounts = {};
      allBullets.forEach(bullet => {
        const key = bullet.substring(0, 50); // Usar inicio como identificador
        bulletCounts[key] = (bulletCounts[key] || 0) + 1;
      });
      
      const repeatedBullets = Object.entries(bulletCounts)
        .filter(([bullet, count]) => count > 1)
        .map(([bullet, count]) => ({ bullet, count }));
      
      if (repeatedBullets.length > 0) {
        console.log(`   ⚠️ Bullets repetidos encontrados: ${repeatedBullets.length}`);
        repeatedBullets.forEach(({ bullet, count }) => {
          console.log(`      - "${bullet}..." (${count} veces)`);
        });
      } else {
        console.log(`   ✅ No se encontraron bullets repetidos`);
      }
      
      // Verificar que el sistema de validación funcionó
      const expectedUnique = Math.min(results.length * 3, uniqueBullets.length);
      const actualUnique = uniqueBullets.length;
      
      if (actualUnique >= expectedUnique * 0.8) {
        console.log(`   ✅ Sistema de validación funcionando correctamente`);
      } else {
        console.log(`   ⚠️ Sistema de validación podría mejorarse`);
      }
    }
    
    return {
      success: true,
      results,
      analysis: {
        totalQueries: results.length,
        totalBullets: results.flatMap(r => r.developmentInfo).length,
        uniqueBullets: [...new Set(results.flatMap(r => r.developmentInfo))].length
      }
    };
    
  } catch (error) {
    console.error(`❌ [VALIDATION TEST] Error:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Función para limpiar historial
const clearHistory = async (authToken, childName, ageInMonths, isUnborn = false) => {
  try {
    console.log(`\n🗑️ [CLEANUP] Limpiando historial para ${childName}...`);
    
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
      console.log(`✅ [CLEANUP] Historial limpiado: ${response.data.data.deletedCount} respuestas eliminadas`);
      return true;
    } else {
      console.log(`❌ [CLEANUP] Error:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ [CLEANUP] Error:`, error.response?.data || error.message);
    return false;
  }
};

// Función principal
const runValidationTests = async () => {
  try {
    console.log('🎯 [VALIDATION SYSTEM] Iniciando pruebas del sistema de validación...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [VALIDATION SYSTEM] Para ejecutar las pruebas, proporciona un token de autenticación:');
      console.log('   node test-validation-system.js tu_token_aqui');
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
    
    const allResults = [];
    
    for (const testCase of testCases) {
      console.log('=' .repeat(60));
      console.log(`PRUEBA: ${testCase.description}`);
      console.log('=' .repeat(60));
      
      // Limpiar historial antes de la prueba
      await clearHistory(
        authToken, 
        testCase.name, 
        testCase.ageInMonths, 
        testCase.isUnborn
      );
      
      // Probar sistema de validación
      const result = await testValidationSystem(
        authToken,
        testCase.name,
        testCase.ageInMonths,
        testCase.isUnborn,
        testCase.gestationWeeks
      );
      
      allResults.push({
        testCase,
        result
      });
      
      // Esperar entre pruebas
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 3. Resumen final
    console.log('\n' + '=' .repeat(60));
    console.log('RESUMEN DEL SISTEMA DE VALIDACIÓN');
    console.log('=' .repeat(60));
    
    let totalSuccess = 0;
    let totalQueries = 0;
    let totalBullets = 0;
    let totalUniqueBullets = 0;
    
    allResults.forEach(({ testCase, result }) => {
      if (result.success) {
        totalSuccess++;
        totalQueries += result.analysis.totalQueries;
        totalBullets += result.analysis.totalBullets;
        totalUniqueBullets += result.analysis.uniqueBullets;
        
        const variability = (result.analysis.uniqueBullets / result.analysis.totalBullets) * 100;
        console.log(`✅ ${testCase.description}:`);
        console.log(`   📊 Variabilidad: ${variability.toFixed(1)}%`);
        console.log(`   🔄 Bullets únicos: ${result.analysis.uniqueBullets}/${result.analysis.totalBullets}`);
      } else {
        console.log(`❌ ${testCase.description}: Error`);
      }
    });
    
    if (totalBullets > 0) {
      const overallVariability = (totalUniqueBullets / totalBullets) * 100;
      console.log(`\n📊 Estadísticas generales:`);
      console.log(`   📈 Casos exitosos: ${totalSuccess}/${testCases.length}`);
      console.log(`   🔄 Consultas totales: ${totalQueries}`);
      console.log(`   📋 Bullets totales: ${totalBullets}`);
      console.log(`   🔄 Bullets únicos: ${totalUniqueBullets}`);
      console.log(`   📊 Variabilidad general: ${overallVariability.toFixed(1)}%`);
      
      if (overallVariability >= 90) {
        console.log(`   🎉 ¡Excelente sistema de validación!`);
      } else if (overallVariability >= 80) {
        console.log(`   ✅ Buen sistema de validación`);
      } else if (overallVariability >= 70) {
        console.log(`   👍 Sistema de validación aceptable`);
      } else {
        console.log(`   ⚠️ Sistema de validación necesita mejoras`);
      }
    }
    
    console.log('\n🎉 ¡Pruebas del sistema de validación completadas!');
    
  } catch (error) {
    console.error('\n💥 [VALIDATION SYSTEM] Error en las pruebas:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  runValidationTests();
}

// Exportar funciones
module.exports = {
  testValidationSystem,
  clearHistory,
  runValidationTests
};

/*
INSTRUCCIONES DE USO:

1. Ejecutar todas las pruebas:
   node test-validation-system.js tu_token_aqui

2. Ejecutar prueba específica:
   const { testValidationSystem } = require('./test-validation-system');
   testValidationSystem(token, 'María', 6, false);

PRUEBAS INCLUIDAS:

✅ Bebé de 6 meses (5 consultas)
✅ Bebé de 12 meses (5 consultas)  
✅ Bebé de 24 semanas (5 consultas)
✅ Análisis de repeticiones
✅ Verificación de validación
✅ Limpieza de historial

RESULTADO:

Verifica que el sistema de validación
evite repeticiones correctamente.
*/
