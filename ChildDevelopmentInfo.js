import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import learningService from './learning-service';

const ChildDevelopmentInfo = () => {
  const [childData, setChildData] = useState({
    name: '',
    ageInMonths: '',
    isUnborn: false,
    gestationWeeks: ''
  });
  const [developmentInfo, setDevelopmentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener información de desarrollo
  const getDevelopmentInfo = async () => {
    if (!childData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del niño');
      return;
    }

    if (childData.isUnborn && !childData.gestationWeeks) {
      Alert.alert('Error', 'Para niños por nacer, ingresa las semanas de gestación');
      return;
    }

    if (!childData.isUnborn && !childData.ageInMonths && childData.ageInMonths !== 0) {
      Alert.alert('Error', 'Para niños nacidos, ingresa la edad en meses');
      return;
    }

    setIsLoading(true);
    try {
      const result = await learningService.getChildDevelopmentInfo(
        childData.name.trim(),
        childData.isUnborn ? null : parseInt(childData.ageInMonths),
        childData.isUnborn,
        childData.isUnborn ? parseInt(childData.gestationWeeks) : null
      );

      setDevelopmentInfo(result.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la información de desarrollo');
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar formulario
  const clearForm = () => {
    setChildData({
      name: '',
      ageInMonths: '',
      isUnborn: false,
      gestationWeeks: ''
    });
    setDevelopmentInfo(null);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="baby" size={24} color="#E91E63" />
        <Text style={styles.headerTitle}>Información de Desarrollo</Text>
      </View>

      {/* Formulario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👶 Datos del Niño</Text>
        
        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nombre del niño *</Text>
          <TextInput
            style={styles.textInput}
            value={childData.name}
            onChangeText={(text) => setChildData(prev => ({ ...prev, name: text }))}
            placeholder="Ej: María, Juan, etc."
          />
        </View>

        {/* Tipo de niño */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tipo</Text>
          <View style={styles.switchContainer}>
            <Switch
              value={childData.isUnborn}
              onValueChange={(value) => setChildData(prev => ({ 
                ...prev, 
                isUnborn: value,
                ageInMonths: value ? '' : prev.ageInMonths,
                gestationWeeks: value ? prev.gestationWeeks : ''
              }))}
              trackColor={{ false: '#e0e0e0', true: '#E91E63' }}
              thumbColor={childData.isUnborn ? '#fff' : '#f4f3f4'}
            />
            <Text style={styles.switchLabel}>
              {childData.isUnborn ? 'Por nacer' : 'Nacido'}
            </Text>
          </View>
        </View>

        {/* Edad o semanas de gestación */}
        {childData.isUnborn ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Semanas de gestación *</Text>
            <TextInput
              style={styles.textInput}
              value={childData.gestationWeeks}
              onChangeText={(text) => setChildData(prev => ({ ...prev, gestationWeeks: text }))}
              placeholder="Ej: 20, 32, etc."
              keyboardType="numeric"
            />
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Edad en meses *</Text>
            <TextInput
              style={styles.textInput}
              value={childData.ageInMonths}
              onChangeText={(text) => setChildData(prev => ({ ...prev, ageInMonths: text }))}
              placeholder="Ej: 6, 12, 24, etc."
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={clearForm}
          >
            <Ionicons name="refresh" size={20} color="#E91E63" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Limpiar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={getDevelopmentInfo}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="search" size={20} color="white" />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? 'Consultando...' : 'Obtener Información'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Información de desarrollo */}
      {developmentInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📊 Información de {developmentInfo.childName}
          </Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.childName}>{developmentInfo.childName}</Text>
              <View style={styles.ageBadge}>
                <Text style={styles.ageText}>
                  {developmentInfo.isUnborn 
                    ? `${developmentInfo.gestationWeeks} semanas`
                    : `${developmentInfo.ageInMonths} meses`
                  }
                </Text>
              </View>
            </View>

            <Text style={styles.infoSubtitle}>
              {developmentInfo.isUnborn ? 'Desarrollo fetal' : 'Desarrollo infantil'}
            </Text>

            <View style={styles.bulletsContainer}>
              {developmentInfo.developmentInfo.map((info, index) => (
                <View key={index} style={styles.bulletItem}>
                  <Text style={styles.bulletText}>{info}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.timestamp}>
              Consultado el {new Date(developmentInfo.timestamp).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}

      {/* Información adicional */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Información Importante</Text>
        <Text style={styles.infoText}>
          • Cada niño se desarrolla a su propio ritmo. Esta información es orientativa.
        </Text>
        <Text style={styles.infoText}>
          • Consulta con tu pediatra si tienes preocupaciones sobre el desarrollo.
        </Text>
        <Text style={styles.infoText}>
          • Los hitos del desarrollo son aproximados y pueden variar.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#E91E63',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E91E63',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#E91E63',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ageBadge: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  bulletsContainer: {
    gap: 12,
  },
  bulletItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bulletText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default ChildDevelopmentInfo;
