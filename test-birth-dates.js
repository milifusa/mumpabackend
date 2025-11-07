/**
 * Script de prueba para el nuevo sistema de fechas de hijos
 * 
 * Este script prueba:
 * 1. Crear hijos con fechas de nacimiento
 * 2. Crear bebés no nacidos con fechas de parto
 * 3. Calcular edad automáticamente
 * 4. Endpoints helper de cálculo
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// URL del servidor (ajusta según tu configuración)
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Token de autenticación (necesitarás un token válido)
let AUTH_TOKEN = '';

/**
 * Función para hacer peticiones autenticadas
 */
async function authenticatedRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  return { status: response.status, data };
}

/**
 * Test 1: Calcular edad desde fecha de nacimiento
 */
async function testCalculateAge() {
  console.log('\n📊 Test 1: Calcular edad desde fecha de nacimiento');
  console.log('='.repeat(60));

  const birthDate = '2023-05-10'; // Bebé de hace ~20 meses
  
  const result = await authenticatedRequest('/api/auth/children/calculate-age', {
    method: 'POST',
    body: JSON.stringify({ birthDate })
  });

  console.log('Fecha de nacimiento:', birthDate);
  console.log('Resultado:', JSON.stringify(result.data, null, 2));
}

/**
 * Test 2: Calcular fecha de parto desde semanas de gestación
 */
async function testCalculateDueDate() {
  console.log('\n📊 Test 2: Calcular fecha de parto desde semanas');
  console.log('='.repeat(60));

  const gestationWeeks = 25;
  
  const result = await authenticatedRequest('/api/auth/children/calculate-due-date', {
    method: 'POST',
    body: JSON.stringify({ gestationWeeks })
  });

  console.log('Semanas de gestación:', gestationWeeks);
  console.log('Resultado:', JSON.stringify(result.data, null, 2));
}

/**
 * Test 3: Calcular semanas desde fecha de parto
 */
async function testCalculateGestationWeeks() {
  console.log('\n📊 Test 3: Calcular semanas desde fecha de parto');
  console.log('='.repeat(60));

  // Fecha de parto en ~3 meses
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + 3);
  const dueDateStr = dueDate.toISOString().split('T')[0];
  
  const result = await authenticatedRequest('/api/auth/children/calculate-gestation-weeks', {
    method: 'POST',
    body: JSON.stringify({ dueDate: dueDateStr })
  });

  console.log('Fecha de parto esperada:', dueDateStr);
  console.log('Resultado:', JSON.stringify(result.data, null, 2));
}

/**
 * Test 4: Crear hijo con fecha de nacimiento
 */
async function testCreateChildWithBirthDate() {
  console.log('\n📊 Test 4: Crear hijo con fecha de nacimiento');
  console.log('='.repeat(60));

  const childData = {
    name: 'María Test',
    birthDate: '2024-03-15',
    isUnborn: false
  };
  
  const result = await authenticatedRequest('/api/auth/children', {
    method: 'POST',
    body: JSON.stringify(childData)
  });

  console.log('Datos enviados:', childData);
  console.log('Resultado:', JSON.stringify(result.data, null, 2));
  
  return result.data?.data?.id; // Devolver el ID para pruebas posteriores
}

/**
 * Test 5: Crear bebé no nacido con fecha de parto
 */
async function testCreateUnbornChildWithDueDate() {
  console.log('\n📊 Test 5: Crear bebé no nacido con fecha de parto');
  console.log('='.repeat(60));

  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 2);
  
  const childData = {
    name: 'Bebé Test',
    dueDate: futureDate.toISOString().split('T')[0],
    isUnborn: true
  };
  
  const result = await authenticatedRequest('/api/auth/children', {
    method: 'POST',
    body: JSON.stringify(childData)
  });

  console.log('Datos enviados:', childData);
  console.log('Resultado:', JSON.stringify(result.data, null, 2));
  
  return result.data?.data?.id;
}

/**
 * Test 6: Actualizar hijo con nueva fecha de nacimiento
 */
async function testUpdateChildBirthDate(childId) {
  if (!childId) {
    console.log('\n⚠️  Test 6: Saltado (no hay childId)');
    return;
  }

  console.log('\n📊 Test 6: Actualizar fecha de nacimiento');
  console.log('='.repeat(60));

  const updateData = {
    birthDate: '2024-01-10'
  };
  
  const result = await authenticatedRequest(`/api/auth/children/${childId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });

  console.log('ID del hijo:', childId);
  console.log('Datos actualizados:', updateData);
  console.log('Resultado:', JSON.stringify(result.data, null, 2));
}

/**
 * Test 7: Listar hijos y ver edades calculadas
 */
async function testListChildren() {
  console.log('\n📊 Test 7: Listar hijos con edades calculadas');
  console.log('='.repeat(60));

  const result = await authenticatedRequest('/api/auth/children');

  console.log('Hijos encontrados:', result.data?.data?.length || 0);
  
  if (result.data?.data) {
    result.data.data.forEach((child, index) => {
      console.log(`\n${index + 1}. ${child.name}:`);
      console.log(`   - ID: ${child.id}`);
      console.log(`   - Nacido: ${!child.isUnborn ? 'Sí' : 'No'}`);
      
      if (child.isUnborn) {
        console.log(`   - Semanas de gestación: ${child.currentGestationWeeks}`);
        if (child.daysUntilDue !== undefined) {
          console.log(`   - Días hasta el parto: ${child.daysUntilDue}`);
        }
        if (child.dueDate) {
          const dueDate = new Date(child.dueDate._seconds * 1000);
          console.log(`   - Fecha de parto: ${dueDate.toLocaleDateString()}`);
        }
      } else {
        console.log(`   - Edad actual: ${child.currentAgeInMonths} meses`);
        if (child.birthDate) {
          const birthDate = new Date(child.birthDate._seconds * 1000);
          console.log(`   - Fecha de nacimiento: ${birthDate.toLocaleDateString()}`);
        }
      }
    });
  }
}

/**
 * Test 8: Crear hijo con formato legacy (para compatibilidad)
 */
async function testCreateChildLegacy() {
  console.log('\n📊 Test 8: Crear hijo con formato legacy');
  console.log('='.repeat(60));

  const childData = {
    name: 'Pedro Legacy',
    ageInMonths: 12,
    isUnborn: false
  };
  
  const result = await authenticatedRequest('/api/auth/children', {
    method: 'POST',
    body: JSON.stringify(childData)
  });

  console.log('Datos enviados (formato legacy):', childData);
  console.log('Resultado:', JSON.stringify(result.data, null, 2));
  
  return result.data?.data?.id;
}

/**
 * Test 9: Validaciones - fecha de nacimiento en el futuro (debe fallar)
 */
async function testValidationFutureBirthDate() {
  console.log('\n📊 Test 9: Validación - fecha de nacimiento futura (debe fallar)');
  console.log('='.repeat(60));

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  
  const childData = {
    name: 'Test Validación',
    birthDate: futureDate.toISOString().split('T')[0],
    isUnborn: false
  };
  
  const result = await authenticatedRequest('/api/auth/children', {
    method: 'POST',
    body: JSON.stringify(childData)
  });

  console.log('Datos enviados:', childData);
  console.log('Status:', result.status);
  console.log('Resultado (debe ser error):', JSON.stringify(result.data, null, 2));
}

/**
 * Test 10: Validaciones - fecha de parto en el pasado lejano (debe fallar)
 */
async function testValidationPastDueDate() {
  console.log('\n📊 Test 10: Validación - fecha de parto muy pasada (debe fallar)');
  console.log('='.repeat(60));

  const pastDate = new Date();
  pastDate.setMonth(pastDate.getMonth() - 3);
  
  const childData = {
    name: 'Test Validación 2',
    dueDate: pastDate.toISOString().split('T')[0],
    isUnborn: true
  };
  
  const result = await authenticatedRequest('/api/auth/children', {
    method: 'POST',
    body: JSON.stringify(childData)
  });

  console.log('Datos enviados:', childData);
  console.log('Status:', result.status);
  console.log('Resultado (debe ser error):', JSON.stringify(result.data, null, 2));
}

/**
 * Función principal para ejecutar todos los tests
 */
async function runAllTests() {
  console.log('\n');
  console.log('='.repeat(60));
  console.log('🧪 TESTS DEL SISTEMA DE FECHAS PARA HIJOS');
  console.log('='.repeat(60));

  try {
    // Primero necesitas obtener un token de autenticación
    console.log('\n⚠️  Para ejecutar estos tests necesitas un token de autenticación válido.');
    console.log('Opciones:');
    console.log('1. Establece la variable AUTH_TOKEN en este archivo');
    console.log('2. O usa: AUTH_TOKEN="tu-token" node test-birth-dates.js');
    console.log('3. O modifica el script para hacer login automáticamente\n');

    // Verificar si hay token
    if (!AUTH_TOKEN) {
      AUTH_TOKEN = process.env.AUTH_TOKEN || '';
      
      if (!AUTH_TOKEN) {
        console.log('❌ No se encontró AUTH_TOKEN. Los tests no se pueden ejecutar.');
        console.log('\nPara obtener un token:');
        console.log('1. Inicia sesión en la app');
        console.log('2. Copia el token de Firebase Authentication');
        console.log('3. Ejecuta: AUTH_TOKEN="tu-token" node test-birth-dates.js\n');
        return;
      }
    }

    // Ejecutar tests
    await testCalculateAge();
    await testCalculateDueDate();
    await testCalculateGestationWeeks();
    
    const childId = await testCreateChildWithBirthDate();
    const unbornId = await testCreateUnbornChildWithDueDate();
    const legacyId = await testCreateChildLegacy();
    
    await testUpdateChildBirthDate(childId);
    await testListChildren();
    
    // Tests de validación (deben fallar)
    await testValidationFutureBirthDate();
    await testValidationPastDueDate();

    console.log('\n');
    console.log('='.repeat(60));
    console.log('✅ TESTS COMPLETADOS');
    console.log('='.repeat(60));
    console.log('\nNota: Los tests de validación (9 y 10) deben mostrar errores, eso es correcto.');
    console.log('\nIDs creados en los tests:');
    if (childId) console.log(`- Hijo con birthDate: ${childId}`);
    if (unbornId) console.log(`- Bebé no nacido con dueDate: ${unbornId}`);
    if (legacyId) console.log(`- Hijo legacy con ageInMonths: ${legacyId}`);
    console.log('\nPuedes eliminarlos manualmente si lo deseas.\n');

  } catch (error) {
    console.error('\n❌ Error ejecutando tests:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar tests si este archivo se ejecuta directamente
if (require.main === module) {
  runAllTests();
}

// Exportar funciones para uso en otros scripts
module.exports = {
  testCalculateAge,
  testCalculateDueDate,
  testCalculateGestationWeeks,
  testCreateChildWithBirthDate,
  testCreateUnbornChildWithDueDate,
  testUpdateChildBirthDate,
  testListChildren,
  testCreateChildLegacy,
  testValidationFutureBirthDate,
  testValidationPastDueDate,
  runAllTests
};

