// Ejemplo para React Native - Fotos de Hijos con Firebase Storage
// Sin TypeScript, solo JavaScript

// Servicios para gestión de fotos de hijos usando Firebase Storage
export const childrenPhotoService = {
  // Subir foto usando Firebase Storage
  uploadPhoto: async (uri, childId) => {
    console.log('📤 [FIREBASE] Subiendo foto para hijo:', childId);
    
    try {
      // Crear FormData para enviar la imagen
      const formData = new FormData();
      formData.append('photo', {
        uri: uri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });
      formData.append('childId', childId);

      // Configurar headers para multipart/form-data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`
        }
      };

      // Subir foto al servidor (que la subirá a Firebase Storage)
      const response = await api.post('/api/auth/children/upload-photo', formData, config);
      
      console.log('✅ [FIREBASE] Foto subida exitosamente:', response.data);
      return response.data.data.photoUrl;
    } catch (error) {
      console.error('❌ [FIREBASE] Error subiendo foto:', error);
      throw error;
    }
  },

  // Eliminar foto de Firebase Storage
  removeChildPhoto: async (childId) => {
    console.log('🗑️ [FIREBASE] Eliminando foto de hijo:', childId);
    
    try {
      const response = await api.delete(`/api/auth/children/${childId}/photo`);
      console.log('✅ [FIREBASE] Foto eliminada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [FIREBASE] Error eliminando foto:', error);
      throw error;
    }
  },

  // Actualizar foto de un hijo (usar URL externa)
  updateChildPhoto: async (childId, photoUrl) => {
    console.log('📸 [FIREBASE] Actualizando foto para hijo:', childId);
    
    try {
      const response = await api.put(`/api/auth/children/${childId}`, {
        photoUrl: photoUrl
      });
      console.log('✅ [FIREBASE] Foto actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [FIREBASE] Error actualizando foto:', error);
      throw error;
    }
  }
};

// Ejemplo de uso en React Native:

/*
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { childrenPhotoService } from './services/childrenPhotoService';

const ChildPhotoScreen = ({ childId, currentPhotoUrl }) => {
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAndUpdatePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos para acceder a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAndUpdatePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const uploadAndUpdatePhoto = async (uri) => {
    try {
      setLoading(true);
      
      // Subir foto a Firebase Storage
      const uploadedPhotoUrl = await childrenPhotoService.uploadPhoto(uri, childId);
      
      // Actualizar estado local
      setPhotoUrl(uploadedPhotoUrl);
      
      Alert.alert('Éxito', 'Foto subida correctamente a Firebase Storage');
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async () => {
    try {
      setLoading(true);
      
      await childrenPhotoService.removeChildPhoto(childId);
      setPhotoUrl(null);
      
      Alert.alert('Éxito', 'Foto eliminada correctamente de Firebase Storage');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la foto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Foto del Hijo (Firebase Storage)
      </Text>

      {photoUrl ? (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={{ uri: photoUrl }}
            style={{ width: 200, height: 200, borderRadius: 100 }}
            defaultSource={require('./assets/default-avatar.png')}
          />
          <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
            Almacenada en Firebase Storage
          </Text>
          <TouchableOpacity
            onPress={removePhoto}
            disabled={loading}
            style={{
              backgroundColor: '#FF3B30',
              padding: 10,
              borderRadius: 5,
              marginTop: 10
            }}
          >
            <Text style={{ color: 'white' }}>
              {loading ? 'Eliminando...' : '🗑️ Eliminar Foto'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: '#E5E5EA',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text style={{ color: '#8E8E93' }}>Sin foto</Text>
          </View>
          <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
            Las fotos se almacenan en Firebase Storage
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <TouchableOpacity
          onPress={takePhoto}
          disabled={loading}
          style={{
            backgroundColor: '#007AFF',
            padding: 15,
            borderRadius: 5,
            flex: 1,
            marginRight: 10,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            📸 Tomar Foto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={pickImage}
          disabled={loading}
          style={{
            backgroundColor: '#34C759',
            padding: 15,
            borderRadius: 5,
            flex: 1,
            marginLeft: 10,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            🖼️ Galería
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChildPhotoScreen;
*/

// Estructura de datos que se envía al servidor:

/*
// Subir foto a Firebase Storage:
POST /api/auth/children/upload-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- photo: [archivo de imagen]
- childId: "UMPtyalAnyA2zUUyOuW1"

// Respuesta:
{
  "success": true,
  "message": "Foto subida exitosamente",
  "data": {
    "photoUrl": "https://storage.googleapis.com/mumpabackend.appspot.com/children/UMPtyalAnyA2zUUyOuW1/photo-1234567890.jpg",
    "fileName": "children/UMPtyalAnyA2zUUyOuW1/photo-1234567890.jpg"
  }
}

// Eliminar foto de Firebase Storage:
DELETE /api/auth/children/:childId/photo
Authorization: Bearer <token>

// Respuesta:
{
  "success": true,
  "message": "Foto eliminada exitosamente"
}
*/

// Configuración necesaria en Firebase Console:

/*
1. HABILITAR FIREBASE STORAGE:
   - Ve a Firebase Console > Storage
   - Haz clic en "Get started"
   - Selecciona "Start in test mode" (para desarrollo)
   - Elige una ubicación (ej: us-central1)

2. REGLAS DE SEGURIDAD (test mode):
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }

3. REGLAS DE SEGURIDAD (producción):
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /children/{childId}/{fileName} {
         allow read: if true;
         allow write: if request.auth != null && 
                      request.auth.uid == resource.metadata.uploadedBy;
       }
     }
   }

4. CONFIGURAR CORS (opcional):
   - Para permitir subidas desde el frontend directamente
   - Configurar en Firebase Storage > Settings > CORS
*/

// Ventajas de Firebase Storage:

/*
✅ INTEGRACIÓN PERFECTA:
   - Mismo proyecto que Firestore
   - Misma autenticación
   - Mismo dashboard

✅ ESCALABILIDAD:
   - Automáticamente escalable
   - CDN global incluido
   - Sin límites de almacenamiento

✅ SEGURIDAD:
   - Reglas de seguridad granulares
   - Autenticación integrada
   - Control de acceso por usuario

✅ COSTO:
   - Muy económico
   - 5GB gratis por mes
   - $0.026 por GB adicional

✅ FUNCIONALIDADES:
   - Transformaciones de imagen
   - Metadatos personalizados
   - URLs públicas automáticas
   - Eliminación automática

✅ ORGANIZACIÓN:
   - Estructura de carpetas clara
   - children/{childId}/{filename}
   - Fácil de gestionar
*/
