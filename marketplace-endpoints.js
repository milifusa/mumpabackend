// ============================================================================
// 🛍️ MARKETPLACE ENDPOINTS - CONTINUACIÓN
// Este archivo contiene todos los endpoints del marketplace
// Copiar y pegar en server.js después de la línea 16030
// ============================================================================

// Obtener detalle de un producto específico
app.get('/api/marketplace/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const productDoc = await db.collection('marketplace_products').doc(id).get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data()
    };

    // Incrementar contador de vistas
    await db.collection('marketplace_products').doc(id).update({
      views: admin.firestore.FieldValue.increment(1)
    });

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo producto',
      error: error.message
    });
  }
});

// Crear nuevo producto
app.post('/api/marketplace/products', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const {
      title,
      description,
      category,
      condition,
      photos,
      type,
      price,
      tradeFor,
      location
    } = req.body;

    // Validaciones
    if (!title || title.trim().length < 10 || title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El título debe tener entre 10 y 100 caracteres'
      });
    }

    if (!description || description.trim().length < 20 || description.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'La descripción debe tener entre 20 y 1000 caracteres'
      });
    }

    if (!category || !MARKETPLACE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Categoría inválida'
      });
    }

    if (!condition || !PRODUCT_CONDITIONS.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: 'Condición del producto inválida'
      });
    }

    if (!photos || !Array.isArray(photos) || photos.length === 0 || photos.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir entre 1 y 5 fotos'
      });
    }

    if (!type || !TRANSACTION_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de transacción inválido'
      });
    }

    if (type === 'venta') {
      if (!price || price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio es requerido para ventas y debe ser mayor a 0'
        });
      }
    }

    if (type === 'trueque') {
      if (!tradeFor || tradeFor.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Debes especificar qué buscas a cambio'
        });
      }
    }

    if (!location || !location.state || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'La ubicación es requerida'
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener información del usuario
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Crear producto
    const now = new Date();
    const productData = {
      userId: uid,
      userName: userData?.name || 'Usuario',
      userPhoto: userData?.photoUrl || null,
      
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      photos,
      
      type,
      price: type === 'venta' ? parseFloat(price) : null,
      tradeFor: type === 'trueque' ? tradeFor.trim() : null,
      
      location,
      
      status: 'disponible',
      
      views: 0,
      favorites: 0,
      messages: 0,
      
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      soldAt: null,
      
      isApproved: true,  // Auto-aprobar por ahora
      isReported: false,
      reportCount: 0
    };

    const productRef = await db.collection('marketplace_products').add(productData);

    console.log('✅ [MARKETPLACE] Producto creado:', productRef.id);

    res.json({
      success: true,
      message: 'Producto publicado exitosamente',
      data: {
        id: productRef.id,
        ...productData
      }
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando producto',
      error: error.message
    });
  }
});

// Actualizar producto propio
app.put('/api/marketplace/products/:id', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const {
      title,
      description,
      category,
      condition,
      photos,
      price,
      tradeFor,
      location
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el producto existe y pertenece al usuario
    const productDoc = await db.collection('marketplace_products').doc(id).get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (productDoc.data().userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este producto'
      });
    }

    // Preparar datos de actualización
    const updateData = {
      updatedAt: new Date()
    };

    if (title) {
      if (title.trim().length < 10 || title.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'El título debe tener entre 10 y 100 caracteres'
        });
      }
      updateData.title = title.trim();
    }

    if (description) {
      if (description.trim().length < 20 || description.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'La descripción debe tener entre 20 y 1000 caracteres'
        });
      }
      updateData.description = description.trim();
    }

    if (category) {
      if (!MARKETPLACE_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Categoría inválida'
        });
      }
      updateData.category = category;
    }

    if (condition) {
      if (!PRODUCT_CONDITIONS.includes(condition)) {
        return res.status(400).json({
          success: false,
          message: 'Condición del producto inválida'
        });
      }
      updateData.condition = condition;
    }

    if (photos) {
      if (!Array.isArray(photos) || photos.length === 0 || photos.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Debes tener entre 1 y 5 fotos'
        });
      }
      updateData.photos = photos;
    }

    if (price !== undefined) {
      if (productDoc.data().type === 'venta' && price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio debe ser mayor a 0'
        });
      }
      updateData.price = parseFloat(price);
    }

    if (tradeFor) {
      updateData.tradeFor = tradeFor.trim();
    }

    if (location) {
      updateData.location = location;
    }

    await db.collection('marketplace_products').doc(id).update(updateData);

    console.log('✅ [MARKETPLACE] Producto actualizado:', id);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando producto',
      error: error.message
    });
  }
});

// Eliminar producto propio (soft delete)
app.delete('/api/marketplace/products/:id', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el producto existe y pertenece al usuario
    const productDoc = await db.collection('marketplace_products').doc(id).get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (productDoc.data().userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este producto'
      });
    }

    // Soft delete
    await db.collection('marketplace_products').doc(id).update({
      status: 'eliminado',
      updatedAt: new Date()
    });

    console.log('✅ [MARKETPLACE] Producto eliminado:', id);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando producto',
      error: error.message
    });
  }
});

// Cambiar estado del producto
app.patch('/api/marketplace/products/:id/status', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { status, buyerId, buyerName } = req.body;

    if (!status || !PRODUCT_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const productDoc = await db.collection('marketplace_products').doc(id).get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (productDoc.data().userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de este producto'
      });
    }

    const now = new Date();
    const updateData = {
      status,
      updatedAt: now
    };

    // Si se marca como vendido/donado/intercambiado, guardar fecha y crear transacción
    if (['vendido', 'donado', 'intercambiado'].includes(status)) {
      updateData.soldAt = now;

      // Crear transacción
      const productData = productDoc.data();
      const transactionData = {
        productId: id,
        productTitle: productData.title,
        sellerId: uid,
        sellerName: productData.userName,
        buyerId: buyerId || null,
        buyerName: buyerName || 'No especificado',
        type: productData.type,
        amount: productData.price || 0,
        tradeDetails: productData.tradeFor || null,
        status: 'completada',
        createdAt: now,
        completedAt: now
      };

      await db.collection('marketplace_transactions').add(transactionData);
      console.log('✅ [MARKETPLACE] Transacción creada para producto:', id);
    }

    await db.collection('marketplace_products').doc(id).update(updateData);

    console.log('✅ [MARKETPLACE] Estado actualizado:', id, '->', status);

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando estado',
      error: error.message
    });
  }
});

// Obtener productos propios
app.get('/api/marketplace/my-products', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { status } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    let query = db.collection('marketplace_products')
      .where('userId', '==', uid);

    if (status && PRODUCT_STATUS.includes(status)) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error obteniendo productos propios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo productos',
      error: error.message
    });
  }
});

// ============================================================================
// ⭐ FAVORITOS
// ============================================================================

// Obtener favoritos del usuario
app.get('/api/marketplace/favorites', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const favoritesSnapshot = await db.collection('marketplace_favorites')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const productIds = favoritesSnapshot.docs.map(doc => doc.data().productId);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Obtener productos favoritos
    const productsSnapshot = await db.collection('marketplace_products')
      .where(admin.firestore.FieldPath.documentId(), 'in', productIds.slice(0, 10))
      .get();

    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error obteniendo favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo favoritos',
      error: error.message
    });
  }
});

// Agregar producto a favoritos
app.post('/api/marketplace/favorites/:productId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar si ya está en favoritos
    const existingFavorite = await db.collection('marketplace_favorites')
      .where('userId', '==', uid)
      .where('productId', '==', productId)
      .get();

    if (!existingFavorite.empty) {
      return res.status(400).json({
        success: false,
        message: 'El producto ya está en favoritos'
      });
    }

    // Agregar a favoritos
    await db.collection('marketplace_favorites').add({
      userId: uid,
      productId,
      createdAt: new Date()
    });

    // Incrementar contador en el producto
    await db.collection('marketplace_products').doc(productId).update({
      favorites: admin.firestore.FieldValue.increment(1)
    });

    console.log('✅ [MARKETPLACE] Producto agregado a favoritos:', productId);

    res.json({
      success: true,
      message: 'Producto agregado a favoritos'
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error agregando a favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando a favoritos',
      error: error.message
    });
  }
});

// Quitar producto de favoritos
app.delete('/api/marketplace/favorites/:productId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Buscar y eliminar favorito
    const favoriteSnapshot = await db.collection('marketplace_favorites')
      .where('userId', '==', uid)
      .where('productId', '==', productId)
      .get();

    if (favoriteSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'El producto no está en favoritos'
      });
    }

    // Eliminar todos los documentos encontrados
    const batch = db.batch();
    favoriteSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Decrementar contador en el producto
    await db.collection('marketplace_products').doc(productId).update({
      favorites: admin.firestore.FieldValue.increment(-1)
    });

    console.log('✅ [MARKETPLACE] Producto quitado de favoritos:', productId);

    res.json({
      success: true,
      message: 'Producto quitado de favoritos'
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error quitando de favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error quitando de favoritos',
      error: error.message
    });
  }
});

// ============================================================================
// 💬 MENSAJES
// ============================================================================

// Obtener conversaciones del usuario
app.get('/api/marketplace/messages', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener mensajes donde el usuario es sender o receiver
    const sentMessages = await db.collection('marketplace_messages')
      .where('senderId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const receivedMessages = await db.collection('marketplace_messages')
      .where('receiverId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const allMessages = [
      ...sentMessages.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...receivedMessages.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];

    // Agrupar por producto
    const conversationsByProduct = {};
    allMessages.forEach(msg => {
      if (!conversationsByProduct[msg.productId]) {
        conversationsByProduct[msg.productId] = [];
      }
      conversationsByProduct[msg.productId].push(msg);
    });

    res.json({
      success: true,
      data: conversationsByProduct
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error obteniendo mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mensajes',
      error: error.message
    });
  }
});

// Obtener mensajes de un producto específico
app.get('/api/marketplace/messages/:productId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const messagesSnapshot = await db.collection('marketplace_messages')
      .where('productId', '==', productId)
      .orderBy('createdAt', 'asc')
      .get();

    const messages = messagesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(msg => msg.senderId === uid || msg.receiverId === uid);

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error obteniendo mensajes del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mensajes',
      error: error.message
    });
  }
});

// Enviar mensaje
app.post('/api/marketplace/messages', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId, message } = req.body;

    if (!productId || !message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Producto y mensaje son requeridos'
      });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede exceder 500 caracteres'
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener info del producto y del sender
    const productDoc = await db.collection('marketplace_products').doc(productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const productData = productDoc.data();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Crear mensaje
    const messageData = {
      productId,
      senderId: uid,
      senderName: userData?.name || 'Usuario',
      receiverId: productData.userId,
      receiverName: productData.userName,
      message: message.trim(),
      isRead: false,
      createdAt: new Date()
    };

    const messageRef = await db.collection('marketplace_messages').add(messageData);

    // Incrementar contador de mensajes en el producto
    await db.collection('marketplace_products').doc(productId).update({
      messages: admin.firestore.FieldValue.increment(1)
    });

    console.log('✅ [MARKETPLACE] Mensaje enviado:', messageRef.id);

    res.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: {
        id: messageRef.id,
        ...messageData
      }
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error enviando mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando mensaje',
      error: error.message
    });
  }
});

// Marcar mensaje como leído
app.patch('/api/marketplace/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const messageDoc = await db.collection('marketplace_messages').doc(id).get();

    if (!messageDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }

    // Solo el receptor puede marcar como leído
    if (messageDoc.data().receiverId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para marcar este mensaje'
      });
    }

    await db.collection('marketplace_messages').doc(id).update({
      isRead: true
    });

    res.json({
      success: true,
      message: 'Mensaje marcado como leído'
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error marcando mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando mensaje',
      error: error.message
    });
  }
});

// ============================================================================
// 📊 TRANSACCIONES
// ============================================================================

// Obtener transacciones del usuario
app.get('/api/marketplace/transactions', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener transacciones donde el usuario es vendedor o comprador
    const asSellerSnapshot = await db.collection('marketplace_transactions')
      .where('sellerId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const asBuyerSnapshot = await db.collection('marketplace_transactions')
      .where('buyerId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const transactions = [
      ...asSellerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'vendedor'
      })),
      ...asBuyerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'comprador'
      }))
    ].sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error obteniendo transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transacciones',
      error: error.message
    });
  }
});

// ============================================================================
// 🚨 REPORTES
// ============================================================================

// Reportar un producto
app.post('/api/marketplace/reports', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId, reason, description } = req.body;

    const validReasons = [
      'spam',
      'fraude',
      'contenido_inapropiado',
      'precio_incorrecto',
      'informacion_falsa',
      'otro'
    ];

    if (!productId || !reason || !validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Producto y razón válida son requeridos'
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    const reportData = {
      productId,
      reportedBy: uid,
      reporterName: userData?.name || 'Usuario',
      reason,
      description: description || '',
      status: 'pendiente',
      reviewedBy: null,
      reviewedAt: null,
      actionTaken: null,
      createdAt: new Date()
    };

    const reportRef = await db.collection('marketplace_reports').add(reportData);

    // Incrementar contador de reportes en el producto
    await db.collection('marketplace_products').doc(productId).update({
      reportCount: admin.firestore.FieldValue.increment(1),
      isReported: true
    });

    console.log('✅ [MARKETPLACE] Reporte creado:', reportRef.id);

    res.json({
      success: true,
      message: 'Reporte enviado exitosamente. Lo revisaremos pronto.',
      data: {
        id: reportRef.id,
        ...reportData
      }
    });

  } catch (error) {
    console.error('❌ [MARKETPLACE] Error creando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando reporte',
      error: error.message
    });
  }
});

// ============================================================================
// 🛠️ ENDPOINTS PARA ADMINISTRADOR - MARKETPLACE
// ============================================================================

// Ver todos los productos (incluye eliminados y pendientes)
app.get('/api/admin/marketplace/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, isReported } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    let query = db.collection('marketplace_products');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (isReported === 'true') {
      query = query.where('isReported', '==', true);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo productos',
      error: error.message
    });
  }
});

// Aprobar un producto
app.patch('/api/admin/marketplace/products/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    await db.collection('marketplace_products').doc(id).update({
      isApproved: true,
      updatedAt: new Date()
    });

    console.log('✅ [ADMIN] Producto aprobado:', id);

    res.json({
      success: true,
      message: 'Producto aprobado exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error aprobando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error aprobando producto',
      error: error.message
    });
  }
});

// Rechazar un producto
app.patch('/api/admin/marketplace/products/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    await db.collection('marketplace_products').doc(id).update({
      isApproved: false,
      status: 'eliminado',
      updatedAt: new Date()
    });

    console.log('✅ [ADMIN] Producto rechazado:', id);

    res.json({
      success: true,
      message: 'Producto rechazado exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error rechazando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error rechazando producto',
      error: error.message
    });
  }
});

// Eliminar permanentemente un producto
app.delete('/api/admin/marketplace/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    await db.collection('marketplace_products').doc(id).delete();

    console.log('✅ [ADMIN] Producto eliminado permanentemente:', id);

    res.json({
      success: true,
      message: 'Producto eliminado permanentemente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando producto',
      error: error.message
    });
  }
});

// Ver todos los reportes
app.get('/api/admin/marketplace/reports', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    let query = db.collection('marketplace_reports');

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo reportes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo reportes',
      error: error.message
    });
  }
});

// Revisar y tomar acción sobre un reporte
app.patch('/api/admin/marketplace/reports/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { actionTaken } = req.body;

    if (!actionTaken) {
      return res.status(400).json({
        success: false,
        message: 'Acción tomada es requerida'
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    await db.collection('marketplace_reports').doc(id).update({
      status: 'revisado',
      reviewedBy: req.user.uid,
      reviewedAt: new Date(),
      actionTaken
    });

    console.log('✅ [ADMIN] Reporte revisado:', id);

    res.json({
      success: true,
      message: 'Reporte procesado exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error procesando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando reporte',
      error: error.message
    });
  }
});

// Obtener estadísticas del marketplace
app.get('/api/admin/marketplace/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener todos los productos
    const productsSnapshot = await db.collection('marketplace_products').get();
    const products = productsSnapshot.docs.map(doc => doc.data());

    // Obtener todas las transacciones
    const transactionsSnapshot = await db.collection('marketplace_transactions').get();
    const transactions = transactionsSnapshot.docs.map(doc => doc.data());

    // Calcular estadísticas
    const stats = {
      totalProducts: products.length,
      productsByType: {
        venta: products.filter(p => p.type === 'venta').length,
        donacion: products.filter(p => p.type === 'donacion').length,
        trueque: products.filter(p => p.type === 'trueque').length
      },
      productsByStatus: {
        disponible: products.filter(p => p.status === 'disponible').length,
        vendido: products.filter(p => p.status === 'vendido').length,
        donado: products.filter(p => p.status === 'donado').length,
        intercambiado: products.filter(p => p.status === 'intercambiado').length,
        eliminado: products.filter(p => p.status === 'eliminado').length
      },
      productsByCategory: MARKETPLACE_CATEGORIES.reduce((acc, cat) => {
        acc[cat] = products.filter(p => p.category === cat).length;
        return acc;
      }, {}),
      totalTransactions: transactions.length,
      totalRevenue: transactions
        .filter(t => t.type === 'venta')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      reportedProducts: products.filter(p => p.isReported).length,
      averageViews: products.length > 0 
        ? Math.round(products.reduce((sum, p) => sum + (p.views || 0), 0) / products.length)
        : 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

// Ver todas las transacciones
app.get('/api/admin/marketplace/transactions', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const snapshot = await db.collection('marketplace_transactions')
      .orderBy('createdAt', 'desc')
      .get();

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transacciones',
      error: error.message
    });
  }
});

