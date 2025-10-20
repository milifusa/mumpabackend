// ==========================================
// 📋 ENDPOINTS PARA PERFIL COMPLETO DE HIJOS
// ==========================================

// Este archivo contiene todos los endpoints necesarios para el perfil mejorado de hijos
// Copiar y pegar en server.js antes de la línea final

// ==========================================
// 1. VACUNAS
// ==========================================

// Obtener vacunas de un hijo
app.get('/api/children/:childId/vaccines', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el hijo pertenece al usuario
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este hijo'
      });
    }

    const vaccinesSnapshot = await db.collection('children').doc(childId)
      .collection('vaccines')
      .orderBy('scheduledDate', 'asc')
      .get();

    const vaccines = [];
    vaccinesSnapshot.forEach(doc => {
      vaccines.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: vaccines
    });

  } catch (error) {
    console.error('❌ Error obteniendo vacunas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo vacunas',
      error: error.message
    });
  }
});

// Agregar/actualizar vacuna
app.post('/api/children/:childId/vaccines', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      name, 
      scheduledDate, 
      appliedDate, 
      status, // 'pending', 'applied', 'skipped'
      location,
      batch,
      notes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el hijo pertenece al usuario
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este hijo'
      });
    }

    const vaccineData = {
      name,
      scheduledDate: new Date(scheduledDate),
      appliedDate: appliedDate ? new Date(appliedDate) : null,
      status: status || 'pending',
      location: location || '',
      batch: batch || '',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const vaccineRef = await db.collection('children').doc(childId)
      .collection('vaccines')
      .add(vaccineData);

    res.json({
      success: true,
      message: 'Vacuna registrada exitosamente',
      data: {
        id: vaccineRef.id,
        ...vaccineData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando vacuna:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando vacuna',
      error: error.message
    });
  }
});

// ==========================================
// 2. CITAS MÉDICAS
// ==========================================

// Obtener citas médicas
app.get('/api/children/:childId/appointments', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar permisos
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este hijo'
      });
    }

    const appointmentsSnapshot = await db.collection('children').doc(childId)
      .collection('appointments')
      .orderBy('date', 'desc')
      .get();

    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('❌ Error obteniendo citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo citas',
      error: error.message
    });
  }
});

// Agregar cita médica
app.post('/api/children/:childId/appointments', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      type, // 'checkup', 'specialist', 'emergency', 'vaccine'
      date,
      doctor,
      location,
      reason,
      notes,
      status // 'scheduled', 'completed', 'cancelled'
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar permisos
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este hijo'
      });
    }

    const appointmentData = {
      type: type || 'checkup',
      date: new Date(date),
      doctor: doctor || '',
      location: location || '',
      reason: reason || '',
      notes: notes || '',
      status: status || 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const appointmentRef = await db.collection('children').doc(childId)
      .collection('appointments')
      .add(appointmentData);

    res.json({
      success: true,
      message: 'Cita registrada exitosamente',
      data: {
        id: appointmentRef.id,
        ...appointmentData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando cita',
      error: error.message
    });
  }
});

// ==========================================
// 3. MEDICAMENTOS
// ==========================================

// Obtener medicamentos
app.get('/api/children/:childId/medications', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const medicationsSnapshot = await db.collection('children').doc(childId)
      .collection('medications')
      .orderBy('startDate', 'desc')
      .get();

    const medications = [];
    medicationsSnapshot.forEach(doc => {
      medications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: medications
    });

  } catch (error) {
    console.error('❌ Error obteniendo medicamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo medicamentos',
      error: error.message
    });
  }
});

// Agregar medicamento
app.post('/api/children/:childId/medications', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      name,
      dosage,
      frequency,
      startDate,
      endDate,
      reason,
      prescribedBy,
      notes,
      status // 'active', 'completed', 'discontinued'
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const medicationData = {
      name,
      dosage,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      reason: reason || '',
      prescribedBy: prescribedBy || '',
      notes: notes || '',
      status: status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const medicationRef = await db.collection('children').doc(childId)
      .collection('medications')
      .add(medicationData);

    res.json({
      success: true,
      message: 'Medicamento registrado exitosamente',
      data: {
        id: medicationRef.id,
        ...medicationData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando medicamento',
      error: error.message
    });
  }
});

// ==========================================
// 4. ALERGIAS (actualizar hijo con campo allergies)
// ==========================================

// Actualizar alergias del hijo
app.put('/api/children/:childId/allergies', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { allergies } = req.body; // array de strings

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId).update({
      allergies: allergies || [],
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Alergias actualizadas exitosamente',
      data: {
        allergies
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando alergias:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando alergias',
      error: error.message
    });
  }
});

// ==========================================
// 5. HISTORIAL MÉDICO
// ==========================================

// Obtener historial médico
app.get('/api/children/:childId/medical-history', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const historySnapshot = await db.collection('children').doc(childId)
      .collection('medical_history')
      .orderBy('date', 'desc')
      .get();

    const history = [];
    historySnapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial médico',
      error: error.message
    });
  }
});

// Agregar entrada al historial médico
app.post('/api/children/:childId/medical-history', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      type, // 'diagnosis', 'treatment', 'surgery', 'hospitalization', 'other'
      date,
      title,
      description,
      doctor,
      location,
      attachments // URLs de documentos/imágenes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const historyData = {
      type: type || 'other',
      date: new Date(date),
      title,
      description: description || '',
      doctor: doctor || '',
      location: location || '',
      attachments: attachments || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const historyRef = await db.collection('children').doc(childId)
      .collection('medical_history')
      .add(historyData);

    res.json({
      success: true,
      message: 'Historial médico actualizado exitosamente',
      data: {
        id: historyRef.id,
        ...historyData
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando historial médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando historial médico',
      error: error.message
    });
  }
});

// ==========================================
// 6. MEDICIONES (Peso, Altura, Perímetro Cefálico)
// ==========================================

// Obtener mediciones
app.get('/api/children/:childId/measurements', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const measurementsSnapshot = await db.collection('children').doc(childId)
      .collection('measurements')
      .orderBy('date', 'desc')
      .get();

    const measurements = [];
    measurementsSnapshot.forEach(doc => {
      measurements.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: measurements
    });

  } catch (error) {
    console.error('❌ Error obteniendo mediciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mediciones',
      error: error.message
    });
  }
});

// Agregar medición
app.post('/api/children/:childId/measurements', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      date,
      weight, // en kg
      height, // en cm
      headCircumference, // en cm
      notes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const measurementData = {
      date: new Date(date),
      weight: weight || null,
      height: height || null,
      headCircumference: headCircumference || null,
      notes: notes || '',
      createdAt: new Date()
    };

    const measurementRef = await db.collection('children').doc(childId)
      .collection('measurements')
      .add(measurementData);

    res.json({
      success: true,
      message: 'Medición registrada exitosamente',
      data: {
        id: measurementRef.id,
        ...measurementData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando medición:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando medición',
      error: error.message
    });
  }
});

// ==========================================
// 7. SEGUIMIENTO DE SUEÑO
// ==========================================

// Obtener registros de sueño
app.get('/api/children/:childId/sleep-tracking', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    let query = db.collection('children').doc(childId).collection('sleep_tracking');
    
    if (startDate) {
      query = query.where('date', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('date', '<=', new Date(endDate));
    }

    const sleepSnapshot = await query.orderBy('date', 'desc').get();

    const sleepRecords = [];
    sleepSnapshot.forEach(doc => {
      sleepRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: sleepRecords
    });

  } catch (error) {
    console.error('❌ Error obteniendo registros de sueño:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo registros de sueño',
      error: error.message
    });
  }
});

// Agregar registro de sueño
app.post('/api/children/:childId/sleep-tracking', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      date,
      sleepTime, // hora de dormir
      wakeTime, // hora de despertar
      duration, // duración en minutos
      quality, // 'good', 'fair', 'poor'
      naps, // array de siestas [{time, duration}]
      notes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const sleepData = {
      date: new Date(date),
      sleepTime: sleepTime ? new Date(sleepTime) : null,
      wakeTime: wakeTime ? new Date(wakeTime) : null,
      duration: duration || 0,
      quality: quality || 'fair',
      naps: naps || [],
      notes: notes || '',
      createdAt: new Date()
    };

    const sleepRef = await db.collection('children').doc(childId)
      .collection('sleep_tracking')
      .add(sleepData);

    res.json({
      success: true,
      message: 'Registro de sueño guardado exitosamente',
      data: {
        id: sleepRef.id,
        ...sleepData
      }
    });

  } catch (error) {
    console.error('❌ Error guardando registro de sueño:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando registro de sueño',
      error: error.message
    });
  }
});

// ==========================================
// 8. REGISTRO DE ALIMENTACIÓN
// ==========================================

// Obtener registros de alimentación
app.get('/api/children/:childId/feeding-log', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    let query = db.collection('children').doc(childId).collection('feeding_log');
    
    if (startDate) {
      query = query.where('date', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('date', '<=', new Date(endDate));
    }

    const feedingSnapshot = await query.orderBy('date', 'desc').get();

    const feedingRecords = [];
    feedingSnapshot.forEach(doc => {
      feedingRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: feedingRecords
    });

  } catch (error) {
    console.error('❌ Error obteniendo registros de alimentación:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo registros de alimentación',
      error: error.message
    });
  }
});

// Agregar registro de alimentación
app.post('/api/children/:childId/feeding-log', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      date,
      type, // 'breastfeeding', 'bottle', 'solid', 'water'
      amount, // ml o gramos
      duration, // minutos (para lactancia)
      food, // descripción del alimento
      breast, // 'left', 'right', 'both' (para lactancia)
      notes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const feedingData = {
      date: new Date(date),
      type,
      amount: amount || null,
      duration: duration || null,
      food: food || '',
      breast: breast || null,
      notes: notes || '',
      createdAt: new Date()
    };

    const feedingRef = await db.collection('children').doc(childId)
      .collection('feeding_log')
      .add(feedingData);

    res.json({
      success: true,
      message: 'Registro de alimentación guardado exitosamente',
      data: {
        id: feedingRef.id,
        ...feedingData
      }
    });

  } catch (error) {
    console.error('❌ Error guardando registro de alimentación:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando registro de alimentación',
      error: error.message
    });
  }
});

// ==========================================
// 9. HITOS DEL DESARROLLO
// ==========================================

// Obtener hitos
app.get('/api/children/:childId/milestones', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const milestonesSnapshot = await db.collection('children').doc(childId)
      .collection('milestones')
      .orderBy('date', 'desc')
      .get();

    const milestones = [];
    milestonesSnapshot.forEach(doc => {
      milestones.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: milestones
    });

  } catch (error) {
    console.error('❌ Error obteniendo hitos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo hitos',
      error: error.message
    });
  }
});

// Agregar hito
app.post('/api/children/:childId/milestones', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      type, // 'first_smile', 'first_word', 'first_step', 'first_tooth', 'custom'
      title,
      date,
      description,
      photos, // array de URLs
      celebrationEmoji
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const milestoneData = {
      type,
      title,
      date: new Date(date),
      description: description || '',
      photos: photos || [],
      celebrationEmoji: celebrationEmoji || '🎉',
      createdAt: new Date()
    };

    const milestoneRef = await db.collection('children').doc(childId)
      .collection('milestones')
      .add(milestoneData);

    res.json({
      success: true,
      message: 'Hito registrado exitosamente',
      data: {
        id: milestoneRef.id,
        ...milestoneData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando hito',
      error: error.message
    });
  }
});

// ==========================================
// 10. DIARIO DEL BEBÉ
// ==========================================

// Obtener entradas del diario
app.get('/api/children/:childId/diary', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const diarySnapshot = await db.collection('children').doc(childId)
      .collection('diary')
      .orderBy('date', 'desc')
      .limit(50)
      .get();

    const diaryEntries = [];
    diarySnapshot.forEach(doc => {
      diaryEntries.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: diaryEntries
    });

  } catch (error) {
    console.error('❌ Error obteniendo diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo diario',
      error: error.message
    });
  }
});

// Agregar entrada al diario
app.post('/api/children/:childId/diary', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      date,
      title,
      content,
      mood, // 'happy', 'sad', 'neutral', 'excited'
      photos,
      tags
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const diaryData = {
      date: new Date(date),
      title: title || '',
      content,
      mood: mood || 'neutral',
      photos: photos || [],
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const diaryRef = await db.collection('children').doc(childId)
      .collection('diary')
      .add(diaryData);

    res.json({
      success: true,
      message: 'Entrada del diario guardada exitosamente',
      data: {
        id: diaryRef.id,
        ...diaryData
      }
    });

  } catch (error) {
    console.error('❌ Error guardando entrada del diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando entrada del diario',
      error: error.message
    });
  }
});

// ==========================================
// 11. ÁLBUMES DE FOTOS
// ==========================================

// Obtener álbumes
app.get('/api/children/:childId/albums', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const albumsSnapshot = await db.collection('children').doc(childId)
      .collection('albums')
      .orderBy('createdAt', 'desc')
      .get();

    const albums = [];
    albumsSnapshot.forEach(doc => {
      albums.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: albums
    });

  } catch (error) {
    console.error('❌ Error obteniendo álbumes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo álbumes',
      error: error.message
    });
  }
});

// Crear álbum
app.post('/api/children/:childId/albums', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      name,
      description,
      coverPhoto,
      photos, // array de {url, caption, date}
      theme // 'birthday', 'first_year', 'vacation', 'custom'
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const albumData = {
      name,
      description: description || '',
      coverPhoto: coverPhoto || '',
      photos: photos || [],
      theme: theme || 'custom',
      photoCount: (photos || []).length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const albumRef = await db.collection('children').doc(childId)
      .collection('albums')
      .add(albumData);

    res.json({
      success: true,
      message: 'Álbum creado exitosamente',
      data: {
        id: albumRef.id,
        ...albumData
      }
    });

  } catch (error) {
    console.error('❌ Error creando álbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando álbum',
      error: error.message
    });
  }
});

// Agregar fotos a un álbum
app.post('/api/children/:childId/albums/:albumId/photos', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, albumId } = req.params;
    const { photos } = req.body; // array de {url, caption, date}

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const albumRef = db.collection('children').doc(childId).collection('albums').doc(albumId);
    const albumDoc = await albumRef.get();

    if (!albumDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado'
      });
    }

    const currentPhotos = albumDoc.data().photos || [];
    const updatedPhotos = [...currentPhotos, ...photos];

    await albumRef.update({
      photos: updatedPhotos,
      photoCount: updatedPhotos.length,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Fotos agregadas al álbum exitosamente',
      data: {
        photoCount: updatedPhotos.length
      }
    });

  } catch (error) {
    console.error('❌ Error agregando fotos al álbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando fotos al álbum',
      error: error.message
    });
  }
});

// ==========================================
// 12. CUIDADORES (Compartir acceso)
// ==========================================

// Obtener cuidadores
app.get('/api/children/:childId/caregivers', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const caregiversSnapshot = await db.collection('children').doc(childId)
      .collection('caregivers')
      .get();

    const caregivers = [];
    caregiversSnapshot.forEach(doc => {
      caregivers.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: caregivers
    });

  } catch (error) {
    console.error('❌ Error obteniendo cuidadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo cuidadores',
      error: error.message
    });
  }
});

// Agregar cuidador
app.post('/api/children/:childId/caregivers', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      email,
      name,
      relationship, // 'father', 'mother', 'grandparent', 'other'
      permissions // {canEdit: bool, canViewMedical: bool, canViewPhotos: bool}
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    // Verificar si el email ya existe como cuidador
    const existingCaregiver = await db.collection('children').doc(childId)
      .collection('caregivers')
      .where('email', '==', email)
      .get();

    if (!existingCaregiver.empty) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado como cuidador'
      });
    }

    const caregiverData = {
      email,
      name: name || '',
      relationship: relationship || 'other',
      permissions: permissions || {
        canEdit: false,
        canViewMedical: true,
        canViewPhotos: true
      },
      status: 'pending', // 'pending', 'active', 'declined'
      invitedAt: new Date(),
      invitedBy: uid
    };

    const caregiverRef = await db.collection('children').doc(childId)
      .collection('caregivers')
      .add(caregiverData);

    res.json({
      success: true,
      message: 'Cuidador invitado exitosamente',
      data: {
        id: caregiverRef.id,
        ...caregiverData
      }
    });

  } catch (error) {
    console.error('❌ Error agregando cuidador:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando cuidador',
      error: error.message
    });
  }
});

// ==========================================
// 13. EXPORTAR A PDF
// ==========================================

// Exportar información completa del hijo a PDF
app.get('/api/children/:childId/export-pdf', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const childData = childDoc.data();

    // Recopilar toda la información
    const vaccinesSnapshot = await db.collection('children').doc(childId).collection('vaccines').get();
    const appointmentsSnapshot = await db.collection('children').doc(childId).collection('appointments').get();
    const milestonesSnapshot = await db.collection('children').doc(childId).collection('milestones').get();
    const measurementsSnapshot = await db.collection('children').doc(childId).collection('measurements').get();

    const exportData = {
      child: {
        name: childData.name,
        birthDate: childData.birthDate,
        ageInMonths: childData.currentAgeInMonths,
        allergies: childData.allergies || []
      },
      vaccines: [],
      appointments: [],
      milestones: [],
      measurements: []
    };

    vaccinesSnapshot.forEach(doc => exportData.vaccines.push(doc.data()));
    appointmentsSnapshot.forEach(doc => exportData.appointments.push(doc.data()));
    milestonesSnapshot.forEach(doc => exportData.milestones.push(doc.data()));
    measurementsSnapshot.forEach(doc => exportData.measurements.push(doc.data()));

    // Por ahora devolver JSON (puedes integrar una librería de PDF como PDFKit o Puppeteer)
    res.json({
      success: true,
      message: 'Datos recopilados para exportar',
      data: exportData,
      note: 'Integrar librería de PDF para generar documento descargable'
    });

  } catch (error) {
    console.error('❌ Error exportando datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando datos',
      error: error.message
    });
  }
});

// ==========================================
// FIN DE ENDPOINTS DE PERFIL DE HIJOS
// ==========================================

