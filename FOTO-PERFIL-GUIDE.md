# 📸 Guía: Foto de Perfil del Usuario

## 📋 Endpoints Disponibles

### 1. Subir Foto de Perfil (desde dispositivo)
**POST** `/api/auth/profile/photo`

Sube una foto desde el dispositivo del usuario a Firebase Storage.

### 2. Actualizar Foto con URL Externa
**PUT** `/api/auth/profile/photo`

Actualiza la foto de perfil con una URL externa (ej: foto de Google/Apple).

### 3. Eliminar Foto de Perfil
**DELETE** `/api/auth/profile/photo`

Elimina la foto de perfil del usuario.

---

## 📱 Implementación en React Native

### 1. Instalar Dependencias

```bash
npm install react-native-image-picker
npm install axios
```

### 2. Configurar Permisos

**iOS - `ios/YourApp/Info.plist`:**
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Necesitamos acceso a tus fotos para actualizar tu foto de perfil</string>
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a tu cámara para tomar una foto de perfil</string>
```

**Android - `android/app/src/main/AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## 💻 Código del Frontend

### Servicio para Foto de Perfil

Crea `services/profilePhoto.js`:

```javascript
import axios from 'axios';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://mumpabackend-9h7nfd2nt-mishu-lojans-projects.vercel.app';

/**
 * Obtener el token de autenticación
 */
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
  }
};

/**
 * Seleccionar foto de la galería
 */
export const selectPhotoFromGallery = () => {
  return new Promise((resolve, reject) => {
    const options = {
      mediaType: 'photo',
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.8,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        resolve({ cancelled: true });
      } else if (response.errorCode) {
        reject(new Error(response.errorMessage || 'Error al seleccionar foto'));
      } else if (response.assets && response.assets[0]) {
        resolve({
          cancelled: false,
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          name: response.assets[0].fileName || 'photo.jpg'
        });
      }
    });
  });
};

/**
 * Tomar foto con la cámara
 */
export const takePhotoWithCamera = () => {
  return new Promise((resolve, reject) => {
    const options = {
      mediaType: 'photo',
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: true,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        resolve({ cancelled: true });
      } else if (response.errorCode) {
        reject(new Error(response.errorMessage || 'Error al tomar foto'));
      } else if (response.assets && response.assets[0]) {
        resolve({
          cancelled: false,
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          name: response.assets[0].fileName || 'photo.jpg'
        });
      }
    });
  });
};

/**
 * Subir foto de perfil al backend
 * @param {Object} photo - Objeto con uri, type y name de la foto
 * @returns {Promise<{success: boolean, photoURL?: string, error?: string}>}
 */
export const uploadProfilePhoto = async (photo) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No hay sesión activa'
      };
    }

    console.log('📸 Subiendo foto de perfil...');

    // Crear FormData
    const formData = new FormData();
    formData.append('photo', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.name || 'profile-photo.jpg'
    });

    // Enviar al backend
    const response = await axios.post(
      `${API_URL}/api/auth/profile/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000 // 30 segundos
      }
    );

    console.log('✅ Foto subida exitosamente');

    return {
      success: true,
      photoURL: response.data.data.photoURL
    };

  } catch (error) {
    console.error('❌ Error al subir foto:', error);
    
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || 'Error del servidor'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error al subir la foto'
    };
  }
};

/**
 * Actualizar foto de perfil con URL externa
 * @param {string} photoURL - URL de la foto
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProfilePhotoURL = async (photoURL) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No hay sesión activa'
      };
    }

    console.log('📸 Actualizando URL de foto de perfil...');

    const response = await axios.put(
      `${API_URL}/api/auth/profile/photo`,
      { photoURL },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ URL de foto actualizada exitosamente');

    return {
      success: true,
      photoURL: response.data.data.photoURL
    };

  } catch (error) {
    console.error('❌ Error al actualizar URL de foto:', error);
    
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || 'Error del servidor'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error al actualizar la foto'
    };
  }
};

/**
 * Eliminar foto de perfil
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteProfilePhoto = async () => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No hay sesión activa'
      };
    }

    console.log('🗑️ Eliminando foto de perfil...');

    await axios.delete(
      `${API_URL}/api/auth/profile/photo`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Foto eliminada exitosamente');

    return {
      success: true
    };

  } catch (error) {
    console.error('❌ Error al eliminar foto:', error);
    
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || 'Error del servidor'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error al eliminar la foto'
    };
  }
};

/**
 * Flujo completo: Seleccionar y subir foto de perfil
 * @param {'gallery' | 'camera'} source - De dónde tomar la foto
 * @returns {Promise<{success: boolean, photoURL?: string, error?: string}>}
 */
export const selectAndUploadProfilePhoto = async (source = 'gallery') => {
  try {
    console.log(`📸 Seleccionando foto desde ${source}...`);

    // 1. Seleccionar foto
    const photo = source === 'camera' 
      ? await takePhotoWithCamera()
      : await selectPhotoFromGallery();

    if (photo.cancelled) {
      return {
        success: false,
        error: 'Selección cancelada',
        cancelled: true
      };
    }

    // 2. Subir foto
    const result = await uploadProfilePhoto(photo);

    return result;

  } catch (error) {
    console.error('❌ Error en flujo de foto:', error);
    return {
      success: false,
      error: error.message || 'Error al procesar la foto'
    };
  }
};
```

---

## 🎨 Componente de Foto de Perfil

```javascript
import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform
} from 'react-native';
import {
  selectAndUploadProfilePhoto,
  deleteProfilePhoto
} from './services/profilePhoto';

const ProfilePhoto = ({ photoURL, onPhotoUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(photoURL);

  const showPhotoOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tomar Foto', 'Seleccionar de Galería', 'Eliminar Foto'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await handleSelectPhoto('camera');
          } else if (buttonIndex === 2) {
            await handleSelectPhoto('gallery');
          } else if (buttonIndex === 3) {
            await handleDeletePhoto();
          }
        }
      );
    } else {
      // Android - usar Alert
      Alert.alert(
        'Foto de Perfil',
        'Selecciona una opción',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Tomar Foto', onPress: () => handleSelectPhoto('camera') },
          { text: 'Galería', onPress: () => handleSelectPhoto('gallery') },
          currentPhoto && {
            text: 'Eliminar',
            onPress: handleDeletePhoto,
            style: 'destructive'
          }
        ].filter(Boolean)
      );
    }
  };

  const handleSelectPhoto = async (source) => {
    setLoading(true);

    const result = await selectAndUploadProfilePhoto(source);

    setLoading(false);

    if (result.success) {
      setCurrentPhoto(result.photoURL);
      onPhotoUpdated && onPhotoUpdated(result.photoURL);
      Alert.alert('¡Éxito!', 'Tu foto de perfil ha sido actualizada');
    } else if (!result.cancelled) {
      Alert.alert('Error', result.error);
    }
  };

  const handleDeletePhoto = async () => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás segura de que quieres eliminar tu foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await deleteProfilePhoto();
            setLoading(false);

            if (result.success) {
              setCurrentPhoto(null);
              onPhotoUpdated && onPhotoUpdated(null);
              Alert.alert('Éxito', 'Foto eliminada');
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={showPhotoOptions}
        disabled={loading}
        style={styles.photoContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF69B4" />
          </View>
        ) : currentPhoto ? (
          <Image
            source={{ uri: currentPhoto }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>📷</Text>
          </View>
        )}
        
        {/* Badge de cámara */}
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>✏️</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.hint}>Toca para cambiar tu foto</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
  },
  placeholderText: {
    fontSize: 48,
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  badgeIcon: {
    fontSize: 16,
  },
  hint: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default ProfilePhoto;
```

---

## 📝 Uso en Pantalla de Perfil

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProfilePhoto from './components/ProfilePhoto';
import auth from '@react-native-firebase/auth';

const ProfileScreen = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = auth().currentUser;
    setUser(currentUser);
  }, []);

  const handlePhotoUpdated = (newPhotoURL) => {
    // Actualizar el estado local
    setUser(prevUser => ({
      ...prevUser,
      photoURL: newPhotoURL
    }));

    // Recargar el usuario de Firebase Auth para obtener datos actualizados
    auth().currentUser?.reload();
  };

  return (
    <View style={styles.container}>
      <ProfilePhoto 
        photoURL={user?.photoURL}
        onPhotoUpdated={handlePhotoUpdated}
      />
      
      <Text style={styles.name}>{user?.displayName || 'Usuario'}</Text>
      <Text style={styles.email}>{user?.email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    backgroundColor: '#FFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
});

export default ProfileScreen;
```

---

## 🔍 Detalles Técnicos

### Almacenamiento
- Las fotos se guardan en Firebase Storage en la ruta: `profile-photos/{uid}/{timestamp}_{filename}`
- Las fotos son públicas y accesibles vía URL
- La URL se guarda en Firebase Auth y Firestore

### Tamaño y Optimización
- Máximo recomendado: 1000x1000 px
- Calidad: 80%
- Formato soportado: JPEG, PNG

### Seguridad
- Requiere autenticación (token JWT)
- Solo el usuario puede modificar su propia foto
- Las fotos antiguas se eliminan automáticamente al subir una nueva

---

## ✅ Checklist

- [ ] Instalé `react-native-image-picker`
- [ ] Configuré los permisos en iOS y Android
- [ ] Copié el servicio `profilePhoto.js`
- [ ] Implementé el componente `ProfilePhoto`
- [ ] Probé subir foto desde galería
- [ ] Probé tomar foto con cámara
- [ ] Probé eliminar foto de perfil
- [ ] La foto se actualiza correctamente en el perfil

---

**¡Listo! 🎉 Tus usuarios ahora pueden personalizar su foto de perfil.**

