// Ejemplo para sincronizar childrenCount
// Usar este código para corregir el childrenCount si está desincronizado

// Función para sincronizar childrenCount
const syncChildrenCount = async () => {
  try {
    console.log('🔄 [SYNC] Sincronizando childrenCount...');
    
    const response = await api.post('/api/auth/children/sync-count');
    console.log('✅ [SYNC] ChildrenCount sincronizado:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ [SYNC] Error sincronizando childrenCount:', error);
    throw error;
  }
};

// Función para verificar y corregir childrenCount
const verifyAndFixChildrenCount = async () => {
  try {
    // 1. Obtener perfil actual
    const profileResponse = await api.get('/api/auth/profile');
    const currentProfile = profileResponse.data;
    console.log('👤 [VERIFY] Perfil actual:', currentProfile);
    
    // 2. Obtener lista de hijos
    const childrenResponse = await api.get('/api/auth/children');
    const children = childrenResponse.data;
    console.log('👶 [VERIFY] Hijos en BD:', children);
    
    // 3. Comparar
    const actualCount = children.length;
    const storedCount = currentProfile.childrenCount;
    
    console.log('📊 [VERIFY] Comparación:');
    console.log('  - childrenCount en perfil:', storedCount);
    console.log('  - hijos reales en BD:', actualCount);
    
    if (storedCount !== actualCount) {
      console.log('⚠️ [VERIFY] ¡Desincronización detectada! Sincronizando...');
      
      // 4. Sincronizar
      const syncResponse = await syncChildrenCount();
      console.log('✅ [VERIFY] Sincronización completada:', syncResponse);
      
      return {
        wasFixed: true,
        oldCount: storedCount,
        newCount: actualCount,
        syncResult: syncResponse
      };
    } else {
      console.log('✅ [VERIFY] ChildrenCount está sincronizado');
      return {
        wasFixed: false,
        count: actualCount
      };
    }
    
  } catch (error) {
    console.error('❌ [VERIFY] Error verificando childrenCount:', error);
    throw error;
  }
};

// Ejemplo de uso en React Native:

/*
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { authService, childrenService } from './services/authService';

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar perfil y hijos
      const [profileRes, childrenRes] = await Promise.all([
        authService.getProfile(),
        childrenService.getChildren()
      ]);
      
      setProfile(profileRes.data);
      setChildren(childrenRes.data);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncChildrenCount = async () => {
    try {
      setLoading(true);
      
      const result = await verifyAndFixChildrenCount();
      
      if (result.wasFixed) {
        Alert.alert(
          'Sincronización Completada',
          `ChildrenCount corregido: ${result.oldCount} → ${result.newCount}`
        );
        loadData(); // Recargar datos
      } else {
        Alert.alert(
          'Verificación Completada',
          `ChildrenCount está correcto: ${result.count}`
        );
      }
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo sincronizar childrenCount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Mi Perfil
      </Text>

      {profile && (
        <View style={{ marginBottom: 20 }}>
          <Text>Nombre: {profile.displayName}</Text>
          <Text>Email: {profile.email}</Text>
          <Text>Género: {profile.gender === 'F' ? 'Mamá' : 'Papá'}</Text>
          <Text>Hijos nacidos: {profile.childrenCount}</Text>
          <Text>Embarazada: {profile.isPregnant ? 'Sí' : 'No'}</Text>
          {profile.isPregnant && (
            <Text>Semanas de gestación: {profile.gestationWeeks}</Text>
          )}
        </View>
      )}

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
          Hijos ({children.length}):
        </Text>
        {children.map(child => (
          <View key={child.id} style={{ marginBottom: 5 }}>
            <Text>• {child.name} - {child.isUnborn ? `${child.gestationWeeks} semanas` : `${child.ageInMonths} meses`}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleSyncChildrenCount}
        disabled={loading}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {loading ? 'Sincronizando...' : 'Sincronizar ChildrenCount'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;
*/

// Estructura de respuesta del endpoint de sincronización:

/*
POST /api/auth/children/sync-count
Authorization: Bearer <token>

// Respuesta:
{
  "success": true,
  "message": "ChildrenCount sincronizado correctamente",
  "data": {
    "childrenCount": 5
  }
}
*/
