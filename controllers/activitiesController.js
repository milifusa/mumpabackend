/**
 * ================================================
 * 🎨 CONTROLADOR DE ACTIVIDADES INFANTILES
 * ================================================
 * Sugiere actividades apropiadas para hacer con el bebé
 * basado en edad, ventanas de vigilia y desarrollo infantil
 */

const admin = require('firebase-admin');
const OpenAI = require('openai');
const { differenceInMinutes } = require('date-fns');

class ActivitiesController {
  constructor() {
    this.db = admin.firestore();
    this.openai = null;

    // Inicializar OpenAI si hay API key
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ [ACTIVITIES] OpenAI inicializado correctamente');
    } else {
      console.warn('⚠️ [ACTIVITIES] OpenAI API key no encontrada');
    }
  }

  /**
   * Obtener sugerencias de actividades
   * GET /api/activities/suggestions/:childId
   */
  async getActivitySuggestions(req, res) {
    try {
      const userId = req.user.uid;
      const { childId } = req.params;

      console.log('🎨 [ACTIVITIES] Generando sugerencias de actividades');
      console.log(`   - childId: ${childId}`);
      console.log(`   - userId: ${userId}`);

      // 1. Obtener información del niño
      const childDoc = await this.db.collection('children').doc(childId).get();
      
      if (!childDoc.exists) {
        return res.status(404).json({
          error: 'Niño no encontrado'
        });
      }

      const childData = childDoc.data();
      
      // Validar permisos
      if (childData.parentId !== userId && !childData.sharedWith?.includes(userId)) {
        return res.status(403).json({
          error: 'No tienes permiso para acceder a este niño'
        });
      }

      // Calcular edad en meses
      const birthDate = childData.birthDate?.toDate();
      if (!birthDate) {
        return res.status(400).json({
          error: 'Fecha de nacimiento no encontrada'
        });
      }

      const ageInMonths = Math.floor(
        (new Date() - birthDate) / (1000 * 60 * 60 * 24 * 30.44)
      );

      console.log(`   - Nombre: ${childData.name}`);
      console.log(`   - Edad: ${ageInMonths} meses`);

      // 2. Obtener última siesta para calcular tiempo despierto
      const lastSleepSnapshot = await this.db
        .collection('sleepEvents')
        .where('childId', '==', childId)
        .where('userId', '==', userId)
        .orderBy('startTime', 'desc')
        .limit(1)
        .get();

      let minutesAwake = null;
      let lastSleepEnd = null;
      let energyLevel = 'unknown';

      if (!lastSleepSnapshot.empty) {
        const lastSleep = lastSleepSnapshot.docs[0].data();
        if (lastSleep.endTime) {
          lastSleepEnd = lastSleep.endTime.toDate();
          minutesAwake = differenceInMinutes(new Date(), lastSleepEnd);
          
          // Calcular nivel de energía basado en ventanas de vigilia
          const wakeWindows = this.getWakeWindows(ageInMonths);
          const hoursAwake = minutesAwake / 60;
          
          if (hoursAwake < wakeWindows.optimal * 0.5) {
            energyLevel = 'high'; // Recién despierto
          } else if (hoursAwake < wakeWindows.optimal * 0.8) {
            energyLevel = 'medium'; // En ventana óptima
          } else if (hoursAwake < wakeWindows.max) {
            energyLevel = 'low'; // Cerca de próxima siesta
          } else {
            energyLevel = 'very-low'; // Necesita dormir pronto
          }
        }
      }

      console.log(`   - Minutos despierto: ${minutesAwake || 'N/A'}`);
      console.log(`   - Nivel de energía: ${energyLevel}`);

      // 3. Obtener hora del día
      const now = new Date();
      const currentHour = now.getHours();
      const timeOfDay = this.getTimeOfDay(currentHour);

      console.log(`   - Hora del día: ${timeOfDay}`);

      // 4. Consultar a ChatGPT para sugerencias personalizadas
      const suggestions = await this.getAISuggestions({
        name: childData.name,
        ageInMonths,
        minutesAwake,
        energyLevel,
        timeOfDay,
        currentHour
      });

      // 5. Agregar información de ventanas de vigilia
      const wakeWindows = this.getWakeWindows(ageInMonths);

      res.json({
        success: true,
        childInfo: {
          name: childData.name,
          ageInMonths,
          ageDisplay: this.formatAge(ageInMonths)
        },
        currentState: {
          minutesAwake,
          hoursAwake: minutesAwake ? (minutesAwake / 60).toFixed(1) : null,
          energyLevel,
          energyLevelDisplay: this.getEnergyLevelDisplay(energyLevel),
          lastSleepEnd: lastSleepEnd?.toISOString() || null,
          timeOfDay,
          nextNapIn: this.estimateNextNap(minutesAwake, wakeWindows)
        },
        wakeWindows: {
          min: wakeWindows.min,
          optimal: wakeWindows.optimal,
          max: wakeWindows.max,
          unit: 'horas'
        },
        suggestions: suggestions || this.getDefaultSuggestions(ageInMonths, energyLevel, timeOfDay),
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [ACTIVITIES] Error:', error);
      res.status(500).json({
        error: 'Error al generar sugerencias de actividades',
        details: error.message
      });
    }
  }

  /**
   * Obtener sugerencias de ChatGPT
   */
  async getAISuggestions(childInfo) {
    if (!this.openai) {
      console.log('⚠️ [ACTIVITIES] OpenAI no disponible, usando sugerencias por defecto');
      return null;
    }

    try {
      const { name, ageInMonths, minutesAwake, energyLevel, timeOfDay, currentHour } = childInfo;
      const wakeWindows = this.getWakeWindows(ageInMonths);

      const prompt = `Eres un experto en desarrollo infantil y educación temprana con conocimiento de pediatría (AAP, CDC).

INFORMACIÓN DEL BEBÉ:
- Nombre: ${name}
- Edad: ${ageInMonths} meses (${this.formatAge(ageInMonths)})
- Tiempo despierto: ${minutesAwake ? `${Math.round(minutesAwake)} minutos (${(minutesAwake / 60).toFixed(1)} horas)` : 'Desconocido'}
- Nivel de energía: ${energyLevel}
- Momento del día: ${timeOfDay} (${currentHour}:00h)

VENTANAS DE VIGILIA RECOMENDADAS PARA ${ageInMonths} MESES:
- Mínimo: ${wakeWindows.min}h
- Óptimo: ${wakeWindows.optimal}h
- Máximo: ${wakeWindows.max}h

CONTEXTO DE ENERGÍA:
${this.getEnergyContext(energyLevel)}

SOLICITUD:
Sugiere 5-6 actividades apropiadas para hacer con ${name} AHORA, considerando:

1. **Desarrollo apropiado**: Actividades que estimulen habilidades de ${ageInMonths} meses
2. **Nivel de energía**: ${energyLevel} - ajusta intensidad según esto
3. **Momento del día**: ${timeOfDay} - considera luz natural, rutinas típicas
4. **Seguridad**: Solo actividades seguras y supervisadas para esta edad
5. **Diversidad**: Mezcla de actividades físicas, sensoriales, cognitivas y sociales

IMPORTANTE:
- Si el bebé lleva despierto más de ${wakeWindows.optimal}h, prioriza actividades calmadas
- Si está cerca de ${wakeWindows.max}h, sugiere solo actividades de transición a sueño
- Incluye actividades de diferentes tipos (motoras, sensoriales, lenguaje, vínculo)
- Sé específico con las actividades (no solo "jugar", sino "jugar a las escondidas con pañuelo")

FORMATO DE RESPUESTA (JSON):
{
  "activities": [
    {
      "title": "Nombre corto de la actividad",
      "description": "Descripción breve (1-2 líneas) de cómo hacerla",
      "duration": 10,
      "category": "motor|sensorial|cognitivo|social|lenguaje|calma",
      "intensity": "alta|media|baja",
      "developmentBenefit": "Qué habilidad desarrolla",
      "materials": ["Material 1", "Material 2"]
    }
  ],
  "generalTip": "Un consejo general para este momento del día y edad",
  "warningIfTired": "Mensaje de advertencia si está muy cansado (null si no aplica)"
}`;

      console.log('🤖 [ACTIVITIES] Consultando a ChatGPT...');

      const startTime = Date.now();
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un experto en desarrollo infantil temprano con conocimiento profundo de hitos del desarrollo, juego apropiado por edad y pedagogía infantil. Respondes SOLO en formato JSON válido con sugerencias prácticas y seguras."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7, // Más creatividad que predicciones
        max_tokens: 1500
      });

      const elapsed = Date.now() - startTime;
      console.log(`✅ [ACTIVITIES] Respuesta de ChatGPT recibida en ${elapsed}ms`);

      const aiResponse = JSON.parse(response.choices[0].message.content);
      console.log(`✅ [ACTIVITIES] ${aiResponse.activities?.length || 0} actividades sugeridas`);

      return aiResponse;

    } catch (error) {
      console.error('❌ [ACTIVITIES] Error consultando ChatGPT:', error.message);
      return null;
    }
  }

  /**
   * Ventanas de vigilia por edad (mismo que en sleep)
   */
  getWakeWindows(ageInMonths) {
    if (ageInMonths <= 1) {
      return { min: 0.75, optimal: 1, max: 1.5 };
    } else if (ageInMonths <= 3) {
      return { min: 1, optimal: 1.5, max: 2 };
    } else if (ageInMonths <= 6) {
      return { min: 1.5, optimal: 2, max: 2.5 };
    } else if (ageInMonths <= 9) {
      return { min: 2, optimal: 2.5, max: 3.5 };
    } else if (ageInMonths <= 12) {
      return { min: 2.5, optimal: 3, max: 4 };
    } else if (ageInMonths <= 18) {
      return { min: 3, optimal: 4, max: 5 };
    } else {
      return { min: 4, optimal: 5, max: 6 };
    }
  }

  /**
   * Momento del día
   */
  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'mañana';
    if (hour >= 12 && hour < 17) return 'tarde';
    if (hour >= 17 && hour < 21) return 'noche';
    return 'madrugada';
  }

  /**
   * Contexto de energía para ChatGPT
   */
  getEnergyContext(energyLevel) {
    const contexts = {
      'high': 'Recién despierto, con mucha energía. Ideal para actividades estimulantes y de alta intensidad.',
      'medium': 'En ventana óptima de vigilia. Puede hacer actividades variadas, está alerta y receptivo.',
      'low': 'Cerca de la próxima siesta. Prioriza actividades calmadas y de transición.',
      'very-low': 'Necesita dormir pronto. Solo actividades muy suaves y rutina pre-sueño.',
      'unknown': 'Tiempo despierto desconocido. Sugiere variedad de actividades.'
    };
    return contexts[energyLevel] || contexts.unknown;
  }

  /**
   * Display del nivel de energía
   */
  getEnergyLevelDisplay(energyLevel) {
    const displays = {
      'high': '🔋 Alta energía',
      'medium': '⚡ Energía media',
      'low': '🪫 Energía baja',
      'very-low': '😴 Muy cansado',
      'unknown': '❓ Desconocido'
    };
    return displays[energyLevel] || displays.unknown;
  }

  /**
   * Estimar tiempo hasta próxima siesta
   */
  estimateNextNap(minutesAwake, wakeWindows) {
    if (!minutesAwake) return null;

    const hoursAwake = minutesAwake / 60;
    const hoursUntilNap = Math.max(0, wakeWindows.optimal - hoursAwake);
    const minutesUntilNap = Math.round(hoursUntilNap * 60);

    if (minutesUntilNap <= 0) {
      return {
        minutes: 0,
        display: '¡Ahora!',
        status: 'overdue'
      };
    } else if (minutesUntilNap < 30) {
      return {
        minutes: minutesUntilNap,
        display: `${minutesUntilNap} minutos`,
        status: 'soon'
      };
    } else {
      return {
        minutes: minutesUntilNap,
        display: `${Math.round(hoursUntilNap * 10) / 10}h`,
        status: 'later'
      };
    }
  }

  /**
   * Formatear edad
   */
  formatAge(ageInMonths) {
    if (ageInMonths < 1) return 'Menos de 1 mes';
    if (ageInMonths === 1) return '1 mes';
    if (ageInMonths < 12) return `${ageInMonths} meses`;
    
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    
    if (months === 0) {
      return years === 1 ? '1 año' : `${years} años`;
    }
    
    return `${years} año${years > 1 ? 's' : ''} y ${months} mes${months > 1 ? 'es' : ''}`;
  }

  /**
   * Sugerencias por defecto (fallback si OpenAI falla)
   */
  getDefaultSuggestions(ageInMonths, energyLevel, timeOfDay) {
    // Sugerencias básicas por edad
    const defaultActivities = {
      '0-3': [
        {
          title: "Tiempo boca abajo",
          description: "Coloca al bebé boca abajo sobre una manta por 3-5 minutos para fortalecer cuello y espalda",
          duration: 5,
          category: "motor",
          intensity: "media",
          developmentBenefit: "Fortalece músculos del cuello y espalda",
          materials: ["Manta suave"]
        },
        {
          title: "Canciones y nanas",
          description: "Canta canciones suaves mientras haces contacto visual",
          duration: 10,
          category: "social",
          intensity: "baja",
          developmentBenefit: "Vínculo y desarrollo auditivo",
          materials: []
        }
      ],
      '4-6': [
        {
          title: "Exploración sensorial",
          description: "Deja que toque diferentes texturas: suave, rugoso, frío, cálido",
          duration: 15,
          category: "sensorial",
          intensity: "media",
          developmentBenefit: "Desarrollo sensorial y cognitivo",
          materials: ["Telas de diferentes texturas", "Juguetes variados"]
        },
        {
          title: "Juego de alcanzar objetos",
          description: "Coloca juguetes llamativos fuera de su alcance para motivar el movimiento",
          duration: 10,
          category: "motor",
          intensity: "alta",
          developmentBenefit: "Coordinación y motricidad gruesa",
          materials: ["Juguetes coloridos"]
        }
      ],
      '7-12': [
        {
          title: "Juego de escondidas",
          description: "Esconde tu cara con las manos o un pañuelo y reaparece",
          duration: 10,
          category: "cognitivo",
          intensity: "media",
          developmentBenefit: "Permanencia de objeto",
          materials: ["Pañuelo o tela"]
        },
        {
          title: "Exploración de causa-efecto",
          description: "Juguetes que hacen sonido al presionar, apilar cubos y tirarlos",
          duration: 15,
          category: "cognitivo",
          intensity: "media",
          developmentBenefit: "Entendimiento de causa y efecto",
          materials: ["Cubos", "Juguetes musicales"]
        }
      ]
    };

    // Seleccionar grupo de edad
    let activities;
    if (ageInMonths <= 3) activities = defaultActivities['0-3'];
    else if (ageInMonths <= 6) activities = defaultActivities['4-6'];
    else activities = defaultActivities['7-12'];

    return {
      activities,
      generalTip: `Para un bebé de ${ageInMonths} meses, es importante mezclar momentos de estimulación con momentos de calma. Observa sus señales de cansancio.`,
      warningIfTired: energyLevel === 'very-low' ? '⚠️ El bebé parece muy cansado. Considera comenzar la rutina de sueño.' : null
    };
  }
}

module.exports = new ActivitiesController();

