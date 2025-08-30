// Ejemplo de implementación para React Native - Fotos de Hijos
// Las fotos solo se pueden agregar/actualizar, no en la creación

// Tipos de datos para hijos con foto
export interface Child {
  id: string;
  parentId: string;
  name: string;
  ageInMonths: number | null;
  isUnborn: boolean;
  gestationWeeks: number | null;
  photoUrl: string | null; // URL de la foto
  createdAt: string;
  updatedAt: string;
}

export interface UpdateChildData {
  name?: string;
  ageInMonths?: number;
  isUnborn?: boolean;
  gestationWeeks?: number;
  photoUrl?: string; // Solo en actualización
}

// Servicios para gestión de fotos de hijos
export const childrenPhotoService = {
  // Actualizar foto de un hijo
  updateChildPhoto: async (childId: string, photoUrl: string) => {
    console.log('📸 [PHOTO] Actualizando foto para hijo:', childId);
    
    try {
      const response = await api.put(`/api/auth/children/${childId}`, {
        photoUrl: photoUrl
      });
      console.log('✅ [PHOTO] Foto actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PHOTO] Error actualizando foto:', error);
      throw error;
    }
  },

  // Subir foto a servidor (ejemplo con Firebase Storage)
  uploadPhoto: async (uri: string, childId: string) => {
    console.log('📤 [UPLOAD] Subiendo foto para hijo:', childId);
    
    try {
      // Aquí implementarías la lógica de subida a Firebase Storage
      // Por ahora, simulamos una URL
      const photoUrl = `https://storage.googleapis.com/mumpabackend/photos/${childId}/${Date.now()}.jpg`;
      
      console.log('✅ [UPLOAD] Foto subida:', photoUrl);
      return photoUrl;
    } catch (error) {
      console.error('❌ [UPLOAD] Error subiendo foto:', error);
      throw error;
    }
  },

  // Eliminar foto de un hijo
  removeChildPhoto: async (childId: string) => {
    console.log('🗑️ [PHOTO] Eliminando foto de hijo:', childId);
    
    try {
      const response = await api.put(`/api/auth/children/${childId}`, {
        photoUrl: null
      });
      console.log('✅ [PHOTO] Foto eliminada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PHOTO] Error eliminando foto:', error);
      throw error;
    }
  }
};

// Ejemplo de uso en componentes React Native:

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
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos para acceder a la galería');
        return;
      }

      // Abrir galería
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
      // Solicitar permisos
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos para acceder a la cámara');
        return;
      }

      // Abrir cámara
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
      
      // 1. Subir foto al servidor
      const uploadedPhotoUrl = await childrenPhotoService.uploadPhoto(uri, childId);
      
      // 2. Actualizar en la base de datos
      await childrenPhotoService.updateChildPhoto(childId, uploadedPhotoUrl);
      
      // 3. Actualizar estado local
      setPhotoUrl(uploadedPhotoUrl);
      
      Alert.alert('Éxito', 'Foto actualizada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la foto');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async () => {
    try {
      setLoading(true);
      
      await childrenPhotoService.removeChildPhoto(childId);
      setPhotoUrl(null);
      
      Alert.alert('Éxito', 'Foto eliminada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la foto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Foto del Hijo
      </Text>

      {/* Mostrar foto actual */}
      {photoUrl ? (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={{ uri: photoUrl }}
            style={{ width: 200, height: 200, borderRadius: 100 }}
          />
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
              {loading ? 'Eliminando...' : 'Eliminar Foto'}
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
        </View>
      )}

      {/* Botones de acción */}
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
// Actualizar foto de un hijo:
PUT /api/auth/children/:childId
Authorization: Bearer <token>
Content-Type: application/json

{
  "photoUrl": "https://storage.googleapis.com/mumpabackend/photos/child123/1234567890.jpg"
}

// Eliminar foto:
PUT /api/auth/children/:childId
Authorization: Bearer <token>
Content-Type: application/json

{
  "photoUrl": null
}

// Respuesta:
{
  "success": true,
  "message": "Hijo actualizado exitosamente",
  "data": {
    "id": "child123",
    "photoUrl": "https://storage.googleapis.com/mumpabackend/photos/child123/1234567890.jpg",
    "updatedAt": "2025-08-29T..."
  }
}
*/

// Notas importantes:

/*
1. Las fotos SOLO se pueden agregar/actualizar, NO en la creación inicial
2. Se requiere validación de URL para evitar URLs maliciosas
3. Se recomienda usar Firebase Storage para almacenar las imágenes
4. Las fotos se muestran como círculos (200x200) en la UI
5. Se pueden tomar fotos con la cámara o seleccionar de la galería
6. Se puede eliminar la foto estableciendo photoUrl como null
*/
