// Ejemplo de implementación para React Native - Gestión de Hijos con Gestación
// Actualizar tu childrenService con esta nueva estructura

// Tipos de datos para hijos con gestación
export interface Child {
  id: string;
  parentId: string;
  name: string;
  ageInMonths: number | null; // Edad en meses (null si no ha nacido)
  isUnborn: boolean; // true = bebé en gestación, false = bebé nacido
  gestationWeeks: number | null; // Semanas de gestación (null si ya nació)
  createdAt: string;
  updatedAt: string;
}

export interface CreateChildData {
  name: string;
  ageInMonths?: number; // Solo si isUnborn = false
  isUnborn: boolean;
  gestationWeeks?: number; // Solo si isUnborn = true
}

export interface UpdateChildData {
  name?: string;
  ageInMonths?: number;
  isUnborn?: boolean;
  gestationWeeks?: number;
}

// Servicios para gestión de hijos con gestación
export const childrenService = {
  // Obtener todos los hijos del usuario
  getChildren: async () => {
    console.log('👶 [CHILDREN] Obteniendo lista de hijos...');
    
    try {
      const response = await api.get('/api/auth/children');
      console.log('✅ [CHILDREN] Hijos obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error obteniendo hijos:', error);
      throw error;
    }
  },

  // Agregar un nuevo hijo (nacido o en gestación)
  addChild: async (data: CreateChildData) => {
    console.log('👶 [CHILDREN] Agregando hijo:', data);
    
    try {
      const response = await api.post('/api/auth/children', data);
      console.log('✅ [CHILDREN] Hijo agregado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error agregando hijo:', error);
      throw error;
    }
  },

  // Actualizar un hijo existente
  updateChild: async (childId: string, data: UpdateChildData) => {
    console.log('👶 [CHILDREN] Actualizando hijo:', childId, data);
    
    try {
      const response = await api.put(`/api/auth/children/${childId}`, data);
      console.log('✅ [CHILDREN] Hijo actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error actualizando hijo:', error);
      throw error;
    }
  },

  // Eliminar un hijo
  deleteChild: async (childId: string) => {
    console.log('👶 [CHILDREN] Eliminando hijo:', childId);
    
    try {
      const response = await api.delete(`/api/auth/children/${childId}`);
      console.log('✅ [CHILDREN] Hijo eliminado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error eliminando hijo:', error);
      throw error;
    }
  },

  // Calcular edad en meses desde fecha de nacimiento
  calculateAge: async (birthDate: string) => {
    console.log('📅 [CHILDREN] Calculando edad para fecha:', birthDate);
    
    try {
      const response = await api.post('/api/auth/children/calculate-age', { birthDate });
      console.log('✅ [CHILDREN] Edad calculada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error calculando edad:', error);
      throw error;
    }
  }
};

// Funciones de utilidad
export const childUtils = {
  // Formatear edad para mostrar
  formatAge: (child: Child) => {
    if (child.isUnborn) {
      return `${child.gestationWeeks} semanas de gestación`;
    } else {
      if (child.ageInMonths === 0) {
        return 'Recién nacido';
      } else if (child.ageInMonths === 1) {
        return '1 mes';
      } else if (child.ageInMonths < 12) {
        return `${child.ageInMonths} meses`;
      } else {
        const years = Math.floor(child.ageInMonths / 12);
        const months = child.ageInMonths % 12;
        if (months === 0) {
          return `${years} año${years > 1 ? 's' : ''}`;
        } else {
          return `${years} año${years > 1 ? 's' : ''} y ${months} mes${months > 1 ? 'es' : ''}`;
        }
      }
    }
  },

  // Verificar si es un bebé recién nacido
  isNewborn: (child: Child) => {
    return !child.isUnborn && child.ageInMonths === 0;
  },

  // Verificar si es un bebé en gestación
  isPregnant: (child: Child) => {
    return child.isUnborn;
  }
};

// Ejemplo de uso en componentes React Native:

/*
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { childrenService, childUtils } from './services/childrenService';

const AddChildScreen = () => {
  const [name, setName] = useState('');
  const [isUnborn, setIsUnborn] = useState(false);
  const [ageInMonths, setAgeInMonths] = useState('');
  const [gestationWeeks, setGestationWeeks] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddChild = async () => {
    try {
      setLoading(true);
      
      let childData = {
        name: name.trim(),
        isUnborn: isUnborn
      };

      if (isUnborn) {
        // Bebé en gestación
        childData.gestationWeeks = parseInt(gestationWeeks);
      } else {
        // Bebé nacido
        if (birthDate) {
          // Calcular edad desde fecha de nacimiento
          const ageResponse = await childrenService.calculateAge(birthDate);
          childData.ageInMonths = ageResponse.data.ageInMonths;
        } else {
          // Usar edad manual
          childData.ageInMonths = parseInt(ageInMonths) || 0;
        }
      }

      await childrenService.addChild(childData);
      Alert.alert('Éxito', 'Hijo agregado correctamente');
      
      // Limpiar formulario
      setName('');
      setIsUnborn(false);
      setAgeInMonths('');
      setGestationWeeks('');
      setBirthDate('');
      
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error agregando hijo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Agregar Hijo
      </Text>

      <TextInput
        placeholder="Nombre del bebé"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, padding: 10, marginBottom: 15 }}
      />

      {/* Switch para bebé nacido/no nacido */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
        <Text style={{ marginRight: 10 }}>¿Ya nació?</Text>
        <Switch
          value={!isUnborn}
          onValueChange={(value) => setIsUnborn(!value)}
        />
        <Text style={{ marginLeft: 10 }}>
          {isUnborn ? 'En gestación' : 'Ya nació'}
        </Text>
      </View>

      {isUnborn ? (
        // Campos para bebé en gestación
        <View>
          <Text style={{ marginBottom: 10 }}>Semanas de gestación:</Text>
          <TextInput
            placeholder="Ej: 24"
            value={gestationWeeks}
            onChangeText={setGestationWeeks}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, marginBottom: 15 }}
          />
        </View>
      ) : (
        // Campos para bebé nacido
        <View>
          <Text style={{ marginBottom: 10 }}>Fecha de nacimiento (opcional):</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            value={birthDate}
            onChangeText={setBirthDate}
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          
          <Text style={{ marginBottom: 10 }}>O edad en meses:</Text>
          <TextInput
            placeholder="Ej: 6"
            value={ageInMonths}
            onChangeText={setAgeInMonths}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, marginBottom: 15 }}
          />
        </View>
      )}

      <TouchableOpacity
        onPress={handleAddChild}
        disabled={loading || !name.trim()}
        style={{
          backgroundColor: loading || !name.trim() ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {loading ? 'Agregando...' : 'Agregar Hijo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente para mostrar lista de hijos
const ChildrenList = ({ children }) => {
  return (
    <View>
      {children.map(child => (
        <View key={child.id} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{child.name}</Text>
          <Text style={{ color: '#666' }}>
            {childUtils.formatAge(child)}
          </Text>
          {child.isUnborn && (
            <Text style={{ color: '#007AFF', fontStyle: 'italic' }}>
              🍼 Bebé en gestación
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

export default AddChildScreen;
*/

// Estructura de datos que se envía al servidor:

/*
// Para bebé en gestación:
POST /api/auth/children
{
  "name": "Bebé Lojan",
  "isUnborn": true,
  "gestationWeeks": 24
}

// Para bebé nacido:
POST /api/auth/children
{
  "name": "Juan Lojan",
  "isUnborn": false,
  "ageInMonths": 6
}

// O con fecha de nacimiento:
POST /api/auth/children/calculate-age
{
  "birthDate": "2025-02-15"
}

// Respuesta:
{
  "success": true,
  "data": {
    "ageInMonths": 6,
    "ageInDays": 194
  }
}
*/
