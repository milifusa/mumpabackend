/**
 * Script de prueba para el Marketplace de Munpa
 * 
 * Prueba todos los endpoints del marketplace:
 * - Productos
 * - Favoritos
 * - Mensajes
 * - Transacciones
 * - Reportes
 * - Admin
 */

const fetch = require('node-fetch');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:3000';
let AUTH_TOKEN = process.env.AUTH_TOKEN || '';
let ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// IDs creados durante las pruebas
let createdProductId = null;
let createdMessageId = null;

/**
 * Helper para hacer peticiones autenticadas
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (options.auth && AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  if (options.admin && ADMIN_TOKEN) {
    headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  return { status: response.status, data };
}

/**
 * Test 1: Listar productos
 */
async function testListProducts() {
  console.log('\n📋 Test 1: Listar productos');
  console.log('=' .repeat(60));

  const result = await request('/api/marketplace/products');

  if (result.status === 200) {
    console.log('✅ Productos listados exitosamente');
    console.log(`   Total: ${result.data.data?.length || 0} productos`);
    console.log(`   Paginación: página ${result.data.pagination?.page} de ${result.data.pagination?.totalPages}`);
  } else {
    console.log('❌ Error listando productos:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 2: Listar productos con filtros
 */
async function testListProductsWithFilters() {
  console.log('\n📋 Test 2: Listar productos con filtros');
  console.log('='.repeat(60));

  // Probar con diferentes filtros
  const filters = [
    { type: 'venta', label: 'Ventas' },
    { type: 'donacion', label: 'Donaciones' },
    { category: 'transporte', label: 'Transporte' },
    { orderBy: 'precio_asc', label: 'Precio ascendente' }
  ];

  for (const filter of filters) {
    const params = new URLSearchParams(filter);
    const result = await request(`/api/marketplace/products?${params}`);
    
    if (result.status === 200) {
      console.log(`✅ ${filter.label}: ${result.data.data?.length || 0} productos`);
    } else {
      console.log(`❌ Error con filtro ${filter.label}`);
    }
  }

  return true;
}

/**
 * Test 3: Crear producto
 */
async function testCreateProduct() {
  console.log('\n📋 Test 3: Crear producto');
  console.log('='.repeat(60));

  const productData = {
    title: 'Carriola de Prueba Automatizada',
    description: 'Esta es una carriola de prueba creada automáticamente con más de 20 caracteres para cumplir la validación.',
    category: 'transporte',
    condition: 'como_nuevo',
    photos: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg'
    ],
    type: 'venta',
    price: 1500,
    location: {
      state: 'Ciudad de México',
      city: 'Coyoacán',
      coordinates: {
        lat: 19.3467,
        lng: -99.1617
      }
    }
  };

  const result = await request('/api/marketplace/products', {
    method: 'POST',
    body: JSON.stringify(productData),
    auth: true
  });

  if (result.status === 200) {
    console.log('✅ Producto creado exitosamente');
    console.log(`   ID: ${result.data.data?.id}`);
    console.log(`   Título: ${result.data.data?.title}`);
    createdProductId = result.data.data?.id;
  } else {
    console.log('❌ Error creando producto:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 4: Ver detalle de producto
 */
async function testGetProductDetail() {
  console.log('\n📋 Test 4: Ver detalle de producto');
  console.log('='.repeat(60));

  if (!createdProductId) {
    console.log('⚠️  Saltado (no hay productId)');
    return false;
  }

  const result = await request(`/api/marketplace/products/${createdProductId}`);

  if (result.status === 200) {
    console.log('✅ Producto obtenido exitosamente');
    console.log(`   Título: ${result.data.data?.title}`);
    console.log(`   Vistas: ${result.data.data?.views}`);
    console.log(`   Estado: ${result.data.data?.status}`);
  } else {
    console.log('❌ Error obteniendo producto:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 5: Actualizar producto
 */
async function testUpdateProduct() {
  console.log('\n📋 Test 5: Actualizar producto');
  console.log('='.repeat(60));

  if (!createdProductId) {
    console.log('⚠️  Saltado (no hay productId)');
    return false;
  }

  const updateData = {
    price: 1400,
    description: 'Descripción actualizada con precio rebajado'
  };

  const result = await request(`/api/marketplace/products/${createdProductId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
    auth: true
  });

  if (result.status === 200) {
    console.log('✅ Producto actualizado exitosamente');
  } else {
    console.log('❌ Error actualizando producto:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 6: Agregar a favoritos
 */
async function testAddToFavorites() {
  console.log('\n📋 Test 6: Agregar a favoritos');
  console.log('='.repeat(60));

  if (!createdProductId) {
    console.log('⚠️  Saltado (no hay productId)');
    return false;
  }

  const result = await request(`/api/marketplace/favorites/${createdProductId}`, {
    method: 'POST',
    auth: true
  });

  if (result.status === 200 || result.status === 400) { // 400 si ya está en favoritos
    console.log('✅ Producto agregado a favoritos (o ya estaba)');
  } else {
    console.log('❌ Error agregando a favoritos:', result.data.message);
  }

  return true;
}

/**
 * Test 7: Listar favoritos
 */
async function testListFavorites() {
  console.log('\n📋 Test 7: Listar favoritos');
  console.log('='.repeat(60));

  const result = await request('/api/marketplace/favorites', { auth: true });

  if (result.status === 200) {
    console.log('✅ Favoritos listados exitosamente');
    console.log(`   Total: ${result.data.data?.length || 0} favoritos`);
  } else {
    console.log('❌ Error listando favoritos:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 8: Enviar mensaje
 */
async function testSendMessage() {
  console.log('\n📋 Test 8: Enviar mensaje');
  console.log('='.repeat(60));

  if (!createdProductId) {
    console.log('⚠️  Saltado (no hay productId)');
    return false;
  }

  const messageData = {
    productId: createdProductId,
    message: 'Hola, me interesa este producto. ¿Aún está disponible?'
  };

  const result = await request('/api/marketplace/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
    auth: true
  });

  if (result.status === 200) {
    console.log('✅ Mensaje enviado exitosamente');
    console.log(`   ID: ${result.data.data?.id}`);
    createdMessageId = result.data.data?.id;
  } else {
    console.log('❌ Error enviando mensaje:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 9: Ver mensajes del producto
 */
async function testGetProductMessages() {
  console.log('\n📋 Test 9: Ver mensajes del producto');
  console.log('='.repeat(60));

  if (!createdProductId) {
    console.log('⚠️  Saltado (no hay productId)');
    return false;
  }

  const result = await request(`/api/marketplace/messages/${createdProductId}`, { auth: true });

  if (result.status === 200) {
    console.log('✅ Mensajes obtenidos exitosamente');
    console.log(`   Total: ${result.data.data?.length || 0} mensajes`);
  } else {
    console.log('❌ Error obteniendo mensajes:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 10: Cambiar estado a vendido
 */
async function testChangeStatus() {
  console.log('\n📋 Test 10: Cambiar estado a vendido');
  console.log('='.repeat(60));

  if (!createdProductId) {
    console.log('⚠️  Saltado (no hay productId)');
    return false;
  }

  const statusData = {
    status: 'vendido',
    buyerId: 'test_buyer_123',
    buyerName: 'Comprador de Prueba'
  };

  const result = await request(`/api/marketplace/products/${createdProductId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData),
    auth: true
  });

  if (result.status === 200) {
    console.log('✅ Estado actualizado exitosamente');
    console.log(`   Nuevo estado: ${statusData.status}`);
  } else {
    console.log('❌ Error cambiando estado:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 11: Ver mis transacciones
 */
async function testGetTransactions() {
  console.log('\n📋 Test 11: Ver mis transacciones');
  console.log('='.repeat(60));

  const result = await request('/api/marketplace/transactions', { auth: true });

  if (result.status === 200) {
    console.log('✅ Transacciones obtenidas exitosamente');
    console.log(`   Total: ${result.data.data?.length || 0} transacciones`);
  } else {
    console.log('❌ Error obteniendo transacciones:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 12: Mis productos
 */
async function testMyProducts() {
  console.log('\n📋 Test 12: Ver mis productos');
  console.log('='.repeat(60));

  const result = await request('/api/marketplace/my-products', { auth: true });

  if (result.status === 200) {
    console.log('✅ Productos propios obtenidos exitosamente');
    console.log(`   Total: ${result.data.data?.length || 0} productos`);
  } else {
    console.log('❌ Error obteniendo productos propios:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 13: Reportar producto
 */
async function testReportProduct() {
  console.log('\n📋 Test 13: Reportar producto');
  console.log('='.repeat(60));

  if (!createdProductId) {
    console.log('⚠️  Saltado (no hay productId)');
    return false;
  }

  const reportData = {
    productId: createdProductId,
    reason: 'otro',
    description: 'Este es un reporte de prueba'
  };

  const result = await request('/api/marketplace/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
    auth: true
  });

  if (result.status === 200) {
    console.log('✅ Reporte enviado exitosamente');
  } else {
    console.log('❌ Error enviando reporte:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 14: Admin - Ver estadísticas
 */
async function testAdminStats() {
  console.log('\n📋 Test 14: Admin - Estadísticas');
  console.log('='.repeat(60));

  if (!ADMIN_TOKEN) {
    console.log('⚠️  Saltado (no hay ADMIN_TOKEN)');
    return false;
  }

  const result = await request('/api/admin/marketplace/stats', { admin: true });

  if (result.status === 200) {
    console.log('✅ Estadísticas obtenidas exitosamente');
    console.log(`   Total productos: ${result.data.data?.totalProducts}`);
    console.log(`   Ventas: ${result.data.data?.productsByType?.venta}`);
    console.log(`   Donaciones: ${result.data.data?.productsByType?.donacion}`);
    console.log(`   Trueques: ${result.data.data?.productsByType?.trueque}`);
  } else {
    console.log('❌ Error obteniendo estadísticas:', result.data.message);
  }

  return result.status === 200;
}

/**
 * Test 15: Limpiar (quitar de favoritos y eliminar producto de prueba)
 */
async function testCleanup() {
  console.log('\n📋 Test 15: Limpieza');
  console.log('='.repeat(60));

  let success = true;

  // Quitar de favoritos
  if (createdProductId) {
    const favResult = await request(`/api/marketplace/favorites/${createdProductId}`, {
      method: 'DELETE',
      auth: true
    });
    
    if (favResult.status === 200 || favResult.status === 404) {
      console.log('✅ Producto quitado de favoritos');
    } else {
      console.log('⚠️  No se pudo quitar de favoritos');
      success = false;
    }

    // Eliminar producto
    const deleteResult = await request(`/api/marketplace/products/${createdProductId}`, {
      method: 'DELETE',
      auth: true
    });
    
    if (deleteResult.status === 200) {
      console.log('✅ Producto eliminado exitosamente');
    } else {
      console.log('⚠️  No se pudo eliminar el producto');
      success = false;
    }
  }

  return success;
}

/**
 * Función principal
 */
async function runAllTests() {
  console.log('\n');
  console.log('='.repeat(60));
  console.log('🧪 TESTS DEL MARKETPLACE DE MUNPA');
  console.log('='.repeat(60));

  // Verificar tokens
  if (!AUTH_TOKEN) {
    console.log('\n⚠️  Advertencia: AUTH_TOKEN no configurado');
    console.log('   Algunos tests no se ejecutarán');
    console.log('   Usa: AUTH_TOKEN="tu-token" node test-marketplace.js\n');
  }

  if (!ADMIN_TOKEN) {
    console.log('⚠️  Advertencia: ADMIN_TOKEN no configurado');
    console.log('   Tests de admin no se ejecutarán');
    console.log('   Usa: ADMIN_TOKEN="admin-token" node test-marketplace.js\n');
  }

  console.log(`🌐 API URL: ${API_URL}\n`);

  // Ejecutar tests
  const results = [];

  results.push(await testListProducts());
  results.push(await testListProductsWithFilters());
  results.push(await testCreateProduct());
  results.push(await testGetProductDetail());
  results.push(await testUpdateProduct());
  results.push(await testAddToFavorites());
  results.push(await testListFavorites());
  results.push(await testSendMessage());
  results.push(await testGetProductMessages());
  results.push(await testChangeStatus());
  results.push(await testGetTransactions());
  results.push(await testMyProducts());
  results.push(await testReportProduct());
  results.push(await testAdminStats());
  results.push(await testCleanup());

  // Resumen
  console.log('\n');
  console.log('='.repeat(60));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(60));

  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`\n✅ Tests pasados: ${passed}/${total} (${percentage}%)`);
  console.log(`❌ Tests fallidos: ${total - passed}/${total}`);

  if (createdProductId) {
    console.log(`\n📝 Producto de prueba creado: ${createdProductId}`);
    console.log('   (Ya fue eliminado en la limpieza)');
  }

  console.log('\n🎉 ¡Tests completados!\n');

  process.exit(passed === total ? 0 : 1);
}

// Ejecutar tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n❌ Error fatal ejecutando tests:', error);
    process.exit(1);
  });
}

module.exports = {
  testListProducts,
  testCreateProduct,
  testGetProductDetail,
  runAllTests
};

