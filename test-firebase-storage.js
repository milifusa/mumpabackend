// Script de prueba para Firebase Storage
// Prueba la subida y eliminación de fotos de hijos

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuración
const API_BASE_URL = 'https://mumpabackend-izotwzobf-mishu-lojans-projects.vercel.app';
const AUTH_TOKEN = 'TU_TOKEN_AQUI'; // Reemplaza con tu token real

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Función para crear una imagen de prueba
const createTestImage = () => {
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  
  // Crear una imagen simple de 100x100 píxeles (JPEG)
  const width = 100;
  const height = 100;
  
  // Crear un buffer con datos JPEG mínimos
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x64,
    0x00, 0x64, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
    0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02,
    0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00,
    0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xFF,
    0xD9
  ]);
  
  fs.writeFileSync(testImagePath, jpegHeader);
  return testImagePath;
};

// Función para subir foto a Firebase Storage
const uploadPhotoToFirebase = async (childId, imagePath) => {
  try {
    console.log(`📤 [FIREBASE] Subiendo foto para hijo: ${childId}`);
    
    // Crear FormData
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(imagePath), {
      filename: 'test-photo.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('childId', childId);

    // Configurar headers
    const config = {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    };

    // Subir foto
    const response = await api.post('/api/auth/children/upload-photo', formData, config);
    
    console.log('✅ [FIREBASE] Foto subida exitosamente');
    console.log('📋 [FIREBASE] Respuesta:', response.data);
    
    return response.data.data.photoUrl;
  } catch (error) {
    console.error('❌ [FIREBASE] Error subiendo foto:', error.response?.data || error.message);
    throw error;
  }
};

// Función para eliminar foto de Firebase Storage
const removePhotoFromFirebase = async (childId) => {
  try {
    console.log(`🗑️ [FIREBASE] Eliminando foto de hijo: ${childId}`);
    
    const response = await api.delete(`/api/auth/children/${childId}/photo`);
    
    console.log('✅ [FIREBASE] Foto eliminada exitosamente');
    console.log('📋 [FIREBASE] Respuesta:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ [FIREBASE] Error eliminando foto:', error.response?.data || error.message);
    throw error;
  }
};

// Función para obtener todos los hijos
const getChildren = async () => {
  try {
    console.log('👶 [FIREBASE] Obteniendo lista de hijos...');
    
    const response = await api.get('/api/auth/children');
    
    console.log('✅ [FIREBASE] Hijos obtenidos exitosamente');
    console.log(`📊 [FIREBASE] Total de hijos: ${response.data.data.length}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ [FIREBASE] Error obteniendo hijos:', error.response?.data || error.message);
    throw error;
  }
};

// Función principal de prueba
const runFirebaseStorageTests = async () => {
  try {
    console.log('🚀 [FIREBASE] Iniciando pruebas de Firebase Storage...\n');
    
    // 1. Obtener lista de hijos
    const children = await getChildren();
    
    if (children.length === 0) {
      console.log('⚠️ [FIREBASE] No hay hijos para probar');
      return;
    }
    
    console.log('\n📋 [FIREBASE] Hijos disponibles:');
    children.forEach((child, index) => {
      console.log(`${index + 1}. ${child.name} (ID: ${child.id}) - Foto: ${child.photoUrl ? '✅' : '❌'}`);
    });
    
    // 2. Crear imagen de prueba
    console.log('\n🖼️ [FIREBASE] Creando imagen de prueba...');
    const testImagePath = createTestImage();
    console.log('✅ [FIREBASE] Imagen de prueba creada:', testImagePath);
    
    // 3. Subir foto del primer hijo
    const firstChild = children[0];
    console.log(`\n📸 [FIREBASE] Probando subida de foto para: ${firstChild.name}`);
    
    const photoUrl = await uploadPhotoToFirebase(firstChild.id, testImagePath);
    
    // 4. Verificar que se subió
    console.log('\n🔍 [FIREBASE] Verificando subida...');
    const updatedChildren = await getChildren();
    const updatedChild = updatedChildren.find(child => child.id === firstChild.id);
    
    if (updatedChild.photoUrl === photoUrl) {
      console.log('✅ [FIREBASE] Verificación exitosa: Foto subida correctamente');
    } else {
      console.log('❌ [FIREBASE] Verificación fallida: Foto no se subió');
    }
    
    // 5. Eliminar foto del primer hijo
    console.log(`\n🗑️ [FIREBASE] Probando eliminación de foto para: ${firstChild.name}`);
    await removePhotoFromFirebase(firstChild.id);
    
    // 6. Verificar que se eliminó
    console.log('\n🔍 [FIREBASE] Verificando eliminación...');
    const finalChildren = await getChildren();
    const finalChild = finalChildren.find(child => child.id === firstChild.id);
    
    if (finalChild.photoUrl === null) {
      console.log('✅ [FIREBASE] Verificación exitosa: Foto eliminada correctamente');
    } else {
      console.log('❌ [FIREBASE] Verificación fallida: Foto no se eliminó');
    }
    
    // 7. Limpiar archivo de prueba
    try {
      fs.unlinkSync(testImagePath);
      console.log('🧹 [FIREBASE] Archivo de prueba eliminado');
    } catch (cleanupError) {
      console.error('⚠️ [FIREBASE] Error eliminando archivo de prueba:', cleanupError.message);
    }
    
    console.log('\n🎉 [FIREBASE] Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('\n💥 [FIREBASE] Error en las pruebas:', error.message);
  }
};

// Función para probar con un hijo específico
const testSpecificChildFirebase = async (childId) => {
  try {
    console.log(`🚀 [FIREBASE] Probando hijo específico: ${childId}\n`);
    
    // Crear imagen de prueba
    const testImagePath = createTestImage();
    console.log('✅ [FIREBASE] Imagen de prueba creada');
    
    // Subir foto
    const photoUrl = await uploadPhotoToFirebase(childId, testImagePath);
    console.log(`✅ [FIREBASE] Foto subida: ${photoUrl}`);
    
    // Limpiar archivo de prueba
    try {
      fs.unlinkSync(testImagePath);
    } catch (cleanupError) {
      console.error('⚠️ [FIREBASE] Error eliminando archivo de prueba:', cleanupError.message);
    }
    
    console.log('\n✅ [FIREBASE] Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ [FIREBASE] Error en la prueba:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  // Verificar si se proporcionó un token
  if (AUTH_TOKEN === 'TU_TOKEN_AQUI') {
    console.log('❌ [FIREBASE] Error: Debes configurar AUTH_TOKEN en el script');
    console.log('📝 [FIREBASE] Reemplaza "TU_TOKEN_AQUI" con tu token real');
    process.exit(1);
  }
  
  // Verificar argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Probar hijo específico
    const childId = args[0];
    testSpecificChildFirebase(childId);
  } else {
    // Ejecutar todas las pruebas
    runFirebaseStorageTests();
  }
}

// Exportar funciones para uso en otros scripts
module.exports = {
  uploadPhotoToFirebase,
  removePhotoFromFirebase,
  getChildren,
  createTestImage,
  runFirebaseStorageTests,
  testSpecificChildFirebase
};

/*
INSTRUCCIONES DE USO:

1. Configurar Firebase Storage:
   - Ve a Firebase Console > Storage
   - Haz clic en "Get started"
   - Selecciona "Start in test mode"
   - Elige ubicación (ej: us-central1)

2. Configurar token:
   - Reemplaza 'TU_TOKEN_AQUI' con tu token real
   - O configura como variable de entorno

3. Ejecutar todas las pruebas:
   node test-firebase-storage.js

4. Probar hijo específico:
   node test-firebase-storage.js UMPtyalAnyA2zUUyOuW1

5. Usar en otros scripts:
   const { uploadPhotoToFirebase } = require('./test-firebase-storage.js');
   await uploadPhotoToFirebase('childId', 'imagePath');

CONFIGURACIÓN FIREBASE STORAGE:

1. HABILITAR STORAGE:
   - Firebase Console > Storage > Get started
   - Test mode para desarrollo

2. REGLAS DE SEGURIDAD (test mode):
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }

3. ESTRUCTURA DE ARCHIVOS:
   - children/{childId}/photo-{timestamp}-{random}.jpg
   - Ejemplo: children/UMPtyalAnyA2zUUyOuW1/photo-1234567890-123456789.jpg

VENTAJAS FIREBASE STORAGE:
✅ Integración perfecta con Firestore
✅ Escalabilidad automática
✅ CDN global incluido
✅ Muy económico (5GB gratis)
✅ URLs públicas automáticas
✅ Seguridad integrada
*/
