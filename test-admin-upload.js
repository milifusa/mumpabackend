const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'munpa-secret-key-2025-change-in-production';

async function testAdminUpload() {
  try {
    // 1. Generar token JWT manualmente (simular el login)
    const adminToken = jwt.sign(
      { 
        uid: '1K2EUDRsAbZvopHDQRXjpaBG9wZ2', // lmishelle16@gmail.com
        email: 'lmishelle16@gmail.com',
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🔑 Token JWT generado:', adminToken.substring(0, 50) + '...');
    
    // 2. Verificar el token
    const decoded = jwt.verify(adminToken, JWT_SECRET);
    console.log('✅ Token verificado:', decoded);

    // 3. Intentar subir una imagen (sin archivo real, solo test de auth)
    console.log('\n📤 Intentando llamar al endpoint sin imagen...');
    
    try {
      const response = await axios.post(
        'https://mumpabackend.vercel.app/api/admin/upload/image',
        { type: 'test' },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Respuesta:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 400 && error.response?.data?.message === 'No se proporcionó ninguna imagen') {
        console.log('\n✅✅✅ ¡ÉXITO! La autenticación funcionó (solo falta la imagen)');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testAdminUpload();

