const fs = require('fs');
const path = require('path');

// Función para convertir el archivo JSON de Firebase a variables de entorno
function convertFirebaseToEnv() {
  try {
    // Ruta al archivo JSON de Firebase
    const firebaseJsonPath = './mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json';
    
    // Verificar si el archivo existe
    if (!fs.existsSync(firebaseJsonPath)) {
      console.error('❌ No se encontró el archivo JSON de Firebase');
      console.log('📁 Buscando archivos JSON en el directorio actual...');
      
      const files = fs.readdirSync('.');
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      if (jsonFiles.length > 0) {
        console.log('📄 Archivos JSON encontrados:');
        jsonFiles.forEach(file => console.log(`  - ${file}`));
        console.log('\n💡 Renombra tu archivo de Firebase a "mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json" o modifica este script');
      }
      return;
    }

    // Leer el archivo JSON
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
    
    // Crear contenido del archivo .env
    const envContent = `# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de Firebase (convertido desde JSON)
FIREBASE_TYPE=${firebaseConfig.type}
FIREBASE_PROJECT_ID=${firebaseConfig.project_id}
FIREBASE_PRIVATE_KEY_ID=${firebaseConfig.private_key_id}
FIREBASE_PRIVATE_KEY="${firebaseConfig.private_key.replace(/\n/g, '\\n')}"
FIREBASE_CLIENT_EMAIL=${firebaseConfig.client_email}
FIREBASE_CLIENT_ID=${firebaseConfig.client_id}
FIREBASE_AUTH_URI=${firebaseConfig.auth_uri}
FIREBASE_TOKEN_URI=${firebaseConfig.token_uri}
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=${firebaseConfig.auth_provider_x509_cert_url}
FIREBASE_CLIENT_X509_CERT_URL=${firebaseConfig.client_x509_cert_url}

# Configuración de CORS (opcional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
`;

    // Escribir el archivo .env
    fs.writeFileSync('.env', envContent);
    
    console.log('✅ Archivo .env creado exitosamente');
    console.log('📝 Variables de Firebase convertidas desde el archivo JSON');
    console.log('🔒 Recuerda agregar .env a tu .gitignore para mantener seguras tus credenciales');
    
    // Mostrar las primeras líneas del archivo .env
    console.log('\n📄 Contenido del archivo .env:');
    console.log('='.repeat(50));
    console.log(envContent);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error al convertir el archivo:', error.message);
  }
}

// Ejecutar la conversión
convertFirebaseToEnv();
