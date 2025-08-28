const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Configurando variables de entorno en Vercel...\n');

// Leer el archivo .env
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};

// Parsear las variables de entorno
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('📋 Variables de entorno encontradas:');
Object.keys(envVars).forEach(key => {
  console.log(`  ${key}`);
});

console.log('\n🚀 Configurando variables en Vercel...\n');

// Configurar cada variable
Object.entries(envVars).forEach(([key, value]) => {
  try {
    console.log(`Configurando ${key}...`);
    execSync(`npx vercel env add ${key} production`, { 
      input: value,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(`✅ ${key} configurado`);
  } catch (error) {
    console.log(`❌ Error configurando ${key}: ${error.message}`);
  }
});

console.log('\n🎉 Configuración completada!');
console.log('📝 Ahora puedes hacer un nuevo despliegue con: npx vercel --prod');
console.log('🔗 Tu API estará disponible en: https://mumpabackend-nm8duwhad-mishu-lojans-projects.vercel.app');
