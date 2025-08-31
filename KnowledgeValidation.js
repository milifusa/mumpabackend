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

const KnowledgeValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationForm, setShowValidationForm] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState({
    text: '',
    topic: '',
    stage: 'embarazo',
    source: 'medical_guidelines'
  });
  const [validation, setValidation] = useState({
    sourceVerified: false,
    medicalAccuracy: false,
    toneAppropriate: false,
    contentRelevant: false
  });

  // Validar conocimiento
  const validateKnowledge = async () => {
    if (!newKnowledge.text.trim() || !newKnowledge.topic.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Verificar que todas las validaciones estén completadas
    const isFullyValidated = Object.values(validation).every(item => item === true);
    
    if (!isFullyValidated) {
      Alert.alert('Validación Incompleta', 'Debes completar todas las validaciones del checklist');
      return;
    }

    setIsValidating(true);
    try {
      const metadata = {
        source: newKnowledge.source,
        topic: newKnowledge.topic,
        stage: newKnowledge.stage,
        version: '1.0',
        language: 'es',
        qualityScore: 0.95
      };

      const validationData = {
        approved: true,
        approvedBy: 'admin',
        approvedAt: new Date(),
        checklist: validation
      };

      await learningService.learnValidatedKnowledge(
        newKnowledge.text,
        metadata,
        validationData
      );

      Alert.alert('✅ Éxito', 'Conocimiento validado y aprendido correctamente');
      setShowValidationForm(false);
      setNewKnowledge({ text: '', topic: '', stage: 'embarazo', source: 'medical_guidelines' });
      setValidation({
        sourceVerified: false,
        medicalAccuracy: false,
        toneAppropriate: false,
        contentRelevant: false
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo validar el conocimiento');
    } finally {
      setIsValidating(false);
    }
  };

  // Ejecutar test de calidad
  const runQualityTest = async () => {
    try {
      const result = await learningService.runQualityTest();
      
      Alert.alert(
        '🧪 Test de Calidad Completado',
        `Puntuación: ${(result.data.averageScore * 100).toFixed(1)}%\nEstado: ${result.data.qualityStatus}`
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo ejecutar el test de calidad');
    }
  };

  // Borrar memoria del usuario
  const clearUserMemory = async () => {
    Alert.alert(
      '🗑️ Borrar Memoria',
      '¿Estás seguro de que quieres borrar toda tu memoria? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await learningService.clearUserMemory();
              Alert.alert('✅ Éxito', 'Memoria borrada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo borrar la memoria');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={24} color="#E91E63" />
        <Text style={styles.headerTitle}>Validación de Conocimiento</Text>
      </View>

      {/* Sección de Test de Calidad */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test de Calidad</Text>
        <Text style={styles.sectionDescription}>
          Ejecuta tests automáticos para verificar la calidad de las respuestas de Douli.
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runQualityTest}
        >
          <Ionicons name="flask" size={20} color="white" />
          <Text style={styles.buttonText}>Ejecutar Test de Calidad</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de Validación de Conocimiento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Validar Nuevo Conocimiento</Text>
        <Text style={styles.sectionDescription}>
          Agrega conocimiento médico validado que Douli aprenderá de manera segura.
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setShowValidationForm(true)}
        >
          <Ionicons name="add-circle" size={20} color="#E91E63" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Validar Conocimiento
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sección de Gestión de Memoria */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗑️ Gestión de Memoria</Text>
        <Text style={styles.sectionDescription}>
          Gestiona la memoria personal de Douli sobre tus preferencias y datos.
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearUserMemory}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.buttonText}>Borrar Mi Memoria</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Validación */}
      {showValidationForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Validar Conocimiento</Text>
              <TouchableOpacity onPress={() => setShowValidationForm(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Tema */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tema *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newKnowledge.topic}
                  onChangeText={(text) => setNewKnowledge(prev => ({ ...prev, topic: text }))}
                  placeholder="Ej: ejercicios_kegel, signos_alarma, etc."
                />
              </View>

              {/* Etapa */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Etapa</Text>
                <View style={styles.radioGroup}>
                  {['embarazo', 'posparto', 'lactancia', 'general'].map((stage) => (
                    <TouchableOpacity
                      key={stage}
                      style={[
                        styles.radioButton,
                        newKnowledge.stage === stage && styles.radioButtonSelected
                      ]}
                      onPress={() => setNewKnowledge(prev => ({ ...prev, stage }))}
                    >
                      <Text style={[
                        styles.radioButtonText,
                        newKnowledge.stage === stage && styles.radioButtonTextSelected
                      ]}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fuente */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fuente</Text>
                <TextInput
                  style={styles.textInput}
                  value={newKnowledge.source}
                  onChangeText={(text) => setNewKnowledge(prev => ({ ...prev, source: text }))}
                  placeholder="Ej: medical_guidelines, doula_expert, etc."
                />
              </View>

              {/* Conocimiento */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Conocimiento Médico *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newKnowledge.text}
                  onChangeText={(text) => setNewKnowledge(prev => ({ ...prev, text: text }))}
                  placeholder="Escribe el conocimiento médico validado..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* Checklist de Validación */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Checklist de Validación *</Text>
                
                <View style={styles.checklistItem}>
                  <Switch
                    value={validation.sourceVerified}
                    onValueChange={(value) => setValidation(prev => ({ ...prev, sourceVerified: value }))}
                    trackColor={{ false: '#e0e0e0', true: '#E91E63' }}
                    thumbColor={validation.sourceVerified ? '#fff' : '#f4f3f4'}
                  />
                  <Text style={styles.checklistText}>Fuente verificada</Text>
                </View>

                <View style={styles.checklistItem}>
                  <Switch
                    value={validation.medicalAccuracy}
                    onValueChange={(value) => setValidation(prev => ({ ...prev, medicalAccuracy: value }))}
                    trackColor={{ false: '#e0e0e0', true: '#E91E63' }}
                    thumbColor={validation.medicalAccuracy ? '#fff' : '#f4f3f4'}
                  />
                  <Text style={styles.checklistText}>Precisión médica</Text>
                </View>

                <View style={styles.checklistItem}>
                  <Switch
                    value={validation.toneAppropriate}
                    onValueChange={(value) => setValidation(prev => ({ ...prev, toneAppropriate: value }))}
                    trackColor={{ false: '#e0e0e0', true: '#E91E63' }}
                    thumbColor={validation.toneAppropriate ? '#fff' : '#f4f3f4'}
                  />
                  <Text style={styles.checklistText}>Tono apropiado</Text>
                </View>

                <View style={styles.checklistItem}>
                  <Switch
                    value={validation.contentRelevant}
                    onValueChange={(value) => setValidation(prev => ({ ...prev, contentRelevant: value }))}
                    trackColor={{ false: '#e0e0e0', true: '#E91E63' }}
                    thumbColor={validation.contentRelevant ? '#fff' : '#f4f3f4'}
                  />
                  <Text style={styles.checklistText}>Contenido relevante</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowValidationForm(false)}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={validateKnowledge}
                disabled={isValidating}
              >
                {isValidating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="shield-checkmark" size={20} color="white" />
                )}
                <Text style={styles.buttonText}>
                  {isValidating ? 'Validando...' : 'Validar y Aprender'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
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
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#E91E63',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  radioButtonSelected: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  radioButtonText: {
    fontSize: 14,
    color: '#666',
  },
  radioButtonTextSelected: {
    color: 'white',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checklistText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  cancelButtonText: {
    color: '#666',
  },
});

export default KnowledgeValidation;
