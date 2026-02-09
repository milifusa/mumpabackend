// ============================================================================
// EMAIL SERVICE - Resend Integration
// ============================================================================
// Servicio centralizado para envío de emails usando Resend
// Incluye todos los templates y eventos de email de Munpa

const { Resend } = require('resend');

// Inicializar Resend con API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuración
// NOTA: Para producción, asegúrate de verificar el dominio munpa.app en Resend
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Munpa <no-reply@munpa.app>';
const COMPANY_NAME = 'Munpa';
const APP_URL = 'https://munpa.app';

// ============================================================================
// TEMPLATES DE EMAIL
// ============================================================================

/**
 * Template base para todos los emails
 */
const emailTemplate = (content, preheader = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
    }
    h1 {
      color: #333;
      font-size: 24px;
      margin-top: 0;
    }
    p {
      margin: 16px 0;
    }
    .preheader {
      display: none;
      font-size: 1px;
      color: #fefefe;
      line-height: 1px;
      max-height: 0px;
      max-width: 0px;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="container">
    <div class="header">
      <h1 class="logo">Munpa 💜</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Este email fue enviado por ${COMPANY_NAME}</p>
      <p>Si no deseas recibir estos emails, puedes <a href="${APP_URL}/settings/notifications">gestionar tus preferencias</a></p>
      <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

// ============================================================================
// 1. EMAILS DE BIENVENIDA Y REGISTRO
// ============================================================================

/**
 * Email de bienvenida al registrarse
 */
const welcomeEmail = (userName, userEmail) => {
  const content = `
    <h1>¡Bienvenida a Munpa, ${userName}! 🎉</h1>
    <p>Estamos muy felices de que te unas a nuestra comunidad de mamás.</p>
    <p>Munpa es tu compañera en esta hermosa aventura de la maternidad. Aquí podrás:</p>
    <ul>
      <li>📅 Seguir el desarrollo de tu bebé con hitos personalizados</li>
      <li>👥 Conectar con otras mamás en comunidades</li>
      <li>🛍️ Comprar, vender e intercambiar productos para bebés</li>
      <li>🎉 Participar en eventos locales</li>
      <li>💡 Obtener recomendaciones de lugares baby-friendly</li>
    </ul>
    <p>Para comenzar, te recomendamos:</p>
    <ol>
      <li>Agregar los datos de tu bebé</li>
      <li>Unirte a una comunidad</li>
      <li>Explorar el marketplace</li>
    </ol>
    <a href="${APP_URL}" class="button">Comenzar ahora</a>
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    <p>Con cariño,<br>El equipo de Munpa 💜</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `¡Bienvenida a Munpa, ${userName}! 🎉`,
    html: emailTemplate(content, 'Bienvenida a la comunidad de mamás Munpa'),
  };
};

/**
 * Email de bienvenida después de agregar primer hijo
 */
const firstChildAddedEmail = (userName, userEmail, childName, childAge) => {
  const content = `
    <h1>¡Perfil completado! 🎈</h1>
    <p>Hola ${userName},</p>
    <p>Nos encanta conocer a ${childName}. Ahora tu experiencia en Munpa será 100% personalizada.</p>
    <p>Con base en la edad de ${childName} (${childAge}), hemos preparado:</p>
    <ul>
      <li>🎯 Hitos de desarrollo apropiados para su edad</li>
      <li>🍎 Recetas de nutrición personalizadas</li>
      <li>💉 Calendario de vacunas</li>
      <li>📚 Contenido relevante en las comunidades</li>
    </ul>
    <a href="${APP_URL}/children/${childName}" class="button">Ver perfil de ${childName}</a>
    <p>¡Disfruta explorando todo lo que Munpa tiene para ti y ${childName}!</p>
    <p>Con cariño,<br>El equipo de Munpa 💜</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `¡Perfil completado! Conoce a ${childName} 🎈`,
    html: emailTemplate(content, `Tu perfil y el de ${childName} están listos`),
  };
};

// ============================================================================
// 2. EMAILS DE EVENTOS
// ============================================================================

/**
 * Confirmación de asistencia a evento
 */
const eventConfirmationEmail = (userName, userEmail, eventData) => {
  const eventDate = new Date(eventData.eventDate._seconds * 1000);
  const dateStr = eventDate.toLocaleDateString('es-EC', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const content = `
    <h1>¡Confirmado! ✅</h1>
    <p>Hola ${userName},</p>
    <p>Tu asistencia al evento <strong>${eventData.title}</strong> ha sido confirmada.</p>
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">📅 ${eventData.title}</h3>
      <p><strong>Fecha:</strong> ${dateStr}</p>
      <p><strong>Lugar:</strong> ${eventData.location.name}</p>
      <p><strong>Dirección:</strong> ${eventData.location.address}</p>
      ${eventData.checkInCode ? `<p><strong>Código de Check-in:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px;">${eventData.checkInCode}</code></p>` : ''}
    </div>
    <p>${eventData.description}</p>
    <a href="${APP_URL}/events/${eventData.id}" class="button">Ver detalles del evento</a>
    <p>Te enviaremos un recordatorio 24 horas antes del evento.</p>
    <p>¡Nos vemos allí! 🎉<br>El equipo de Munpa</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `Confirmado: ${eventData.title} 🎉`,
    html: emailTemplate(content, `Tu asistencia a ${eventData.title} está confirmada`),
  };
};

/**
 * Recordatorio de evento (24h antes)
 */
const eventReminderEmail = (userName, userEmail, eventData) => {
  const eventDate = new Date(eventData.eventDate._seconds * 1000);
  const dateStr = eventDate.toLocaleDateString('es-EC', { 
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  const content = `
    <h1>¡Mañana es el día! ⏰</h1>
    <p>Hola ${userName},</p>
    <p>Este es un recordatorio de que mañana asistirás a:</p>
    <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0;">📅 ${eventData.title}</h3>
      <p><strong>Cuándo:</strong> ${dateStr}</p>
      <p><strong>Dónde:</strong> ${eventData.location.name}<br>
      ${eventData.location.address}</p>
    </div>
    ${eventData.checkInCode ? `
    <p>💡 <strong>Tip:</strong> Al llegar, usa el código <code style="background: #667eea; color: white; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${eventData.checkInCode}</code> para hacer check-in rápido.</p>
    ` : ''}
    <a href="${APP_URL}/events/${eventData.id}" class="button">Ver detalles</a>
    <a href="${APP_URL}/events/${eventData.id}/calendar/google" style="display: inline-block; margin-left: 10px; padding: 14px 28px; background: #fff; color: #667eea !important; text-decoration: none; border-radius: 8px; font-weight: 600; border: 2px solid #667eea;">Agregar a Calendario</a>
    <p>¡Nos vemos mañana! 🎉<br>El equipo de Munpa</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `Mañana: ${eventData.title} ⏰`,
    html: emailTemplate(content, `Recordatorio de ${eventData.title}`),
  };
};

/**
 * Evento cancelado
 */
const eventCancelledEmail = (userName, userEmail, eventData, reason = null) => {
  const content = `
    <h1>Evento Cancelado ❌</h1>
    <p>Hola ${userName},</p>
    <p>Lamentamos informarte que el evento <strong>${eventData.title}</strong> ha sido cancelado.</p>
    ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
    <p>Sentimos las molestias que esto pueda ocasionar. Te invitamos a explorar otros eventos que podrían interesarte.</p>
    <a href="${APP_URL}/events" class="button">Ver otros eventos</a>
    <p>Gracias por tu comprensión,<br>El equipo de Munpa</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `Evento Cancelado: ${eventData.title}`,
    html: emailTemplate(content, `${eventData.title} ha sido cancelado`),
  };
};

// ============================================================================
// 3. EMAILS DE CUMPLEAÑOS
// ============================================================================

/**
 * Email de cumpleaños del hijo (día del cumpleaños)
 */
const childBirthdayEmail = (userName, userEmail, childName, age) => {
  const content = `
    <h1>¡Feliz Cumpleaños a ${childName}! 🎂🎉</h1>
    <p>Querida ${userName},</p>
    <p>¡Hoy ${childName} cumple ${age} ${age === 1 ? 'añito' : 'años'}! 🎈</p>
    <p>Desde Munpa queremos celebrar este día tan especial contigo. Es increíble ver cómo ${childName} ha crecido.</p>
    <div style="text-align: center; padding: 30px 0;">
      <div style="font-size: 60px;">🎂</div>
      <h2 style="color: #667eea;">¡Feliz Cumpleaños ${childName}!</h2>
    </div>
    <p>Te deseamos un día lleno de alegría, amor y momentos inolvidables.</p>
    <p>💜 Como regalo, te hemos preparado:</p>
    <ul>
      <li>🎯 Nuevos hitos de desarrollo para su edad</li>
      <li>🍎 Recetas especiales para ${age} ${age === 1 ? 'año' : 'años'}</li>
      <li>🎁 Descuentos especiales en productos del marketplace</li>
    </ul>
    <a href="${APP_URL}/children" class="button">Ver sorpresa de cumpleaños</a>
    <p>¡Que disfruten este hermoso día!</p>
    <p>Con mucho cariño,<br>El equipo de Munpa 💜</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `¡Feliz Cumpleaños a ${childName}! 🎂🎉`,
    html: emailTemplate(content, `Hoy ${childName} cumple ${age} ${age === 1 ? 'añito' : 'años'}`),
  };
};

/**
 * Email recordatorio de cumpleaños (día antes)
 */
const childBirthdayReminderEmail = (userName, userEmail, childName, age) => {
  const content = `
    <h1>¡Mañana es el cumpleaños de ${childName}! 🎈</h1>
    <p>Hola ${userName},</p>
    <p>Solo queríamos recordarte que mañana ${childName} cumple ${age} ${age === 1 ? 'añito' : 'años'}! 🎂</p>
    <p>¿Ya tienes todo listo para celebrar? Aquí algunas ideas:</p>
    <ul>
      <li>🎉 Revisa eventos de cumpleaños en tu área</li>
      <li>🎁 Encuentra el regalo perfecto en nuestro marketplace</li>
      <li>📸 Prepara tu cámara para capturar momentos especiales</li>
      <li>🍰 Descubre recetas de pasteles fáciles</li>
    </ul>
    <a href="${APP_URL}/events?category=cumpleanos" class="button">Ver ideas para el cumpleaños</a>
    <p>¡Que sea un día inolvidable!</p>
    <p>Con cariño,<br>El equipo de Munpa 💜</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `¡Mañana es el cumpleaños de ${childName}! 🎈`,
    html: emailTemplate(content, `El cumpleaños de ${childName} es mañana`),
  };
};

// ============================================================================
// 4. EMAILS DE HITOS Y DESARROLLO
// ============================================================================

/**
 * Resumen semanal de hitos
 */
const weeklyMilestonesEmail = (userName, userEmail, childName, completedMilestones, suggestedMilestones) => {
  const completedList = completedMilestones.map(m => 
    `<li>✅ ${m.description} (${m.categoryName})</li>`
  ).join('');
  
  const suggestedList = suggestedMilestones.slice(0, 5).map(m => 
    `<li>🎯 ${m.description} (${m.categoryName})</li>`
  ).join('');

  const content = `
    <h1>Resumen Semanal de ${childName} 📊</h1>
    <p>Hola ${userName},</p>
    <p>¡Qué semana increíble! Aquí está el progreso de ${childName}:</p>
    
    <h3>✨ Hitos Completados esta Semana</h3>
    ${completedMilestones.length > 0 ? `
      <ul style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
        ${completedList}
      </ul>
    ` : '<p>No se completaron hitos esta semana, pero cada día es un logro 💪</p>'}
    
    <h3>🎯 Hitos Sugeridos para esta Semana</h3>
    ${suggestedMilestones.length > 0 ? `
      <ul style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        ${suggestedList}
      </ul>
    ` : ''}
    
    <a href="${APP_URL}/children/${childName}/milestones" class="button">Ver todos los hitos</a>
    <p>Recuerda: cada niño se desarrolla a su propio ritmo. ¡Celebra cada pequeño logro! 🌟</p>
    <p>Con cariño,<br>El equipo de Munpa</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `Resumen Semanal de ${childName} 📊`,
    html: emailTemplate(content, `Progreso de ${childName} esta semana`),
  };
};

// ============================================================================
// 5. EMAILS DE MARKETPLACE
// ============================================================================

/**
 * Email cuando se vende un producto
 */
const productSoldEmail = (sellerName, sellerEmail, productName, buyerName) => {
  const content = `
    <h1>¡Tu producto se vendió! 🎉</h1>
    <p>Hola ${sellerName},</p>
    <p>Tenemos excelentes noticias: <strong>${productName}</strong> ha sido vendido.</p>
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0;">💰 Detalles de la venta</h3>
      <p><strong>Producto:</strong> ${productName}</p>
      <p><strong>Comprador:</strong> ${buyerName}</p>
    </div>
    <p>Los próximos pasos:</p>
    <ol>
      <li>El comprador te contactará para coordinar la entrega</li>
      <li>Verifica que toda la información esté correcta</li>
      <li>Confirma la transacción una vez completada</li>
    </ol>
    <a href="${APP_URL}/marketplace/sales" class="button">Ver detalles</a>
    <p>¡Gracias por ser parte de nuestra comunidad!</p>
    <p>El equipo de Munpa 🛍️</p>
  `;
  
  return {
    to: sellerEmail,
    from: FROM_EMAIL,
    subject: `¡Vendiste ${productName}! 🎉`,
    html: emailTemplate(content, `Tu producto ${productName} se vendió`),
  };
};

// ============================================================================
// 6. EMAILS DE ENGAGEMENT
// ============================================================================

/**
 * Resumen semanal de actividad
 */
const weeklyDigestEmail = (userName, userEmail, digestData) => {
  const { topPosts, upcomingEvents, newProducts, communityStats } = digestData;
  
  const postsHtml = topPosts.map(post => `
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <h4 style="margin: 0 0 10px 0;">${post.content.substring(0, 100)}...</h4>
      <p style="margin: 0; color: #666; font-size: 14px;">
        ❤️ ${post.likeCount} likes · 💬 ${post.commentCount} comentarios
      </p>
    </div>
  `).join('');

  const content = `
    <h1>Tu Resumen Semanal en Munpa 📰</h1>
    <p>Hola ${userName},</p>
    <p>Esto es lo que pasó esta semana mientras estuviste ocupada:</p>
    
    <h3>🔥 Posts Más Populares</h3>
    ${postsHtml}
    
    ${upcomingEvents.length > 0 ? `
      <h3>📅 Próximos Eventos</h3>
      <p>No te pierdas estos eventos esta semana:</p>
      <ul>
        ${upcomingEvents.map(e => `<li>${e.title} - ${new Date(e.date).toLocaleDateString('es-EC')}</li>`).join('')}
      </ul>
    ` : ''}
    
    ${communityStats ? `
      <h3>👥 Tu Comunidad</h3>
      <p>
        • ${communityStats.newMembers} nuevos miembros<br>
        • ${communityStats.newPosts} posts nuevos<br>
        • ${communityStats.activeDiscussions} discusiones activas
      </p>
    ` : ''}
    
    <a href="${APP_URL}" class="button">Ver más en Munpa</a>
    <p>¡No te pierdas lo que viene!</p>
    <p>Con cariño,<br>El equipo de Munpa 💜</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `Tu resumen semanal en Munpa 📰`,
    html: emailTemplate(content, 'Lo mejor de esta semana en Munpa'),
  };
};

// ============================================================================
// FUNCIONES DE ENVÍO
// ============================================================================

/**
 * Función principal para enviar emails
 */
const sendEmail = async (emailData) => {
  try {
    console.log(`📧 [EMAIL] Enviando: ${emailData.subject} a ${emailData.to}`);
    
    const result = await resend.emails.send(emailData);
    
    console.log(`✅ [EMAIL] Enviado exitosamente: ${result.id}`);
    return { success: true, id: result.id };
    
  } catch (error) {
    console.error('❌ [EMAIL] Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar email de bienvenida
 */
const sendWelcomeEmail = async (userName, userEmail) => {
  const emailData = welcomeEmail(userName, userEmail);
  return await sendEmail(emailData);
};

/**
 * Enviar email de primer hijo agregado
 */
const sendFirstChildEmail = async (userName, userEmail, childName, childAge) => {
  const emailData = firstChildAddedEmail(userName, userEmail, childName, childAge);
  return await sendEmail(emailData);
};

/**
 * Enviar confirmación de evento
 */
const sendEventConfirmation = async (userName, userEmail, eventData) => {
  const emailData = eventConfirmationEmail(userName, userEmail, eventData);
  return await sendEmail(emailData);
};

/**
 * Enviar recordatorio de evento
 */
const sendEventReminder = async (userName, userEmail, eventData) => {
  const emailData = eventReminderEmail(userName, userEmail, eventData);
  return await sendEmail(emailData);
};

/**
 * Enviar notificación de evento cancelado
 */
const sendEventCancelled = async (userName, userEmail, eventData, reason = null) => {
  const emailData = eventCancelledEmail(userName, userEmail, eventData, reason);
  return await sendEmail(emailData);
};

/**
 * Enviar email de cumpleaños
 */
const sendBirthdayEmail = async (userName, userEmail, childName, age) => {
  const emailData = childBirthdayEmail(userName, userEmail, childName, age);
  return await sendEmail(emailData);
};

/**
 * Enviar recordatorio de cumpleaños
 */
const sendBirthdayReminder = async (userName, userEmail, childName, age) => {
  const emailData = childBirthdayReminderEmail(userName, userEmail, childName, age);
  return await sendEmail(emailData);
};

/**
 * Enviar resumen semanal de hitos
 */
const sendWeeklyMilestones = async (userName, userEmail, childName, completed, suggested) => {
  const emailData = weeklyMilestonesEmail(userName, userEmail, childName, completed, suggested);
  return await sendEmail(emailData);
};

/**
 * Enviar notificación de producto vendido
 */
const sendProductSold = async (sellerName, sellerEmail, productName, buyerName) => {
  const emailData = productSoldEmail(sellerName, sellerEmail, productName, buyerName);
  return await sendEmail(emailData);
};

/**
 * Enviar resumen semanal
 */
const sendWeeklyDigest = async (userName, userEmail, digestData) => {
  const emailData = weeklyDigestEmail(userName, userEmail, digestData);
  return await sendEmail(emailData);
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Funciones de envío
  sendWelcomeEmail,
  sendFirstChildEmail,
  sendEventConfirmation,
  sendEventReminder,
  sendEventCancelled,
  sendBirthdayEmail,
  sendBirthdayReminder,
  sendWeeklyMilestones,
  sendProductSold,
  sendWeeklyDigest,
  
  // Función genérica
  sendEmail,
  
  // Constantes
  FROM_EMAIL,
  APP_URL,
};
