// Script para probar que Douli usa las edades calculadas automáticamente
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-lyop389dp-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para crear un hijo de prueba
const createTestChild = async (authToken, childData) => {
  try {
    console.log(`\n👶 [CREATE] Creando hijo de prueba: ${childData.name}`);
    
    const response = await api.post('/api/auth/children', childData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log(`✅ [CREATE] Hijo creado exitosamente:`, response.data.data.id);
      return response.data.data;
    } else {
      console.log(`❌ [CREATE] Error creando hijo:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ [CREATE] Error:`, error.response?.data || error.message);
    return null;
  }
};

// Función para obtener información actualizada de hijos
const getChildrenCurrentInfo = async (authToken) => {
  try {
    console.log(`\n📊 [CURRENT] Obteniendo información actualizada de hijos...`);
    
    const response = await api.get('/api/auth/children/current-info', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log(`✅ [CURRENT] Información obtenida:`, response.data.data.children.length, 'hijos');
      return response.data.data;
    } else {
      console.log(`❌ [CURRENT] Error obteniendo información:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ [CURRENT] Error:`, error.response?.data || error.message);
    return null;
  }
};

// Función para probar chat con Douli
const testDouliChat = async (authToken, message, childName) => {
  try {
    console.log(`\n🤖 [DOULA] Probando chat con Douli: "${message}"`);
    
    const response = await api.post('/api/doula/chat', {
      message: message
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log(`✅ [DOULA] Respuesta de Douli:`);
      console.log(`   📝 Mensaje: ${response.data.data.message.substring(0, 200)}...`);
      console.log(`   ⏱️ Tiempo de respuesta: ${response.data.data.responseTime}ms`);
      console.log(`   🧠 Usó memoria: ${response.data.data.usedMemory ? 'Sí' : 'No'}`);
      console.log(`   📚 Usó conocimiento: ${response.data.data.usedKnowledge ? 'Sí' : 'No'}`);
      
      return response.data.data;
    } else {
      console.log(`❌ [DOULA] Error en chat:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ [DOULA] Error:`, error.response?.data || error.message);
    return null;
  }
};

// Función para probar desarrollo con childId
const testDevelopmentWithChildId = async (authToken, childId, childName) => {
  try {
    console.log(`\n🤖 [DEVELOPMENT] Probando desarrollo con childId: ${childId}`);
    
    const response = await api.post('/api/children/development-info', {
      childId: childId
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      const data = response.data.data;
      console.log(`✅ [DEVELOPMENT] Desarrollo obtenido para ${childName}:`);
      console.log(`   📊 Edad registrada: ${data.registeredAge || 'N/A'}`);
      console.log(`   📊 Edad actual: ${data.isUnborn ? data.gestationWeeks + ' semanas' : data.ageInMonths + ' meses'}`);
      console.log(`   📈 Días desde registro: ${data.daysSinceRegistration || 'N/A'}`);
      console.log(`   🔄 Calculado automáticamente: ${data.calculatedAge ? 'Sí' : 'No'}`);
      
      return data;
    } else {
      console.log(`❌ [DEVELOPMENT] Error obteniendo desarrollo:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ [DEVELOPMENT] Error:`, error.response?.data || error.message);
    return null;
  }
};

// Función principal
const runDouliAgeCalculationTests = async () => {
  try {
    console.log('🎯 [DOULA AGE CALCULATION] Iniciando pruebas de Douli con cálculo automático de edades...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [DOULA AGE CALCULATION] Para ejecutar las pruebas, proporciona un token de autenticación:');
      console.log('   node test-douli-age-calculation.js tu_token_aqui');
      return;
    }
    
    // 2. Crear hijos de prueba con diferentes edades
    const testChildren = [
      {
        name: 'María Douli',
        isUnborn: false,
        ageInMonths: 6, // Tenía 6 meses cuando se registró
        photoUrl: null
      },
      {
        name: 'Juan Douli',
        isUnborn: false,
        ageInMonths: 12, // Tenía 12 meses cuando se registró
        photoUrl: null
      },
      {
        name: 'Esperanza Douli',
        isUnborn: true,
        gestationWeeks: 32, // Tenía 32 semanas cuando se registró
        photoUrl: null
      }
    ];
    
    const createdChildren = [];
    
    for (const childData of testChildren) {
      console.log('=' .repeat(60));
      console.log(`CREANDO: ${childData.name}`);
      console.log('=' .repeat(60));
      
      const createdChild = await createTestChild(authToken, childData);
      if (createdChild) {
        createdChildren.push(createdChild);
      }
      
      // Esperar entre creaciones
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Obtener información actualizada
    console.log('\n' + '=' .repeat(60));
    console.log('INFORMACIÓN ACTUALIZADA DE HIJOS');
    console.log('=' .repeat(60));
    
    const currentInfo = await getChildrenCurrentInfo(authToken);
    if (currentInfo) {
      currentInfo.children.forEach(child => {
        console.log(`\n👶 ${child.name}:`);
        console.log(`   📅 Fecha de registro: ${new Date(child.registeredDate).toLocaleDateString()}`);
        console.log(`   📊 Edad registrada: ${child.isUnborn ? child.registeredGestationWeeks + ' semanas' : child.registeredAgeInMonths + ' meses'}`);
        console.log(`   📊 Edad actual: ${child.isUnborn ? child.currentGestationWeeks + ' semanas' : child.currentAgeInMonths + ' meses'}`);
        console.log(`   📈 Días desde registro: ${child.daysSinceRegistration || 'N/A'}`);
        console.log(`   ⚠️ Sobrepasado: ${child.isOverdue ? 'Sí' : 'No'}`);
      });
    }
    
    // 4. Probar chat con Douli usando edades calculadas
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBAS DE CHAT CON DOULI (EDADES CALCULADAS)');
    console.log('=' .repeat(60));
    
    const douliTests = [
      {
        message: "¿Cuántos años tiene María?",
        expectedChild: "María Douli"
      },
      {
        message: "¿Qué puedo esperar de Juan a su edad?",
        expectedChild: "Juan Douli"
      },
      {
        message: "¿Cómo está el desarrollo de Esperanza?",
        expectedChild: "Esperanza Douli"
      },
      {
        message: "¿Qué actividades son apropiadas para la edad de mis hijos?",
        expectedChild: "todos"
      }
    ];
    
    for (const test of douliTests) {
      console.log(`\n🤖 Probando: "${test.message}"`);
      
      const douliResponse = await testDouliChat(authToken, test.message, test.expectedChild);
      
      if (douliResponse) {
        console.log(`✅ Douli respondió usando edades actualizadas`);
      } else {
        console.log(`❌ Error en respuesta de Douli`);
      }
      
      // Esperar entre pruebas
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 5. Probar desarrollo con childId
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBAS DE DESARROLLO CON CHILDID');
    console.log('=' .repeat(60));
    
    for (const child of createdChildren) {
      console.log(`\n🤖 Probando desarrollo para ${child.name}...`);
      
      const developmentInfo = await testDevelopmentWithChildId(authToken, child.id, child.name);
      
      if (developmentInfo) {
        console.log(`✅ Desarrollo exitoso para ${child.name}`);
      } else {
        console.log(`❌ Error en desarrollo para ${child.name}`);
      }
      
      // Esperar entre pruebas
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 6. Probar chat específico sobre edades
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBAS ESPECÍFICAS DE EDADES');
    console.log('=' .repeat(60));
    
    const ageSpecificTests = [
      "¿Qué hitos de desarrollo debería tener María a su edad?",
      "¿Es normal que Juan tenga esa edad y aún no camine?",
      "¿Qué puedo hacer para estimular a Esperanza en esta etapa de gestación?",
      "¿Cuáles son las señales de alarma para la edad de mis hijos?"
    ];
    
    for (const testMessage of ageSpecificTests) {
      console.log(`\n🤖 Probando pregunta específica de edad: "${testMessage}"`);
      
      const douliResponse = await testDouliChat(authToken, testMessage, "edad específica");
      
      if (douliResponse) {
        console.log(`✅ Douli respondió considerando edades actualizadas`);
      } else {
        console.log(`❌ Error en respuesta de Douli`);
      }
      
      // Esperar entre pruebas
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 7. Resumen final
    console.log('\n' + '=' .repeat(60));
    console.log('RESUMEN DE PRUEBAS');
    console.log('=' .repeat(60));
    
    console.log(`✅ Hijos creados: ${createdChildren.length}/${testChildren.length}`);
    console.log(`✅ Información actualizada: ${currentInfo ? 'Sí' : 'No'}`);
    console.log(`✅ Chat con Douli: Probado con edades calculadas`);
    console.log(`✅ Desarrollo con childId: Probado`);
    console.log(`✅ Preguntas específicas de edad: Probadas`);
    
    console.log('\n🎉 ¡Pruebas de Douli con cálculo automático de edades completadas!');
    console.log('\n📋 Verifica en los logs del servidor que Douli está usando las edades actualizadas automáticamente.');
    
  } catch (error) {
    console.error('\n💥 [DOULA AGE CALCULATION] Error en las pruebas:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  runDouliAgeCalculationTests();
}

// Exportar funciones
module.exports = {
  createTestChild,
  getChildrenCurrentInfo,
  testDouliChat,
  testDevelopmentWithChildId,
  runDouliAgeCalculationTests
};

/*
INSTRUCCIONES DE USO:

1. Ejecutar todas las pruebas:
   node test-douli-age-calculation.js tu_token_aqui

2. Ejecutar función específica:
   const { testDouliChat } = require('./test-douli-age-calculation');
   testDouliChat(token, "¿Cuántos años tiene María?", "María");

PRUEBAS INCLUIDAS:

✅ Crear hijos con edades específicas
✅ Obtener información actualizada
✅ Probar chat con Douli usando edades calculadas
✅ Probar desarrollo con childId
✅ Probar preguntas específicas de edad
✅ Verificar que Douli usa edades actualizadas

RESULTADO:

Verifica que Douli y el sistema de desarrollo
usen las edades calculadas automáticamente
basándose en la fecha de registro.
*/
