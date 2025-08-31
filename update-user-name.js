// Script para actualizar el nombre del usuario
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-hronowhe4-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para actualizar el nombre
const updateUserName = async (authToken, newName) => {
  try {
    console.log('📝 [UPDATE] Actualizando nombre del usuario...');
    console.log('📋 [UPDATE] Nuevo nombre:', newName);
    
    const response = await api.put('/api/auth/update-name', {
      displayName: newName
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [UPDATE] Nombre actualizado exitosamente');
    console.log('📋 [UPDATE] Respuesta:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ [UPDATE] Error actualizando nombre:', error.response?.data || error.message);
    throw error;
  }
};

// Función para verificar el nombre actual
const checkCurrentName = async (authToken) => {
  try {
    console.log('👤 [CHECK] Verificando nombre actual...');
    
    const response = await api.get('/api/debug/user-data', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [CHECK] Datos obtenidos');
    console.log('📋 [CHECK] Firestore:', response.data.data.firestore);
    console.log('📋 [CHECK] Auth:', response.data.data.auth);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ [CHECK] Error verificando datos:', error.response?.data || error.message);
    throw error;
  }
};

// Función para probar Douli después del cambio
const testDouliAfterUpdate = async (authToken) => {
  try {
    console.log('🤱 [TEST] Probando Douli después del cambio...');
    
    const response = await api.post('/api/doula/chat', {
      message: '¿Cómo me llamo?'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [TEST] Respuesta de Douli obtenida');
    console.log('📋 [TEST] Fuente:', response.data.data?.source || 'desconocida');
    console.log('📋 [TEST] Respuesta:');
    console.log('=' .repeat(80));
    console.log(response.data.data?.response);
    console.log('=' .repeat(80));
    
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error probando Douli:', error.response?.data || error.message);
    throw error;
  }
};

// Función principal
const runUpdate = async () => {
  try {
    console.log('🔧 [UPDATE] Iniciando actualización del nombre...\n');
    
    // 1. Verificar argumentos
    const args = process.argv.slice(2);
    const authToken = args[0];
    const newName = args[1];
    
    if (!authToken || !newName) {
      console.log('⚠️ [UPDATE] Uso: node update-user-name.js token_aqui "Tu Nombre Real"');
      console.log('   Ejemplo: node update-user-name.js eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..." "Mishu"');
      return;
    }
    
    // 2. Verificar nombre actual
    console.log('=' .repeat(60));
    console.log('1. VERIFICANDO NOMBRE ACTUAL');
    console.log('=' .repeat(60));
    await checkCurrentName(authToken);
    
    // 3. Actualizar nombre
    console.log('\n' + '=' .repeat(60));
    console.log('2. ACTUALIZANDO NOMBRE');
    console.log('=' .repeat(60));
    await updateUserName(authToken, newName);
    
    // 4. Verificar cambio
    console.log('\n' + '=' .repeat(60));
    console.log('3. VERIFICANDO CAMBIO');
    console.log('=' .repeat(60));
    await checkCurrentName(authToken);
    
    // 5. Probar Douli
    console.log('\n' + '=' .repeat(60));
    console.log('4. PROBANDO DOULI');
    console.log('=' .repeat(60));
    await testDouliAfterUpdate(authToken);
    
    console.log('\n🎉 [UPDATE] Actualización completada!');
    console.log(`✅ [UPDATE] Tu nombre ahora es: ${newName}`);
    
  } catch (error) {
    console.error('\n💥 [UPDATE] Error en la actualización:', error.message);
  }
};

// Ejecutar actualización
if (require.main === module) {
  runUpdate();
}

// Exportar funciones
module.exports = {
  updateUserName,
  checkCurrentName,
  testDouliAfterUpdate,
  runUpdate
};

/*
INSTRUCCIONES DE USO:

1. Actualizar nombre:
   node update-user-name.js tu_token_aqui "Tu Nombre Real"

2. Ejemplo:
   node update-user-name.js eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..." "Mishu"

PASOS:

1. Obtén tu token de autenticación de tu app
2. Ejecuta el comando con tu nombre real
3. Verifica que Douli use tu nombre correcto

RESULTADO ESPERADO:

✅ Nombre actualizado en Firebase Auth
✅ Nombre actualizado en Firestore
✅ Douli responde con tu nombre correcto
*/
