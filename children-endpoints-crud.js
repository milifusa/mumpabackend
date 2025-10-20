// ==========================================
// 📝 ENDPOINTS CRUD ADICIONALES
// ==========================================
// PUT (actualizar) y DELETE (eliminar) para todos los recursos

// ==========================================
// 1. VACUNAS - UPDATE & DELETE
// ==========================================

// Actualizar vacuna
app.put('/api/children/:childId/vaccines/:vaccineId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, vaccineId } = req.params;
    const { 
      name, 
      scheduledDate, 
      appliedDate, 
      status,
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

    // Verificar permisos
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate);
    if (appliedDate !== undefined) updateData.appliedDate = appliedDate ? new Date(appliedDate) : null;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (batch !== undefined) updateData.batch = batch;
    if (notes !== undefined) updateData.notes = notes;

    await db.collection('children').doc(childId)
      .collection('vaccines').doc(vaccineId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Vacuna actualizada exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando vacuna:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando vacuna',
      error: error.message
    });
  }
});

// Eliminar vacuna
app.delete('/api/children/:childId/vaccines/:vaccineId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, vaccineId } = req.params;

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

    await db.collection('children').doc(childId)
      .collection('vaccines').doc(vaccineId)
      .delete();

    res.json({
      success: true,
      message: 'Vacuna eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando vacuna:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando vacuna',
      error: error.message
    });
  }
});

// ==========================================
// 2. CITAS MÉDICAS - UPDATE & DELETE
// ==========================================

// Actualizar cita médica
app.put('/api/children/:childId/appointments/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, appointmentId } = req.params;
    const { type, date, doctor, location, reason, notes, status } = req.body;

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

    const updateData = { updatedAt: new Date() };
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);
    if (doctor !== undefined) updateData.doctor = doctor;
    if (location !== undefined) updateData.location = location;
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    await db.collection('children').doc(childId)
      .collection('appointments').doc(appointmentId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando cita',
      error: error.message
    });
  }
});

// Eliminar cita médica
app.delete('/api/children/:childId/appointments/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, appointmentId } = req.params;

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

    await db.collection('children').doc(childId)
      .collection('appointments').doc(appointmentId)
      .delete();

    res.json({
      success: true,
      message: 'Cita eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando cita',
      error: error.message
    });
  }
});

// ==========================================
// 3. MEDICAMENTOS - UPDATE & DELETE
// ==========================================

// Actualizar medicamento
app.put('/api/children/:childId/medications/:medicationId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, medicationId } = req.params;
    const { name, dosage, frequency, startDate, endDate, reason, prescribedBy, notes, status } = req.body;

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

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (dosage !== undefined) updateData.dosage = dosage;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (reason !== undefined) updateData.reason = reason;
    if (prescribedBy !== undefined) updateData.prescribedBy = prescribedBy;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    await db.collection('children').doc(childId)
      .collection('medications').doc(medicationId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Medicamento actualizado exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando medicamento',
      error: error.message
    });
  }
});

// Eliminar medicamento
app.delete('/api/children/:childId/medications/:medicationId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, medicationId } = req.params;

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

    await db.collection('children').doc(childId)
      .collection('medications').doc(medicationId)
      .delete();

    res.json({
      success: true,
      message: 'Medicamento eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando medicamento',
      error: error.message
    });
  }
});

// ==========================================
// 4. HISTORIAL MÉDICO - UPDATE & DELETE
// ==========================================

// Actualizar historial médico
app.put('/api/children/:childId/medical-history/:historyId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, historyId } = req.params;
    const { type, date, title, description, doctor, location, attachments } = req.body;

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

    const updateData = { updatedAt: new Date() };
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (doctor !== undefined) updateData.doctor = doctor;
    if (location !== undefined) updateData.location = location;
    if (attachments !== undefined) updateData.attachments = attachments;

    await db.collection('children').doc(childId)
      .collection('medical_history').doc(historyId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Historial médico actualizado exitosamente',
      data: updateData
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

// Eliminar historial médico
app.delete('/api/children/:childId/medical-history/:historyId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, historyId } = req.params;

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

    await db.collection('children').doc(childId)
      .collection('medical_history').doc(historyId)
      .delete();

    res.json({
      success: true,
      message: 'Historial médico eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando historial médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando historial médico',
      error: error.message
    });
  }
});

// ==========================================
// 5. MEDICIONES - UPDATE & DELETE
// ==========================================

// Actualizar medición
app.put('/api/children/:childId/measurements/:measurementId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, measurementId } = req.params;
    const { date, weight, height, headCircumference, notes } = req.body;

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

    const updateData = {};
    if (date !== undefined) updateData.date = new Date(date);
    if (weight !== undefined) updateData.weight = weight;
    if (height !== undefined) updateData.height = height;
    if (headCircumference !== undefined) updateData.headCircumference = headCircumference;
    if (notes !== undefined) updateData.notes = notes;

    await db.collection('children').doc(childId)
      .collection('measurements').doc(measurementId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Medición actualizada exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando medición:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando medición',
      error: error.message
    });
  }
});

// Eliminar medición
app.delete('/api/children/:childId/measurements/:measurementId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, measurementId } = req.params;

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

    await db.collection('children').doc(childId)
      .collection('measurements').doc(measurementId)
      .delete();

    res.json({
      success: true,
      message: 'Medición eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando medición:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando medición',
      error: error.message
    });
  }
});

// ==========================================
// 6. HITOS - UPDATE & DELETE
// ==========================================

// Actualizar hito
app.put('/api/children/:childId/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, milestoneId } = req.params;
    const { type, title, date, description, photos, celebrationEmoji } = req.body;

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

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (photos !== undefined) updateData.photos = photos;
    if (celebrationEmoji !== undefined) updateData.celebrationEmoji = celebrationEmoji;

    await db.collection('children').doc(childId)
      .collection('milestones').doc(milestoneId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Hito actualizado exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando hito',
      error: error.message
    });
  }
});

// Eliminar hito
app.delete('/api/children/:childId/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, milestoneId } = req.params;

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

    await db.collection('children').doc(childId)
      .collection('milestones').doc(milestoneId)
      .delete();

    res.json({
      success: true,
      message: 'Hito eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando hito',
      error: error.message
    });
  }
});

// ==========================================
// 7. DIARIO - UPDATE & DELETE
// ==========================================

// Actualizar entrada del diario
app.put('/api/children/:childId/diary/:diaryId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, diaryId } = req.params;
    const { date, title, content, mood, photos, tags } = req.body;

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

    const updateData = { updatedAt: new Date() };
    if (date !== undefined) updateData.date = new Date(date);
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (mood !== undefined) updateData.mood = mood;
    if (photos !== undefined) updateData.photos = photos;
    if (tags !== undefined) updateData.tags = tags;

    await db.collection('children').doc(childId)
      .collection('diary').doc(diaryId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Entrada del diario actualizada exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando entrada del diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando entrada del diario',
      error: error.message
    });
  }
});

// Eliminar entrada del diario
app.delete('/api/children/:childId/diary/:diaryId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, diaryId } = req.params;

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

    await db.collection('children').doc(childId)
      .collection('diary').doc(diaryId)
      .delete();

    res.json({
      success: true,
      message: 'Entrada del diario eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando entrada del diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando entrada del diario',
      error: error.message
    });
  }
});

// ==========================================
// 8. ÁLBUMES - UPDATE & DELETE
// ==========================================

// Actualizar álbum
app.put('/api/children/:childId/albums/:albumId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, albumId } = req.params;
    const { name, description, coverPhoto, theme } = req.body;

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

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (coverPhoto !== undefined) updateData.coverPhoto = coverPhoto;
    if (theme !== undefined) updateData.theme = theme;

    await db.collection('children').doc(childId)
      .collection('albums').doc(albumId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Álbum actualizado exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando álbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando álbum',
      error: error.message
    });
  }
});

// Eliminar álbum
app.delete('/api/children/:childId/albums/:albumId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, albumId } = req.params;

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

    await db.collection('children').doc(childId)
      .collection('albums').doc(albumId)
      .delete();

    res.json({
      success: true,
      message: 'Álbum eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando álbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando álbum',
      error: error.message
    });
  }
});

// ==========================================
// FIN DE ENDPOINTS CRUD ADICIONALES
// ==========================================

