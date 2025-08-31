// Script para diagnosticar el cálculo de edad de Java
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

// Función para calcular edad manualmente (igual que en el servidor)
const calculateCurrentAge = (registeredAge, registeredAt) => {
  const now = new Date();
  const registeredDate = new Date(registeredAt);
  const diffTime = now - registeredDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30.44); // Promedio de días por mes
  
  return Math.max(0, registeredAge + diffMonths);
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

// Función para diagnosticar el cálculo de edad de Java
const diagnoseJavaAge = async (authToken) => {
  try {
    console.log('🔍 [DIAGNOSE] Diagnosticando cálculo de edad de Java...\n');
    
    // 1. Obtener información actualizada de todos los hijos
    const currentInfo = await getChildrenCurrentInfo(authToken);
    if (!currentInfo) {
      console.log('❌ No se pudo obtener información de hijos');
      return;
    }
    
    // 2. Buscar Java específicamente
    const java = currentInfo.children.find(child => child.name === 'Java');
    if (!java) {
      console.log('❌ No se encontró Java en la lista de hijos');
      return;
    }
    
    console.log('=' .repeat(60));
    console.log('DIAGNÓSTICO DE JAVA');
    console.log('=' .repeat(60));
    
    // 3. Mostrar información detallada
    console.log(`\n👶 Nombre: ${java.name}`);
    console.log(`📅 Fecha de registro: ${new Date(java.registeredDate).toLocaleDateString()}`);
    console.log(`📅 Fecha actual: ${new Date().toLocaleDateString()}`);
    console.log(`📊 Edad registrada: ${java.registeredAgeInMonths} meses`);
    console.log(`📊 Edad actual (servidor): ${java.currentAgeInMonths} meses`);
    console.log(`📈 Días desde registro: ${java.daysSinceRegistration} días`);
    
    // 4. Calcular manualmente para comparar
    const manualCalculation = calculateCurrentAge(java.registeredAgeInMonths, java.registeredDate);
    console.log(`🧮 Edad calculada manualmente: ${manualCalculation} meses`);
    
    // 5. Verificar si hay diferencia
    if (java.currentAgeInMonths !== manualCalculation) {
      console.log(`⚠️ DISCREPANCIA DETECTADA:`);
      console.log(`   - Servidor dice: ${java.currentAgeInMonths} meses`);
      console.log(`   - Cálculo manual: ${manualCalculation} meses`);
      console.log(`   - Diferencia: ${Math.abs(java.currentAgeInMonths - manualCalculation)} meses`);
    } else {
      console.log(`✅ Cálculo correcto: ${java.currentAgeInMonths} meses`);
    }
    
    // 6. Mostrar detalles del cálculo
    const now = new Date();
    const registeredDate = new Date(java.registeredDate);
    const diffTime = now - registeredDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.44);
    
    console.log(`\n📊 DETALLES DEL CÁLCULO:`);
    console.log(`   Fecha de registro: ${registeredDate.toISOString()}`);
    console.log(`   Fecha actual: ${now.toISOString()}`);
    console.log(`   Diferencia en milisegundos: ${diffTime}`);
    console.log(`   Diferencia en días: ${diffDays}`);
    console.log(`   Diferencia en meses: ${diffMonths}`);
    console.log(`   Edad registrada: ${java.registeredAgeInMonths} meses`);
    console.log(`   Edad calculada: ${java.registeredAgeInMonths} + ${diffMonths} = ${java.registeredAgeInMonths + diffMonths} meses`);
    
    // 7. Probar desarrollo con childId
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBA DE DESARROLLO CON CHILDID');
    console.log('=' .repeat(60));
    
    const developmentInfo = await testDevelopmentWithChildId(authToken, java.id, java.name);
    
    if (developmentInfo) {
      console.log(`\n📊 RESULTADO DEL DESARROLLO:`);
      console.log(`   Edad usada: ${developmentInfo.ageInMonths} meses`);
      console.log(`   Edad registrada: ${developmentInfo.registeredAge} meses`);
      console.log(`   Días desde registro: ${developmentInfo.daysSinceRegistration} días`);
      
      if (developmentInfo.ageInMonths !== java.currentAgeInMonths) {
        console.log(`⚠️ DISCREPANCIA EN DESARROLLO:`);
        console.log(`   - Información actualizada: ${java.currentAgeInMonths} meses`);
        console.log(`   - Desarrollo usado: ${developmentInfo.ageInMonths} meses`);
      } else {
        console.log(`✅ Desarrollo usa edad correcta: ${developmentInfo.ageInMonths} meses`);
      }
    }
    
    // 8. Resumen
    console.log('\n' + '=' .repeat(60));
    console.log('RESUMEN DEL DIAGNÓSTICO');
    console.log('=' .repeat(60));
    
    console.log(`✅ Java encontrado: ${java.name}`);
    console.log(`✅ Edad registrada: ${java.registeredAgeInMonths} meses`);
    console.log(`✅ Edad actual calculada: ${java.currentAgeInMonths} meses`);
    console.log(`✅ Días transcurridos: ${java.daysSinceRegistration} días`);
    console.log(`✅ Cálculo manual: ${manualCalculation} meses`);
    
    if (java.currentAgeInMonths === manualCalculation) {
      console.log(`✅ El cálculo está funcionando correctamente`);
    } else {
      console.log(`❌ Hay un problema en el cálculo`);
    }
    
  } catch (error) {
    console.error('\n💥 [DIAGNOSE] Error en el diagnóstico:', error.message);
  }
};

// Función principal
const runDiagnosis = async () => {
  try {
    console.log('🔍 [AGE DIAGNOSIS] Iniciando diagnóstico del cálculo de edad...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [AGE DIAGNOSIS] Para ejecutar el diagnóstico, proporciona un token de autenticación:');
      console.log('   node debug-age-calculation.js tu_token_aqui');
      return;
    }
    
    // 2. Ejecutar diagnóstico
    await diagnoseJavaAge(authToken);
    
  } catch (error) {
    console.error('\n💥 [AGE DIAGNOSIS] Error en el diagnóstico:', error.message);
  }
};

// Ejecutar diagnóstico
if (require.main === module) {
  runDiagnosis();
}

// Exportar funciones
module.exports = {
  calculateCurrentAge,
  getChildrenCurrentInfo,
  testDevelopmentWithChildId,
  diagnoseJavaAge,
  runDiagnosis
};

/*
INSTRUCCIONES DE USO:

1. Ejecutar diagnóstico completo:
   node debug-age-calculation.js tu_token_aqui

2. Ejecutar función específica:
   const { diagnoseJavaAge } = require('./debug-age-calculation');
   diagnoseJavaAge(token);

DIAGNÓSTICO INCLUIDO:

✅ Obtener información actualizada de Java
✅ Calcular edad manualmente para comparar
✅ Verificar discrepancias en el cálculo
✅ Probar desarrollo con childId
✅ Mostrar detalles del cálculo
✅ Resumen del diagnóstico

RESULTADO:

Identifica si hay problemas en el cálculo
automático de la edad de Java.
*/
