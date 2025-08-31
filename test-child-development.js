// Script para probar el API de desarrollo infantil
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

// Casos de prueba para niños nacidos
const bornChildrenTests = [
  {
    name: 'María',
    ageInMonths: 3,
    description: 'Bebé de 3 meses'
  },
  {
    name: 'Juan',
    ageInMonths: 6,
    description: 'Bebé de 6 meses'
  },
  {
    name: 'Ana',
    ageInMonths: 12,
    description: 'Bebé de 12 meses'
  },
  {
    name: 'Carlos',
    ageInMonths: 24,
    description: 'Niño de 2 años'
  },
  {
    name: 'Sofía',
    ageInMonths: 36,
    description: 'Niña de 3 años'
  },
  {
    name: 'Lucas',
    ageInMonths: 48,
    description: 'Niño de 4 años'
  }
];

// Casos de prueba para bebés por nacer
const unbornChildrenTests = [
  {
    name: 'Pequeño',
    gestationWeeks: 8,
    description: 'Bebé de 8 semanas'
  },
  {
    name: 'Esperanza',
    gestationWeeks: 20,
    description: 'Bebé de 20 semanas'
  },
  {
    name: 'Luz',
    gestationWeeks: 32,
    description: 'Bebé de 32 semanas'
  },
  {
    name: 'Estrella',
    gestationWeeks: 38,
    description: 'Bebé de 38 semanas'
  }
];

// Función para probar desarrollo de niños nacidos
const testBornChildDevelopment = async (authToken, childTest) => {
  try {
    console.log(`\n👶 [TEST] Probando: ${childTest.description}`);
    
    const response = await api.post('/api/children/development-info', {
      name: childTest.name,
      ageInMonths: childTest.ageInMonths,
      isUnborn: false
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      const data = response.data.data;
      console.log(`✅ [TEST] ${childTest.name} (${childTest.ageInMonths} meses):`);
      console.log(`   📊 Información obtenida: ${data.developmentInfo.length} bullets`);
      console.log(`   📅 Timestamp: ${data.timestamp}`);
      
      // Mostrar los bullets
      data.developmentInfo.forEach((info, index) => {
        console.log(`   ${index + 1}. ${info.substring(0, 80)}...`);
      });
      
      return true;
    } else {
      console.log(`❌ [TEST] Error en ${childTest.name}:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ [TEST] Error en ${childTest.name}:`, error.response?.data || error.message);
    return false;
  }
};

// Función para probar desarrollo de bebés por nacer
const testUnbornChildDevelopment = async (authToken, childTest) => {
  try {
    console.log(`\n🤱 [TEST] Probando: ${childTest.description}`);
    
    const response = await api.post('/api/children/development-info', {
      name: childTest.name,
      gestationWeeks: childTest.gestationWeeks,
      isUnborn: true
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      const data = response.data.data;
      console.log(`✅ [TEST] ${childTest.name} (${childTest.gestationWeeks} semanas):`);
      console.log(`   📊 Información obtenida: ${data.developmentInfo.length} bullets`);
      console.log(`   📅 Timestamp: ${data.timestamp}`);
      
      // Mostrar los bullets
      data.developmentInfo.forEach((info, index) => {
        console.log(`   ${index + 1}. ${info.substring(0, 80)}...`);
      });
      
      return true;
    } else {
      console.log(`❌ [TEST] Error en ${childTest.name}:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ [TEST] Error en ${childTest.name}:`, error.response?.data || error.message);
    return false;
  }
};

// Función para probar casos de error
const testErrorCases = async (authToken) => {
  console.log('\n🚨 [TEST] Probando casos de error...');
  
  const errorTests = [
    {
      name: 'Sin nombre',
      data: { ageInMonths: 6, isUnborn: false },
      expectedError: 'El nombre del niño es requerido'
    },
    {
      name: 'Bebé por nacer sin semanas',
      data: { name: 'Test', isUnborn: true },
      expectedError: 'Para niños por nacer, las semanas de gestación son requeridas'
    },
    {
      name: 'Niño nacido sin edad',
      data: { name: 'Test', isUnborn: false },
      expectedError: 'Para niños nacidos, la edad en meses es requerida'
    }
  ];
  
  let errorSuccessCount = 0;
  
  for (const test of errorTests) {
    try {
      await api.post('/api/children/development-info', test.data, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log(`❌ [TEST] ${test.name}: No se generó el error esperado`);
    } catch (error) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage === test.expectedError) {
        console.log(`✅ [TEST] ${test.name}: Error manejado correctamente`);
        errorSuccessCount++;
      } else {
        console.log(`❌ [TEST] ${test.name}: Error inesperado - ${errorMessage}`);
      }
    }
  }
  
  return errorSuccessCount === errorTests.length;
};

// Función principal
const runChildDevelopmentTests = async () => {
  try {
    console.log('👶 [CHILD DEVELOPMENT] Iniciando pruebas del API de desarrollo infantil...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [CHILD DEVELOPMENT] Para ejecutar las pruebas, proporciona un token de autenticación:');
      console.log('   node test-child-development.js tu_token_aqui');
      return;
    }
    
    // 2. Probar niños nacidos
    console.log('=' .repeat(60));
    console.log('PRUEBAS DE NIÑOS NACIDOS');
    console.log('=' .repeat(60));
    
    let bornSuccessCount = 0;
    for (const childTest of bornChildrenTests) {
      const success = await testBornChildDevelopment(authToken, childTest);
      if (success) bornSuccessCount++;
      
      // Esperar entre pruebas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. Probar bebés por nacer
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBAS DE BEBÉS POR NACER');
    console.log('=' .repeat(60));
    
    let unbornSuccessCount = 0;
    for (const childTest of unbornChildrenTests) {
      const success = await testUnbornChildDevelopment(authToken, childTest);
      if (success) unbornSuccessCount++;
      
      // Esperar entre pruebas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 4. Probar casos de error
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBAS DE CASOS DE ERROR');
    console.log('=' .repeat(60));
    
    const errorTestsSuccess = await testErrorCases(authToken);
    
    // 5. Resumen de resultados
    console.log('\n' + '=' .repeat(60));
    console.log('RESUMEN DE PRUEBAS');
    console.log('=' .repeat(60));
    
    const totalBornTests = bornChildrenTests.length;
    const totalUnbornTests = unbornChildrenTests.length;
    
    console.log(`👶 Niños nacidos: ${bornSuccessCount}/${totalBornTests} ✅`);
    console.log(`🤱 Bebés por nacer: ${unbornSuccessCount}/${totalUnbornTests} ✅`);
    console.log(`🚨 Casos de error: ${errorTestsSuccess ? '✅' : '❌'}`);
    
    const totalTests = totalBornTests + totalUnbornTests + 1; // +1 por casos de error
    const totalSuccess = bornSuccessCount + unbornSuccessCount + (errorTestsSuccess ? 1 : 0);
    
    console.log(`\n🎯 Resultado: ${totalSuccess}/${totalTests} pruebas exitosas`);
    
    if (totalSuccess === totalTests) {
      console.log('🎉 ¡Todas las pruebas del API de desarrollo infantil funcionan correctamente!');
    } else {
      console.log('⚠️ Algunas pruebas fallaron. Revisa los logs para más detalles.');
    }
    
  } catch (error) {
    console.error('\n💥 [CHILD DEVELOPMENT] Error en las pruebas:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  runChildDevelopmentTests();
}

// Exportar funciones
module.exports = {
  testBornChildDevelopment,
  testUnbornChildDevelopment,
  testErrorCases,
  runChildDevelopmentTests
};

/*
INSTRUCCIONES DE USO:

1. Ejecutar todas las pruebas:
   node test-child-development.js tu_token_aqui

2. Ejecutar prueba específica:
   const { testBornChildDevelopment } = require('./test-child-development');
   testBornChildDevelopment(token, { name: 'María', ageInMonths: 6 });

PRUEBAS INCLUIDAS:

✅ Niños nacidos (6 casos: 3m, 6m, 12m, 24m, 36m, 48m)
✅ Bebés por nacer (4 casos: 8w, 20w, 32w, 38w)
✅ Casos de error (validación de datos)

RESULTADO:

Verifica que el API de desarrollo infantil
funcione correctamente para todas las edades.
*/
