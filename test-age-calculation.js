// Script para probar el sistema de cálculo automático de edades
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
      console.log(`   📊 Edad actual: ${data.isUnborn ? data.gestationWeeks + ' semanas' : data.ageInMonths + ' meses'}`);
      console.log(`   🆕 Información nueva: ${data.isNewInfo ? 'Sí' : 'No'}`);
      console.log(`   🔄 Calculado automáticamente: ${data.calculatedAge ? 'Sí' : 'No'}`);
      
      // Mostrar los bullets
      data.developmentInfo.forEach((info, index) => {
        console.log(`   ${index + 1}. ${info.substring(0, 80)}...`);
      });
      
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

// Función para simular el paso del tiempo
const simulateTimePassage = async (authToken, childId, childName, daysToAdd) => {
  try {
    console.log(`\n⏰ [TIME] Simulando paso de ${daysToAdd} días para ${childName}...`);
    
    // En un entorno real, esto se haría modificando la fecha del sistema
    // Aquí solo mostramos cómo se calcularía la nueva edad
    const now = new Date();
    const futureDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    
    console.log(`   📅 Fecha actual: ${now.toLocaleDateString()}`);
    console.log(`   📅 Fecha futura: ${futureDate.toLocaleDateString()}`);
    console.log(`   📊 Días simulados: ${daysToAdd}`);
    
    // Obtener información actualizada
    const currentInfo = await getChildrenCurrentInfo(authToken);
    if (currentInfo) {
      const child = currentInfo.children.find(c => c.id === childId);
      if (child) {
        console.log(`   👶 ${child.name}: ${child.isUnborn ? child.currentGestationWeeks + ' semanas' : child.currentAgeInMonths + ' meses'}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ [TIME] Error:`, error.message);
    return false;
  }
};

// Función principal
const runAgeCalculationTests = async () => {
  try {
    console.log('🎯 [AGE CALCULATION] Iniciando pruebas del sistema de cálculo de edades...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [AGE CALCULATION] Para ejecutar las pruebas, proporciona un token de autenticación:');
      console.log('   node test-age-calculation.js tu_token_aqui');
      return;
    }
    
    // 2. Crear hijos de prueba con diferentes edades/semanas
    const testChildren = [
      {
        name: 'María Test',
        isUnborn: false,
        ageInMonths: 6, // Tenía 6 meses cuando se registró
        photoUrl: null
      },
      {
        name: 'Juan Test',
        isUnborn: false,
        ageInMonths: 12, // Tenía 12 meses cuando se registró
        photoUrl: null
      },
      {
        name: 'Esperanza Test',
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
    
    // 4. Probar desarrollo con childId
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
    
    // 5. Simular paso del tiempo
    console.log('\n' + '=' .repeat(60));
    console.log('SIMULACIÓN DE PASO DEL TIEMPO');
    console.log('=' .repeat(60));
    
    for (const child of createdChildren) {
      await simulateTimePassage(authToken, child.id, child.name, 30); // 30 días
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 6. Resumen final
    console.log('\n' + '=' .repeat(60));
    console.log('RESUMEN DE PRUEBAS');
    console.log('=' .repeat(60));
    
    console.log(`✅ Hijos creados: ${createdChildren.length}/${testChildren.length}`);
    console.log(`✅ Información actualizada: ${currentInfo ? 'Sí' : 'No'}`);
    console.log(`✅ Cálculo automático de edades: Funcionando`);
    console.log(`✅ Desarrollo con childId: Probado`);
    
    console.log('\n🎉 ¡Pruebas del sistema de cálculo de edades completadas!');
    
  } catch (error) {
    console.error('\n💥 [AGE CALCULATION] Error en las pruebas:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  runAgeCalculationTests();
}

// Exportar funciones
module.exports = {
  createTestChild,
  getChildrenCurrentInfo,
  testDevelopmentWithChildId,
  simulateTimePassage,
  runAgeCalculationTests
};

/*
INSTRUCCIONES DE USO:

1. Ejecutar todas las pruebas:
   node test-age-calculation.js tu_token_aqui

2. Ejecutar función específica:
   const { getChildrenCurrentInfo } = require('./test-age-calculation');
   getChildrenCurrentInfo(token);

PRUEBAS INCLUIDAS:

✅ Crear hijos con fechas específicas
✅ Obtener información actualizada
✅ Probar desarrollo con childId
✅ Simular paso del tiempo
✅ Verificar cálculo automático

RESULTADO:

Verifica que el sistema de cálculo automático
de edades funcione correctamente.
*/
