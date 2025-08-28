const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔥 Configuración de Firebase para tu Backend\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupFirebase() {
  try {
    console.log('📋 Pasos para configurar Firebase:\n');
    console.log('1. Ve a console.firebase.google.com');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a Configuración del proyecto > Cuentas de servicio');
    console.log('4. Haz clic en "Generar nueva clave privada"');
    console.log('5. Descarga el archivo JSON\n');

    const jsonPath = await question('📁 Ruta al archivo JSON descargado (o presiona Enter para configurar manualmente): ');
    
    let firebaseConfig = {};

    if (jsonPath && jsonPath.trim()) {
      // Leer archivo JSON
      try {
        const jsonContent = fs.readFileSync(jsonPath.trim(), 'utf8');
        firebaseConfig = JSON.parse(jsonContent);
        console.log('✅ Archivo JSON leído correctamente\n');
      } catch (error) {
        console.log('❌ Error al leer el archivo JSON. Configurando manualmente...\n');
      }
    }

    // Configurar variables de entorno
    const envContent = `# Firebase Configuration
FIREBASE_PROJECT_ID=${firebaseConfig.project_id || await question('Project ID: ')}
FIREBASE_PRIVATE_KEY_ID=${firebaseConfig.private_key_id || await question('Private Key ID: ')}
FIREBASE_PRIVATE_KEY="${(firebaseConfig.private_key || await question('Private Key (completa): ')).replace(/\n/g, '\\n')}"
FIREBASE_CLIENT_EMAIL=${firebaseConfig.client_email || await question('Client Email: ')}
FIREBASE_CLIENT_ID=${firebaseConfig.client_id || await question('Client ID: ')}
FIREBASE_AUTH_URI=${firebaseConfig.auth_uri || 'https://accounts.google.com/o/oauth2/auth'}
FIREBASE_TOKEN_URI=${firebaseConfig.token_uri || 'https://oauth2.googleapis.com/token'}
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=${firebaseConfig.auth_provider_x509_cert_url || 'https://www.googleapis.com/oauth2/v1/certs'}
FIREBASE_CLIENT_X509_CERT_URL=${firebaseConfig.client_x509_cert_url || await question('Client X509 Cert URL: ')}

# Server Configuration
PORT=3000
NODE_ENV=development
`;

    // Escribir archivo .env
    fs.writeFileSync('.env', envContent);
    console.log('✅ Archivo .env creado exitosamente!\n');

    console.log('🎉 Configuración completada!');
    console.log('📝 Ahora puedes iniciar el servidor con: npm run dev\n');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
  } finally {
    rl.close();
  }
}

setupFirebase();
