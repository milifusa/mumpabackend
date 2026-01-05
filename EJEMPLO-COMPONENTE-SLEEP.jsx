/**
 * 🛌 Componente de Predicción de Sueño
 * Ejemplo de implementación en React Native / React
 * Similar a la app Napper
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = 'https://tu-api.com';

const SleepPredictionScreen = ({ childId, authToken }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sleepPressure, setSleepPressure] = useState(null);
  const [activeRecording, setActiveRecording] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // Cargar predicción inicial
  useEffect(() => {
    loadPrediction();
    const interval = setInterval(loadPrediction, 5 * 60 * 1000); // Cada 5 minutos
    return () => clearInterval(interval);
  }, [childId]);

  // Actualizar countdown
  useEffect(() => {
    if (!prediction?.nextNap?.time) return;

    const interval = setInterval(() => {
      const now = new Date();
      const napTime = new Date(prediction.nextNap.time);
      const minutes = differenceInMinutes(napTime, now);
      
      if (minutes > 0) {
        setCountdown(minutes);
      } else {
        setCountdown(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [prediction]);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sleep/predict/${childId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setPrediction(data.prediction);
        setSleepPressure(data.prediction.sleepPressure);
      }
    } catch (error) {
      console.error('Error cargando predicción:', error);
      Alert.alert('Error', 'No se pudo cargar la predicción');
    } finally {
      setLoading(false);
    }
  };

  const startSleepRecording = async (type) => {
    try {
      const response = await fetch(`${API_URL}/api/sleep/record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          childId,
          type,
          startTime: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (data.success) {
        setActiveRecording({
          id: data.sleepEventId,
          type,
          startTime: new Date()
        });
        Alert.alert('✅ Iniciado', `Registro de ${type === 'nap' ? 'siesta' : 'sueño nocturno'} iniciado`);
      }
    } catch (error) {
      console.error('Error iniciando registro:', error);
      Alert.alert('Error', 'No se pudo iniciar el registro');
    }
  };

  const endSleepRecording = async (quality = 'good', wakeUps = 0) => {
    if (!activeRecording) return;

    try {
      const response = await fetch(`${API_URL}/api/sleep/${activeRecording.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          quality,
          wakeUps
        })
      });

      const data = await response.json();

      if (data.success) {
        const duration = Math.round(
          (new Date() - activeRecording.startTime) / 1000 / 60
        );
        
        setActiveRecording(null);
        await loadPrediction(); // Recargar predicción
        
        Alert.alert(
          '✅ Completado',
          `${activeRecording.type === 'nap' ? 'Siesta' : 'Sueño'} registrado: ${duration} minutos`
        );
      }
    } catch (error) {
      console.error('Error finalizando registro:', error);
      Alert.alert('Error', 'No se pudo finalizar el registro');
    }
  };

  const getSleepPressureColor = (level) => {
    switch(level) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'high': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getSleepPressureIcon = (level) => {
    switch(level) {
      case 'low': return '😊';
      case 'medium': return '😴';
      case 'high': return '😪';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  const formatCountdown = (minutes) => {
    if (minutes === null) return '--';
    if (minutes <= 0) return '¡Ahora!';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Analizando patrones de sueño...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Presión de Sueño */}
      {sleepPressure && (
        <View style={[
          styles.pressureCard,
          { backgroundColor: getSleepPressureColor(sleepPressure.level) + '20' }
        ]}>
          <View style={styles.pressureHeader}>
            <Text style={styles.pressureIcon}>
              {getSleepPressureIcon(sleepPressure.level)}
            </Text>
            <View style={styles.pressureInfo}>
              <Text style={styles.pressureTitle}>Presión de Sueño</Text>
              <Text style={styles.pressureLevel}>{sleepPressure.level.toUpperCase()}</Text>
            </View>
          </View>
          {sleepPressure.hoursSinceLastSleep !== null && (
            <Text style={styles.pressureTime}>
              {sleepPressure.hoursSinceLastSleep.toFixed(1)} horas desde último sueño
            </Text>
          )}
          <Text style={styles.pressureRecommendation}>
            {sleepPressure.recommendation}
          </Text>
        </View>
      )}

      {/* Próxima Siesta */}
      {prediction?.nextNap && (
        <View style={styles.predictionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🛌</Text>
            <Text style={styles.cardTitle}>Próxima Siesta</Text>
          </View>
          
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              {formatCountdown(countdown)}
            </Text>
            <Text style={styles.countdownLabel}>
              {countdown > 0 ? 'para la siesta' : ''}
            </Text>
          </View>

          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Hora óptima</Text>
            <Text style={styles.timeValue}>
              {format(new Date(prediction.nextNap.time), 'HH:mm', { locale: es })}
            </Text>
          </View>

          <View style={styles.windowInfo}>
            <Text style={styles.windowLabel}>Ventana ideal</Text>
            <Text style={styles.windowValue}>
              {format(new Date(prediction.nextNap.windowStart), 'HH:mm')} - 
              {format(new Date(prediction.nextNap.windowEnd), 'HH:mm')}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Duración</Text>
              <Text style={styles.detailValue}>{prediction.nextNap.expectedDuration}m</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Confianza</Text>
              <Text style={styles.detailValue}>{prediction.nextNap.confidence}%</Text>
            </View>
          </View>

          <Text style={styles.predictionReason}>{prediction.nextNap.reason}</Text>
        </View>
      )}

      {/* Hora de Dormir */}
      {prediction?.bedtime && (
        <View style={styles.predictionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🌙</Text>
            <Text style={styles.cardTitle}>Hora de Dormir</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeValue}>
              {format(new Date(prediction.bedtime.time), 'HH:mm', { locale: es })}
            </Text>
            <Text style={styles.consistencyBadge}>
              Consistencia: {prediction.bedtime.consistency}
            </Text>
          </View>

          <Text style={styles.confidenceText}>
            Confianza: {prediction.bedtime.confidence}%
          </Text>
        </View>
      )}

      {/* Botones de Registro */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Registrar Sueño</Text>
        
        {!activeRecording ? (
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.napButton]}
              onPress={() => startSleepRecording('nap')}
            >
              <Text style={styles.buttonIcon}>🛌</Text>
              <Text style={styles.buttonText}>Iniciar Siesta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.nightButton]}
              onPress={() => startSleepRecording('nightsleep')}
            >
              <Text style={styles.buttonIcon}>🌙</Text>
              <Text style={styles.buttonText}>Dormir Noche</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingHeader}>
              <Text style={styles.recordingIndicator}>🔴</Text>
              <Text style={styles.recordingText}>
                Registrando {activeRecording.type === 'nap' ? 'siesta' : 'sueño nocturno'}...
              </Text>
            </View>
            
            <Text style={styles.recordingTime}>
              Inicio: {format(activeRecording.startTime, 'HH:mm')}
            </Text>

            <View style={styles.endButtonsRow}>
              <TouchableOpacity
                style={[styles.endButton, styles.endGood]}
                onPress={() => endSleepRecording('good', 0)}
              >
                <Text style={styles.endButtonText}>Bien 😊</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.endButton, styles.endFair]}
                onPress={() => endSleepRecording('fair', 1)}
              >
                <Text style={styles.endButtonText}>Regular 😐</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.endButton, styles.endPoor]}
                onPress={() => endSleepRecording('poor', 2)}
              >
                <Text style={styles.endButtonText}>Malo 😔</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Recomendaciones */}
      {prediction?.recommendations && prediction.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>💡 Recomendaciones</Text>
          {prediction.recommendations.map((rec, index) => (
            <View
              key={index}
              style={[
                styles.recommendationCard,
                rec.type === 'warning' && styles.recommendationWarning,
                rec.type === 'success' && styles.recommendationSuccess
              ]}
            >
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
              <Text style={styles.recommendationMessage}>{rec.message}</Text>
              <Text style={styles.recommendationAction}>→ {rec.action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Patrones */}
      {prediction?.patterns && (
        <View style={styles.patternsContainer}>
          <Text style={styles.patternsTitle}>📊 Patrones de Sueño</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.round(prediction.patterns.totalDailySleep / 60)}h
              </Text>
              <Text style={styles.statLabel}>Sueño Total/Día</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {prediction.patterns.napStats.averagePerDay}
              </Text>
              <Text style={styles.statLabel}>Siestas/Día</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {prediction.patterns.napStats.averageDuration}m
              </Text>
              <Text style={styles.statLabel}>Duración Siesta</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {prediction.patterns.consistency}%
              </Text>
              <Text style={styles.statLabel}>Consistencia</Text>
            </View>
          </View>

          <View style={styles.qualityContainer}>
            <Text style={styles.qualityLabel}>Calidad General:</Text>
            <Text style={[
              styles.qualityValue,
              prediction.patterns.overallQuality === 'Excelente' && styles.qualityExcellent,
              prediction.patterns.overallQuality === 'Buena' && styles.qualityGood,
            ]}>
              {prediction.patterns.overallQuality}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={loadPrediction}>
        <Text style={styles.refreshButtonText}>🔄 Actualizar Predicción</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // Presión de Sueño
  pressureCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E1E8ED',
  },
  pressureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pressureIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  pressureInfo: {
    flex: 1,
  },
  pressureTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  pressureLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  pressureTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pressureRecommendation: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },

  // Tarjetas de Predicción
  predictionCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  // Countdown
  countdownContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6C5CE7',
  },
  countdownLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },

  // Información de Tiempo
  timeInfo: {
    alignItems: 'center',
    marginVertical: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },

  // Ventana
  windowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
  },
  windowLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  windowValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },

  // Detalles
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C5CE7',
  },

  // Razón
  predictionReason: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },

  // Consistencia
  consistencyBadge: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '600',
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },

  // Botones de Acción
  actionsContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  napButton: {
    backgroundColor: '#6C5CE7',
  },
  nightButton: {
    backgroundColor: '#2C3E50',
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Grabación Activa
  recordingContainer: {
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingIndicator: {
    fontSize: 12,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
  },
  recordingTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  endButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  endButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  endGood: {
    backgroundColor: '#4CAF50',
  },
  endFair: {
    backgroundColor: '#FFC107',
  },
  endPoor: {
    backgroundColor: '#F44336',
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Recomendaciones
  recommendationsContainer: {
    margin: 16,
    marginTop: 0,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationCard: {
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  recommendationWarning: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  recommendationSuccess: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recommendationAction: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Patrones
  patternsContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  patternsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C5CE7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  qualityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
  },
  qualityLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  qualityValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qualityExcellent: {
    color: '#4CAF50',
  },
  qualityGood: {
    color: '#6C5CE7',
  },

  // Botón Actualizar
  refreshButton: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SleepPredictionScreen;

