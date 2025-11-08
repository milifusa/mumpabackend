#!/usr/bin/env node

/**
 * Script para integrar los endpoints del marketplace al server.js
 * 
 * Este script:
 * 1. Lee server.js
 * 2. Lee marketplace-endpoints.js
 * 3. Combina ambos archivos de forma segura
 * 4. Crea un backup antes de modificar
 * 5. Escribe el archivo actualizado
 */

const fs = require('fs');
const path = require('path');

console.log('🛍️ Integrando Marketplace en server.js...\n');

// Rutas de los archivos
const SERVER_FILE = path.join(__dirname, 'server.js');
const MARKETPLACE_FILE = path.join(__dirname, 'marketplace-endpoints.js');
const BACKUP_FILE = path.join(__dirname, 'server.js.backup-before-marketplace');

// Verificar que los archivos existen
if (!fs.existsSync(SERVER_FILE)) {
  console.error('❌ Error: server.js no encontrado');
  process.exit(1);
}

if (!fs.existsSync(MARKETPLACE_FILE)) {
  console.error('❌ Error: marketplace-endpoints.js no encontrado');
  process.exit(1);
}

console.log('✅ Archivos encontrados');

// Leer contenido de los archivos
console.log('📖 Leyendo archivos...');
const serverContent = fs.readFileSync(SERVER_FILE, 'utf8');
const marketplaceContent = fs.readFileSync(MARKETPLACE_FILE, 'utf8');

// Verificar si ya fue integrado
if (serverContent.includes('GET /api/marketplace/products/:id')) {
  console.log('⚠️  Parece que el marketplace ya fue integrado previamente.');
  console.log('   ¿Deseas continuar de todos modos? (Esto puede duplicar código)');
  console.log('   Para continuar, ejecuta: node integrate-marketplace.js --force');
  
  if (!process.argv.includes('--force')) {
    console.log('\n✋ Integración cancelada para evitar duplicados.');
    process.exit(0);
  }
}

// Crear backup
console.log('💾 Creando backup...');
fs.writeFileSync(BACKUP_FILE, serverContent, 'utf8');
console.log(`✅ Backup creado: ${BACKUP_FILE}`);

// Limpiar el contenido del marketplace (quitar comentarios iniciales)
const cleanMarketplaceContent = marketplaceContent
  .split('\n')
  .filter((line, index) => {
    // Saltar las primeras líneas de comentarios
    if (index < 6) return false;
    return true;
  })
  .join('\n');

// Combinar los archivos
console.log('🔗 Combinando archivos...');
const updatedContent = serverContent.trimEnd() + '\n' + cleanMarketplaceContent;

// Escribir el archivo actualizado
console.log('📝 Escribiendo server.js actualizado...');
fs.writeFileSync(SERVER_FILE, updatedContent, 'utf8');

// Verificar que se guardó correctamente
const verifyContent = fs.readFileSync(SERVER_FILE, 'utf8');
if (verifyContent.length > serverContent.length) {
  console.log('✅ server.js actualizado exitosamente!\n');
  console.log('📊 Estadísticas:');
  console.log(`   - Líneas originales: ${serverContent.split('\n').length}`);
  console.log(`   - Líneas agregadas: ${cleanMarketplaceContent.split('\n').length}`);
  console.log(`   - Total de líneas: ${verifyContent.split('\n').length}\n`);
  
  console.log('🎯 Endpoints agregados:');
  console.log('   ✅ GET /api/marketplace/products/:id');
  console.log('   ✅ POST /api/marketplace/products');
  console.log('   ✅ PUT /api/marketplace/products/:id');
  console.log('   ✅ DELETE /api/marketplace/products/:id');
  console.log('   ✅ PATCH /api/marketplace/products/:id/status');
  console.log('   ✅ GET /api/marketplace/my-products');
  console.log('   ✅ GET /api/marketplace/favorites');
  console.log('   ✅ POST /api/marketplace/favorites/:productId');
  console.log('   ✅ DELETE /api/marketplace/favorites/:productId');
  console.log('   ✅ GET /api/marketplace/messages');
  console.log('   ✅ GET /api/marketplace/messages/:productId');
  console.log('   ✅ POST /api/marketplace/messages');
  console.log('   ✅ PATCH /api/marketplace/messages/:id/read');
  console.log('   ✅ GET /api/marketplace/transactions');
  console.log('   ✅ POST /api/marketplace/reports');
  console.log('   ✅ GET /api/admin/marketplace/products');
  console.log('   ✅ PATCH /api/admin/marketplace/products/:id/approve');
  console.log('   ✅ PATCH /api/admin/marketplace/products/:id/reject');
  console.log('   ✅ DELETE /api/admin/marketplace/products/:id');
  console.log('   ✅ GET /api/admin/marketplace/reports');
  console.log('   ✅ PATCH /api/admin/marketplace/reports/:id');
  console.log('   ✅ GET /api/admin/marketplace/stats');
  console.log('   ✅ GET /api/admin/marketplace/transactions');
  
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Revisa server.js para verificar que todo está correcto');
  console.log('   2. Prueba el servidor: node server.js');
  console.log('   3. Prueba los endpoints con test-marketplace.js');
  console.log('   4. Crea los índices en Firestore (ver MARKETPLACE-IMPLEMENTACION.md)');
  console.log('   5. Integra con el frontend\n');
  
  console.log('💡 Si algo sale mal, restaura el backup:');
  console.log(`   cp ${BACKUP_FILE} server.js\n`);
  
  console.log('🚀 ¡Marketplace integrado exitosamente!');
} else {
  console.error('❌ Error: No se pudo actualizar server.js correctamente');
  console.log('💡 Restaurando desde backup...');
  fs.writeFileSync(SERVER_FILE, serverContent, 'utf8');
  console.log('✅ Backup restaurado');
  process.exit(1);
}

