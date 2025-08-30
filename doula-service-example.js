// Ejemplo de servicio para la Doula Virtual
// Integración con ChatGPT para consejos de embarazo y crianza

// Servicios para la doula virtual
export const doulaService = {
  // Enviar mensaje a la doula virtual
  sendMessage: async (message, context = null) => {
    console.log('🤖 [DOULA] Enviando mensaje:', message.substring(0, 50) + '...');
    
    try {
      const response = await api.post('/api/doula/chat', {
        message: message,
        context: context
      });
      
      console.log('✅ [DOULA] Respuesta recibida');
      return response.data;
    } catch (error) {
      console.error('❌ [DOULA] Error enviando mensaje:', error);
      throw error;
    }
  },

  // Obtener historial de conversaciones
  getHistory: async () => {
    console.log('📚 [DOULA] Obteniendo historial...');
    
    try {
      const response = await api.get('/api/doula/history');
      
      console.log('✅ [DOULA] Historial obtenido');
      return response.data;
    } catch (error) {
      console.error('❌ [DOULA] Error obteniendo historial:', error);
      throw error;
    }
  }
};

// Ejemplo de uso en React Native:

/*
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { doulaService } from './services/doulaService';

const DoulaChatScreen = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await doulaService.getHistory();
      setHistory(result.data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Por favor ingresa un mensaje');
      return;
    }

    try {
      setLoading(true);
      
      const result = await doulaService.sendMessage(message);
      setResponse(result.data.response);
      
      // Limpiar mensaje y recargar historial
      setMessage('');
      loadHistory();
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        🤱 Doula Virtual
      </Text>

      {/* Historial de conversaciones */}
      <ScrollView style={{ flex: 1, marginBottom: 20 }}>
        {history.map((conversation, index) => (
          <View key={conversation.id} style={{ marginBottom: 15 }}>
            <View style={{ backgroundColor: '#E3F2FD', padding: 10, borderRadius: 10, marginBottom: 5 }}>
              <Text style={{ fontWeight: 'bold', color: '#1976D2' }}>Tú:</Text>
              <Text>{conversation.userMessage}</Text>
            </View>
            <View style={{ backgroundColor: '#F3E5F5', padding: 10, borderRadius: 10 }}>
              <Text style={{ fontWeight: 'bold', color: '#7B1FA2' }}>Doula:</Text>
              <Text>{conversation.doulaResponse}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Respuesta actual */}
      {response && (
        <View style={{ backgroundColor: '#F3E5F5', padding: 15, borderRadius: 10, marginBottom: 20 }}>
          <Text style={{ fontWeight: 'bold', color: '#7B1FA2', marginBottom: 5 }}>
            🤱 Respuesta de la Doula:
          </Text>
          <Text>{response}</Text>
        </View>
      )}

      {/* Input de mensaje */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 20,
            padding: 10,
            marginRight: 10
          }}
          placeholder="Escribe tu pregunta..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={loading}
          style={{
            backgroundColor: '#7B1FA2',
            padding: 10,
            borderRadius: 20,
            minWidth: 50,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white' }}>
            {loading ? '⏳' : '📤'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DoulaChatScreen;
*/

// Ejemplos de preguntas para la doula:

/*
const preguntasEjemplo = [
  "¿Qué ejercicios son seguros durante el embarazo?",
  "¿Cómo puedo prepararme para el parto?",
  "¿Cuáles son los síntomas normales del primer trimestre?",
  "¿Qué debo empacar en mi maleta para el hospital?",
  "¿Cómo puedo aliviar las náuseas matutinas?",
  "¿Cuándo debo llamar al médico?",
  "¿Qué alimentos debo evitar durante el embarazo?",
  "¿Cómo puedo dormir mejor en el tercer trimestre?",
  "¿Qué ejercicios de respiración me ayudarán en el parto?",
  "¿Cómo puedo preparar a mi pareja para el parto?",
  "¿Qué necesito saber sobre la lactancia?",
  "¿Cómo puedo manejar el estrés durante el embarazo?",
  "¿Cuáles son los beneficios de la doula física?",
  "¿Qué debo esperar en las visitas prenatales?",
  "¿Cómo puedo crear un plan de parto?"
];
*/

// Estructura de datos que se envía al servidor:

/*
// Enviar mensaje:
POST /api/doula/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "¿Qué ejercicios son seguros durante el embarazo?",
  "context": "Primer trimestre, 8 semanas"
}

// Respuesta:
{
  "success": true,
  "message": "Respuesta de la doula virtual",
  "data": {
    "response": "¡Hola! Me alegra que estés pensando en mantenerte activa durante tu embarazo...",
    "timestamp": "2025-08-29T..."
  }
}

// Obtener historial:
GET /api/doula/history
Authorization: Bearer <token>

// Respuesta:
{
  "success": true,
  "data": [
    {
      "id": "conversation123",
      "userId": "user123",
      "userMessage": "¿Qué ejercicios son seguros?",
      "doulaResponse": "Los ejercicios seguros incluyen...",
      "timestamp": "2025-08-29T...",
      "context": "Primer trimestre"
    }
  ]
}
*/

// Características de la Doula Virtual:

/*
🤱 FUNCIONALIDADES:
✅ Respuestas personalizadas basadas en el perfil del usuario
✅ Información médica básica y consejos de bienestar
✅ Apoyo emocional y empático
✅ Consejos prácticos sobre embarazo, parto y crianza
✅ Historial de conversaciones guardado
✅ Recomendaciones de cuándo consultar profesionales

🔒 SEGURIDAD:
✅ Aclaraciones de que no reemplaza atención médica
✅ Recomendaciones de consultar profesionales
✅ Información basada en evidencia
✅ Tono profesional y compasivo

📊 DATOS PERSONALIZADOS:
✅ Género del usuario
✅ Número de hijos
✅ Estado de embarazo
✅ Semanas de gestación
✅ Contexto específico de la pregunta

💾 ALMACENAMIENTO:
✅ Conversaciones guardadas en Firestore
✅ Historial accesible para el usuario
✅ Timestamps para seguimiento
✅ Contexto de cada conversación
*/
