# 🚪 API Salir de Comunidad - Munpa

Endpoint para que los usuarios puedan abandonar una comunidad de la que son miembros.

---

## 🎯 Endpoint

### Salir de una Comunidad

**POST** `/api/communities/:communityId/leave`

Permite a un usuario miembro salir de una comunidad.

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros URL:**
- `communityId` (requerido): ID de la comunidad

**Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Has salido de la comunidad exitosamente"
}
```

**Errores:**

1. **No es miembro (400)**:
```json
{
  "success": false,
  "message": "No eres miembro de esta comunidad"
}
```

2. **Es el creador (400)**:
```json
{
  "success": false,
  "message": "No puedes salir de una comunidad que creaste. Debes eliminarla o transferir la propiedad primero."
}
```

3. **Comunidad no encontrada (404)**:
```json
{
  "success": false,
  "message": "Comunidad no encontrada"
}
```

---

## 🔒 Validaciones Implementadas

1. **Verificar que la comunidad existe**
2. **Verificar que el usuario es miembro**
3. **Prevenir que el creador salga**: El creador no puede salir de su propia comunidad
4. **Actualizar contador**: Decrementa `memberCount` automáticamente
5. **Remover de array**: Usa `arrayRemove` para quitar al usuario de `members`

---

## 📊 Cambios en Firestore

Al salir de una comunidad:

```javascript
// Antes
{
  members: ["user1", "user2", "user3"],
  memberCount: 3
}

// Después (user2 salió)
{
  members: ["user1", "user3"],
  memberCount: 2
}
```

---

## 📱 Implementación en React Native

### Service:

```typescript
// services/communityService.ts

export const communityService = {
  // ... métodos existentes ...

  // Salir de comunidad
  leaveCommunity: async (communityId: string) => {
    try {
      const response = await api.post(
        `/api/communities/${communityId}/leave`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
```

### Hook personalizado:

```typescript
// hooks/useCommunityActions.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { communityService } from '../services/communityService';

export const useCommunityActions = () => {
  const [loading, setLoading] = useState(false);

  const leaveCommunity = async (
    communityId: string,
    communityName: string,
    onSuccess?: () => void
  ) => {
    Alert.alert(
      'Salir de Comunidad',
      `¿Estás seguro de que quieres salir de "${communityName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await communityService.leaveCommunity(communityId);
              
              Alert.alert(
                'Éxito',
                'Has salido de la comunidad',
                [
                  {
                    text: 'OK',
                    onPress: onSuccess
                  }
                ]
              );
            } catch (error: any) {
              const errorMessage = 
                error.response?.data?.message || 
                'No se pudo salir de la comunidad';
              
              Alert.alert('Error', errorMessage);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return { leaveCommunity, loading };
};
```

---

## 🎨 Componentes UI

### Botón "Salir de Comunidad":

```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCommunityActions } from '../hooks/useCommunityActions';

interface LeaveCommunityButtonProps {
  communityId: string;
  communityName: string;
  onSuccess?: () => void;
}

const LeaveCommunityButton: React.FC<LeaveCommunityButtonProps> = ({
  communityId,
  communityName,
  onSuccess
}) => {
  const { leaveCommunity, loading } = useCommunityActions();

  const handlePress = () => {
    leaveCommunity(communityId, communityName, onSuccess);
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#F44336" />
      ) : (
        <>
          <Icon name="exit-to-app" size={20} color="#F44336" />
          <Text style={styles.buttonText}>Salir de la Comunidad</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
});

export default LeaveCommunityButton;
```

---

### Pantalla de Detalle de Comunidad:

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { communityService } from '../services/communityService';
import LeaveCommunityButton from '../components/LeaveCommunityButton';

const CommunityDetailScreen = ({ route, navigation }) => {
  const { communityId } = route.params;
  const [community, setCommunity] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadCommunity();
  }, []);

  const loadCommunity = async () => {
    try {
      const response = await communityService.getCommunity(communityId);
      setCommunity(response.data);
      setIsMember(response.data.isMember);
      setIsOwner(response.data.isOwner);
    } catch (error) {
      console.error('Error loading community:', error);
    }
  };

  const handleLeaveSuccess = () => {
    // Navegar de vuelta y refrescar lista
    navigation.goBack();
  };

  if (!community) {
    return <View style={styles.loading}><Text>Cargando...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header con imagen */}
      <Image
        source={{ uri: community.imageUrl }}
        style={styles.headerImage}
      />

      {/* Información */}
      <View style={styles.content}>
        <Text style={styles.name}>{community.name}</Text>
        <Text style={styles.description}>{community.description}</Text>

        {/* Estadísticas */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Icon name="people" size={20} color="#666" />
            <Text style={styles.statText}>
              {community.memberCount} miembros
            </Text>
          </View>
          <View style={styles.stat}>
            <Icon name="article" size={20} color="#666" />
            <Text style={styles.statText}>
              {community.postCount} publicaciones
            </Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          {isOwner ? (
            // El creador ve botón de editar
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditCommunity', { communityId })}
            >
              <Icon name="edit" size={20} color="#2196F3" />
              <Text style={styles.editButtonText}>Editar Comunidad</Text>
            </TouchableOpacity>
          ) : isMember ? (
            // Los miembros ven botón de salir
            <LeaveCommunityButton
              communityId={communityId}
              communityName={community.name}
              onSuccess={handleLeaveSuccess}
            />
          ) : (
            // Los no-miembros ven botón de unirse
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleJoin}
            >
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.joinButtonText}>Unirse</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Posts de la comunidad */}
        {/* ... */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    marginBottom: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CommunityDetailScreen;
```

---

## 🎯 Casos de Uso

### 1. Usuario Regular Saliendo:

```typescript
// Usuario es miembro, no es creador
POST /api/communities/comm123/leave

// Respuesta:
{
  "success": true,
  "message": "Has salido de la comunidad exitosamente"
}

// Resultado:
// - Removido de members[]
// - memberCount decrementado
// - Ya no puede ver posts privados
// - Puede volver a unirse después
```

### 2. Creador Intentando Salir:

```typescript
// Usuario es el creador de la comunidad
POST /api/communities/comm123/leave

// Respuesta:
{
  "success": false,
  "message": "No puedes salir de una comunidad que creaste..."
}

// Resultado:
// - No se permite
// - Debe eliminar la comunidad o transferir propiedad
```

### 3. No-Miembro Intentando Salir:

```typescript
// Usuario no es miembro
POST /api/communities/comm123/leave

// Respuesta:
{
  "success": false,
  "message": "No eres miembro de esta comunidad"
}

// Resultado:
// - No se permite (no es miembro)
```

---

## 🔄 Flujo Completo

```
1. Usuario ve "Salir de Comunidad" en la comunidad
2. Click en el botón
3. Alert de confirmación: "¿Estás seguro?"
4. Si confirma:
   a. POST a /api/communities/:id/leave
   b. Backend valida:
      - ¿Comunidad existe? ✓
      - ¿Es miembro? ✓
      - ¿Es creador? ✗ (no permitido)
   c. Si OK, remover de members y decrementar memberCount
5. Mostrar mensaje de éxito
6. Navegar de vuelta o refrescar
```

---

## 💡 Mejoras Futuras (Opcionales)

1. **Transferir Propiedad**:
   - Permitir al creador transferir la propiedad a otro miembro
   - Luego poder salir

2. **Motivo de Salida**:
   - Opcional: Agregar campo `reason` para analytics
   - Entender por qué los usuarios salen

3. **Notificaciones**:
   - Notificar al creador cuando alguien sale
   - Email de "Te extrañamos" después de X días

4. **Reingreso Automático**:
   - Si la comunidad es pública, puede volver a unirse
   - Si es privada, debe solicitar nuevamente

---

## ✨ Características

✅ **Validación completa**: Verifica membresía y propiedad  
✅ **Protección del creador**: No puede salir de su propia comunidad  
✅ **Actualización atómica**: Usa `arrayRemove` para evitar inconsistencias  
✅ **Contador automático**: Decrementa `memberCount` automáticamente  
✅ **Confirmación UI**: Alert antes de salir  
✅ **Manejo de errores**: Mensajes claros para cada caso  

---

## 📝 Notas Importantes

1. **El creador no puede salir**: Debe eliminar la comunidad o transferir la propiedad primero.

2. **Puede volver a unirse**: Un usuario que salió puede volver a unirse (sujeto a tipo de comunidad).

3. **Operación atómica**: Usa `arrayRemove` para evitar condiciones de carrera.

4. **Sin efecto en posts**: Los posts del usuario permanecen en la comunidad después de salir.

5. **Actualización en tiempo real**: El contador de miembros se actualiza inmediatamente.

