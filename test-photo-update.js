// Script de prueba para actualizar fotos de hijos
// Usa Picsum Photos para generar URLs temporales

const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-izotwzobf-mishu-lojans-projects.vercel.app';
const AUTH_TOKEN = 'TU_TOKEN_AQUI'; // Reemplaza con tu token real

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Función para generar URL de foto temporal
const generatePhotoUrl = () => {
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/400/400?random=${timestamp}${randomId}`;
};

// Función para actualizar foto de un hijo
const updateChildPhoto = async (childId, photoUrl) => {
  try {
    console.log(`📸 [TEST] Actualizando foto para hijo: ${childId}`);
    console.log(`🔗 [TEST] URL de foto: ${photoUrl}`);
    
    const response = await api.put(`/api/auth/children/${childId}`, {
      photoUrl: photoUrl
    });
    
    console.log('✅ [TEST] Foto actualizada exitosamente');
    console.log('📋 [TEST] Respuesta:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error actualizando foto:', error.response?.data || error.message);
    throw error;
  }
};

// Función para eliminar foto de un hijo
const removeChildPhoto = async (childId) => {
  try {
    console.log(`🗑️ [TEST] Eliminando foto de hijo: ${childId}`);
    
    const response = await api.put(`/api/auth/children/${childId}`, {
      photoUrl: null
    });
    
    console.log('✅ [TEST] Foto eliminada exitosamente');
    console.log('📋 [TEST] Respuesta:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error eliminando foto:', error.response?.data || error.message);
    throw error;
  }
};

// Función para obtener todos los hijos
const getChildren = async () => {
  try {
    console.log('👶 [TEST] Obteniendo lista de hijos...');
    
    const response = await api.get('/api/auth/children');
    
    console.log('✅ [TEST] Hijos obtenidos exitosamente');
    console.log(`📊 [TEST] Total de hijos: ${response.data.data.length}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ [TEST] Error obteniendo hijos:', error.response?.data || error.message);
    throw error;
  }
};

// Función principal de prueba
const runPhotoTests = async () => {
  try {
    console.log('🚀 [TEST] Iniciando pruebas de fotos de hijos...\n');
    
    // 1. Obtener lista de hijos
    const children = await getChildren();
    
    if (children.length === 0) {
      console.log('⚠️ [TEST] No hay hijos para probar');
      return;
    }
    
    console.log('\n📋 [TEST] Hijos disponibles:');
    children.forEach((child, index) => {
      console.log(`${index + 1}. ${child.name} (ID: ${child.id}) - Foto: ${child.photoUrl ? '✅' : '❌'}`);
    });
    
    // 2. Actualizar foto del primer hijo
    const firstChild = children[0];
    console.log(`\n📸 [TEST] Probando actualización de foto para: ${firstChild.name}`);
    
    const photoUrl = generatePhotoUrl();
    await updateChildPhoto(firstChild.id, photoUrl);
    
    // 3. Verificar que se actualizó
    console.log('\n🔍 [TEST] Verificando actualización...');
    const updatedChildren = await getChildren();
    const updatedChild = updatedChildren.find(child => child.id === firstChild.id);
    
    if (updatedChild.photoUrl === photoUrl) {
      console.log('✅ [TEST] Verificación exitosa: Foto actualizada correctamente');
    } else {
      console.log('❌ [TEST] Verificación fallida: Foto no se actualizó');
    }
    
    // 4. Eliminar foto del primer hijo
    console.log(`\n🗑️ [TEST] Probando eliminación de foto para: ${firstChild.name}`);
    await removeChildPhoto(firstChild.id);
    
    // 5. Verificar que se eliminó
    console.log('\n🔍 [TEST] Verificando eliminación...');
    const finalChildren = await getChildren();
    const finalChild = finalChildren.find(child => child.id === firstChild.id);
    
    if (finalChild.photoUrl === null) {
      console.log('✅ [TEST] Verificación exitosa: Foto eliminada correctamente');
    } else {
      console.log('❌ [TEST] Verificación fallida: Foto no se eliminó');
    }
    
    console.log('\n🎉 [TEST] Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('\n💥 [TEST] Error en las pruebas:', error.message);
  }
};

// Función para probar con un hijo específico
const testSpecificChild = async (childId) => {
  try {
    console.log(`🚀 [TEST] Probando hijo específico: ${childId}\n`);
    
    // Generar foto temporal
    const photoUrl = generatePhotoUrl();
    console.log(`🔗 [TEST] URL generada: ${photoUrl}`);
    
    // Actualizar foto
    await updateChildPhoto(childId, photoUrl);
    
    console.log('\n✅ [TEST] Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ [TEST] Error en la prueba:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  // Verificar si se proporcionó un token
  if (AUTH_TOKEN === 'TU_TOKEN_AQUI') {
    console.log('❌ [TEST] Error: Debes configurar AUTH_TOKEN en el script');
    console.log('📝 [TEST] Reemplaza "TU_TOKEN_AQUI" con tu token real');
    process.exit(1);
  }
  
  // Verificar argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Probar hijo específico
    const childId = args[0];
    testSpecificChild(childId);
  } else {
    // Ejecutar todas las pruebas
    runPhotoTests();
  }
}

// Exportar funciones para uso en otros scripts
module.exports = {
  updateChildPhoto,
  removeChildPhoto,
  getChildren,
  generatePhotoUrl,
  runPhotoTests,
  testSpecificChild
};

/*
INSTRUCCIONES DE USO:

1. Configurar token:
   - Reemplaza 'TU_TOKEN_AQUI' con tu token real
   - O configura como variable de entorno

2. Ejecutar todas las pruebas:
   node test-photo-update.js

3. Probar hijo específico:
   node test-photo-update.js UMPtyalAnyA2zUUyOuW1

4. Usar en otros scripts:
   const { updateChildPhoto } = require('./test-photo-update.js');
   await updateChildPhoto('childId', 'photoUrl');

EJEMPLO DE TOKEN:
- Obtén tu token del frontend (AsyncStorage.getItem('authToken'))
- O genera uno nuevo haciendo login
- Formato: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

SERVICIOS DE FOTO UTILIZADOS:
- Picsum Photos: https://picsum.photos/
- URLs temporales para desarrollo
- Para producción, usar ImgBB, Imgur o Cloudinary
*/
