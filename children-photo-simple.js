// Ejemplo simple para React Native - Fotos de Hijos
// Sin TypeScript, solo JavaScript

// Servicios para gestión de fotos de hijos
export const childrenPhotoService = {
  // Actualizar foto de un hijo
  updateChildPhoto: async (childId, photoUrl) => {
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

  // Subir foto usando servicios gratuitos
  uploadPhoto: async (uri, childId) => {
    console.log('📤 [UPLOAD] Subiendo foto para hijo:', childId);
    
    try {
      // OPCIÓN 1: Usar Picsum Photos (para desarrollo)
      const randomPhotoUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
      console.log('✅ [UPLOAD] Foto temporal generada:', randomPhotoUrl);
      return randomPhotoUrl;

      // OPCIÓN 2: Usar ImgBB (para producción)
      // const formData = new FormData();
      // formData.append('image', {
      //   uri: uri,
      //   type: 'image/jpeg',
      //   name: 'photo.jpg'
      // });
      // 
      // const response = await fetch('https://api.imgbb.com/1/upload?key=TU_API_KEY', {
      //   method: 'POST',
      //   body: formData
      // });
      // 
      // const result = await response.json();
      // return result.data.url;
    } catch (error) {
      console.error('❌ [UPLOAD] Error subiendo foto:', error);
      throw error;
    }
  },

  // Eliminar foto de un hijo
  removeChildPhoto: async (childId) => {
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

      {photoUrl ? (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={{ uri: photoUrl }}
            style={{ width: 200, height: 200, borderRadius: 100 }}
            defaultSource={require('./assets/default-avatar.png')}
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

// Ejemplo de uso con Picsum Photos:

/*
// Para probar con fotos temporales:
const testPhotoUpdate = async (childId) => {
  try {
    // Generar URL de foto temporal
    const photoUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
    
    // Actualizar en la base de datos
    await childrenPhotoService.updateChildPhoto(childId, photoUrl);
    
    console.log('✅ Foto temporal actualizada:', photoUrl);
  } catch (error) {
    console.error('❌ Error actualizando foto:', error);
  }
};

// Llamar la función:
// testPhotoUpdate('UMPtyalAnyA2zUUyOuW1');
*/

// Servicios recomendados para producción:

/*
1. IMGBB (Gratuito):
   - Registro: https://imgbb.com/
   - API Key: Gratuito
   - Límite: 32MB por imagen
   - URLs: Permanentes

2. IMGUR (Gratuito):
   - Registro: https://imgur.com/
   - Client ID: Gratuito
   - Límite: 10,000 requests/día
   - URLs: Permanentes

3. CLOUDINARY (Gratuito):
   - Registro: https://cloudinary.com/
   - Plan gratuito: 25GB almacenamiento
   - Transformaciones: Incluidas
   - CDN: Incluido

4. FIREBASE STORAGE:
   - Configuración: En Firebase Console
   - Integración: Con tu proyecto actual
   - Costo: Por uso (muy económico)
   - Seguridad: Muy alta
*/

// Notas importantes:

/*
1. Para desarrollo: Usa Picsum Photos (URLs temporales)
2. Para producción: Usa ImgBB, Imgur o Cloudinary
3. Las fotos solo se pueden actualizar, no crear
4. Siempre valida las URLs antes de guardar
5. Incluye imagen por defecto en React Native
6. Maneja errores de carga de imagen
*/
