// Ejemplo para probar el registro con campo isPregnant
// Usar este código para verificar que isPregnant se guarde correctamente

const testSignupWithPregnancy = async () => {
  const API_BASE_URL = 'https://mumpabackend-e4eg0x2fb-mishu-lojans-projects.vercel.app';
  
  // Caso 1: Mujer embarazada con hijos existentes
  const testCase1 = {
    email: 'mama.embarazada@test.com',
    password: 'Test123',
    displayName: 'María Test',
    gender: 'F',
    childrenCount: 2,
    isPregnant: true,
    gestationWeeks: 24
  };

  // Caso 2: Mujer no embarazada con hijos
  const testCase2 = {
    email: 'mama.normal@test.com',
    password: 'Test123',
    displayName: 'Ana Test',
    gender: 'F',
    childrenCount: 1,
    isPregnant: false
  };

  // Caso 3: Hombre con hijos (no puede estar embarazado)
  const testCase3 = {
    email: 'papa@test.com',
    password: 'Test123',
    displayName: 'Juan Test',
    gender: 'M',
    childrenCount: 2,
    isPregnant: false
  };

  try {
    console.log('🧪 Probando registro con isPregnant...');
    
    // Probar caso 1
    console.log('\n📝 Caso 1: Mujer embarazada con hijos existentes');
    const response1 = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase1)
    });
    
    const result1 = await response1.json();
    console.log('✅ Resultado:', result1);

    // Probar caso 2
    console.log('\n📝 Caso 2: Mujer no embarazada con hijos');
    const response2 = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase2)
    });
    
    const result2 = await response2.json();
    console.log('✅ Resultado:', result2);

    // Probar caso 3
    console.log('\n📝 Caso 3: Hombre con hijos');
    const response3 = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase3)
    });
    
    const result3 = await response3.json();
    console.log('✅ Resultado:', result3);

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
};

// Ejemplo de uso en React Native:

/*
// En tu componente de registro:
const handleSignup = async () => {
  try {
    const signupData = {
      email: email.trim(),
      password: password,
      displayName: displayName.trim(),
      gender: gender, // "M" o "F"
      childrenCount: childrenCount,
      isPregnant: gender === 'F' ? isPregnant : false, // Solo mujeres
      gestationWeeks: gender === 'F' && isPregnant ? parseInt(gestationWeeks) : undefined
    };

    console.log('📝 Datos de registro:', signupData);

    const response = await authService.signup(signupData);
    console.log('✅ Registro exitoso:', response.data);
    
    // Verificar que isPregnant se guardó correctamente
    if (response.success) {
      console.log('✅ Usuario creado con isPregnant:', signupData.isPregnant);
    }
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
  }
};

// Verificar en el perfil:
const checkProfile = async () => {
  try {
    const profile = await authService.getProfile();
    console.log('👤 Perfil obtenido:', profile.data);
    console.log('🤰 isPregnant:', profile.data.isPregnant);
    console.log('📅 gestationWeeks:', profile.data.gestationWeeks);
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
  }
};
*/

// Estructura esperada en Firestore después del registro:

/*
// Para mujer embarazada:
{
  "email": "mama.embarazada@test.com",
  "displayName": "María Test",
  "gender": "F",
  "childrenCount": 2,
  "isPregnant": true,
  "gestationWeeks": 24,
  "createdAt": "2025-08-29T...",
  "updatedAt": "2025-08-29T...",
  "isActive": true
}

// Para mujer no embarazada:
{
  "email": "mama.normal@test.com",
  "displayName": "Ana Test",
  "gender": "F",
  "childrenCount": 1,
  "isPregnant": false,
  "gestationWeeks": null,
  "createdAt": "2025-08-29T...",
  "updatedAt": "2025-08-29T...",
  "isActive": true
}

// Para hombre:
{
  "email": "papa@test.com",
  "displayName": "Juan Test",
  "gender": "M",
  "childrenCount": 2,
  "isPregnant": false,
  "gestationWeeks": null,
  "createdAt": "2025-08-29T...",
  "updatedAt": "2025-08-29T...",
  "isActive": true
}
*/
