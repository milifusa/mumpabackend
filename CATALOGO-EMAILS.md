# 📧 Catálogo Completo de Emails - Munpa

## ✅ Emails Ya Implementados

### 1. Onboarding y Perfil (4 emails)
- ✅ **Bienvenida al registrarse** - Cuando crea cuenta
- ✅ **Primer hijo agregado** - Al agregar su primer hijo
- ✅ **Hijo adicional agregado** - Al agregar 2do, 3er hijo, etc
- ✅ **Felicitación por embarazo** - Cuando agrega un bebé por nacer

### 2. Eventos de Comunidad (3 emails)
- ✅ **Confirmación de asistencia** - Al confirmar asistencia a evento
- ✅ **Recordatorio 24h antes** - Recordatorio automático (cron)
- ✅ **Evento cancelado** - Cuando admin cancela el evento

### 3. Cumpleaños (2 emails)
- ✅ **Día del cumpleaños** - Email especial el día del cumpleaños
- ✅ **Recordatorio día antes** - Recordatorio 24h antes

### 4. Desarrollo y Engagement (3 emails)
- ✅ **Resumen semanal de hitos** - Progreso del hijo
- ✅ **Producto vendido** - En marketplace
- ✅ **Resumen semanal** - Digest de actividad

**Total implementados: 12 templates**

---

## 🚀 Opciones de Emails Adicionales

### A. Hitos de Desarrollo (5 nuevos emails)

#### 1. **Nuevo Hito Sugerido** 🎯
**Trigger**: Cuando un hijo alcanza la edad para un nuevo hito
**Frecuencia**: Automático (cron semanal)
**Contenido**:
- "¡${childName} ya tiene ${age}! Estos son los nuevos hitos que puede alcanzar"
- Lista de 3-5 hitos sugeridos
- Link a la sección de hitos

#### 2. **Hito Completado - Felicitación** ⭐
**Trigger**: Cuando un padre marca un hito como completado
**Frecuencia**: Inmediato
**Contenido**:
- "¡Felicidades! ${childName} alcanzó un nuevo hito: ${milestone}"
- Gif celebratorio
- Siguiente hito sugerido

#### 3. **Recordatorio de Hitos Pendientes** 📊
**Trigger**: Hitos no completados después de 2 semanas
**Frecuencia**: Cada 2 semanas
**Contenido**:
- "Aún hay hitos pendientes para ${childName}"
- Lista de hitos por completar
- Tip: "Cada niño se desarrolla a su ritmo"

#### 4. **Reporte Mensual de Progreso** 📈
**Trigger**: Automático cada mes
**Frecuencia**: Mensual (cron)
**Contenido**:
- Resumen del mes: X hitos completados
- Gráfico de progreso por categoría
- Comparación con mes anterior

#### 5. **Alerta de Retraso en Hitos** ⚠️
**Trigger**: Hitos críticos no alcanzados después de edad límite
**Frecuencia**: Automático (cron)
**Contenido**:
- Aviso amable de hitos importantes pendientes
- Sugerencia de consultar pediatra
- Link a recursos

---

### B. Salud y Bienestar (7 nuevos emails)

#### 6. **Próxima Vacuna** 💉
**Trigger**: 1 semana antes de fecha de vacuna
**Frecuencia**: Automático
**Contenido**:
- Recordatorio de vacuna próxima
- Preparativos recomendados
- Link para marcar como aplicada

#### 7. **Vacuna Vencida** 📅
**Trigger**: Vacuna no aplicada después de fecha
**Frecuencia**: 1 semana después
**Contenido**:
- Recordatorio amable
- Importancia de la vacuna
- Link para reprogramar

#### 8. **Recordatorio de Cita Médica** 🏥
**Trigger**: 24h antes de cita
**Frecuencia**: Automático
**Contenido**:
- Detalles de la cita
- Documentos a llevar
- Botón para cancelar/reprogramar

#### 9. **Medicamento Próximo** 💊
**Trigger**: Ya implementado como push, convertir a email
**Frecuencia**: Según horario
**Contenido**:
- Recordatorio de medicamento
- Dosis
- Última vez que se tomó

#### 10. **Resumen Semanal de Salud** 📋
**Trigger**: Todos los domingos
**Frecuencia**: Semanal (cron)
**Contenido**:
- Medicamentos tomados
- Citas de la semana
- Próximas vacunas
- Mediciones de crecimiento

#### 11. **Nuevo Peso/Altura Registrado** 📏
**Trigger**: Al agregar medición
**Frecuencia**: Inmediato
**Contenido**:
- Gráfico de crecimiento
- Percentiles
- Comparación con mes anterior

#### 12. **Control de Crecimiento Mensual** 📊
**Trigger**: Cada mes si no se ha registrado medición
**Frecuencia**: Mensual
**Contenido**:
- "Es momento de medir a ${childName}"
- Tips para medir correctamente
- Link rápido

---

### C. Nutrición (5 nuevos emails)

#### 13. **Nuevas Recetas Disponibles** 🍎
**Trigger**: Al cambiar edad del hijo (nuevas recetas aplicables)
**Frecuencia**: Automático
**Contenido**:
- "Nuevas recetas para ${childName} (${age})"
- 3 recetas destacadas
- Link a ver todas

#### 14. **Receta de la Semana** 🥗
**Trigger**: Todos los lunes
**Frecuencia**: Semanal (cron)
**Contenido**:
- Receta completa adaptada a edad
- Ingredientes
- Preparación paso a paso
- Valor nutricional

#### 15. **Tips de Alimentación por Edad** 🍼
**Trigger**: Al cumplir X meses (6, 12, 18, 24)
**Frecuencia**: Según edad
**Contenido**:
- Cambios en la alimentación
- Nuevos alimentos a introducir
- Alimentos a evitar

#### 16. **Recordatorio de Hidratación** 💧
**Trigger**: Verano o días calurosos
**Frecuencia**: Estacional
**Contenido**:
- Importancia de hidratación
- Cantidad recomendada por edad
- Tips refrescantes

#### 17. **Planificador de Menú Semanal** 📅
**Trigger**: Todos los domingos
**Frecuencia**: Semanal (cron)
**Contenido**:
- Menú sugerido para la semana
- Lista de compras
- Recetas rápidas

---

### D. Marketplace (6 nuevos emails)

#### 18. **Producto Vendido** 💰
**Trigger**: Ya implementado
**Frecuencia**: Inmediato

#### 19. **Nueva Pregunta sobre tu Producto** 💬
**Trigger**: Alguien pregunta por tu producto
**Frecuencia**: Inmediato
**Contenido**:
- "${userName} preguntó por ${productName}"
- Pregunta completa
- Botón para responder

#### 20. **Producto Guardado Tiene Descuento** 🎁
**Trigger**: Producto en wishlist baja de precio
**Frecuencia**: Inmediato
**Contenido**:
- "¡${productName} ahora tiene descuento!"
- Precio anterior vs nuevo
- Link directo

#### 21. **Productos Similares Disponibles** 🔍
**Trigger**: Después de ver/buscar productos
**Frecuencia**: 24h después
**Contenido**:
- "Encontramos productos similares"
- 5-6 productos recomendados
- Basado en búsquedas/vistas

#### 22. **Tu Producto No Se Ha Vendido** 📦
**Trigger**: 30 días sin ventas
**Frecuencia**: Mensual
**Contenido**:
- Tips para vender más rápido
- Sugerencia de ajustar precio
- Mejores fotos

#### 23. **Recordatorio de Producto Guardado** ⭐
**Trigger**: Producto en wishlist por 7 días
**Frecuencia**: Semanal
**Contenido**:
- "¿Aún te interesa ${productName}?"
- Disponibilidad actual
- Otros productos similares

---

### E. Comunidades y Social (8 nuevos emails)

#### 24. **Nueva Respuesta a tu Comentario** 💬
**Trigger**: Alguien responde tu comentario
**Frecuencia**: Inmediato o digest diario
**Contenido**:
- "${userName} respondió tu comentario"
- Contenido de la respuesta
- Link al post

#### 25. **Tu Post Tiene X Likes** ❤️
**Trigger**: Post alcanza hitos (10, 50, 100 likes)
**Frecuencia**: Por hito
**Contenido**:
- "¡Tu post es popular!"
- Estadísticas de engagement
- Comunidad donde más gustó

#### 26. **Nueva Miembro en tu Comunidad** 👥
**Trigger**: Tu comunidad gana nuevo miembro
**Frecuencia**: Digest diario para admins
**Contenido**:
- "X nuevos miembros esta semana"
- Total de miembros
- Actividad de la comunidad

#### 27. **Contenido Popular que te Perdiste** 📰
**Trigger**: Posts populares no vistos
**Frecuencia**: Semanal
**Contenido**:
- Top 3 posts de tus comunidades
- Resumen de cada uno
- Link directo

#### 28. **Invitación a Nueva Comunidad** 💌
**Trigger**: Comunidad relevante creada
**Frecuencia**: Según intereses
**Contenido**:
- "Nueva comunidad: ${communityName}"
- Descripción
- Botón para unirse

#### 29. **Resumen de Actividad en Comunidades** 📊
**Trigger**: Todos los viernes
**Frecuencia**: Semanal
**Contenido**:
- Tu actividad de la semana
- Posts más vistos
- Comunidades más activas

#### 30. **Evento Nuevo en tu Comunidad** 🎉
**Trigger**: Nuevo evento creado
**Frecuencia**: Inmediato
**Contenido**:
- Detalles del evento
- Fecha y lugar
- Botón para confirmar asistencia

#### 31. **Tu Comunidad Está Inactiva** 😴
**Trigger**: Sin posts en 7 días
**Frecuencia**: Semanal
**Contenido**:
- "Tu comunidad ${name} ha estado tranquila"
- Sugerencia de temas
- Botón para crear post

---

### F. Gamification y Motivación (5 nuevos emails)

#### 32. **Nuevo Logro Desbloqueado** 🏆
**Trigger**: Usuario completa objetivo
**Frecuencia**: Inmediato
**Contenido**:
- Badge obtenido
- Qué hiciste para conseguirlo
- Próximo logro

#### 33. **Racha de Actividad** 🔥
**Trigger**: 7 días consecutivos activo
**Frecuencia**: Por racha
**Contenido**:
- "¡${days} días seguidos!"
- Beneficios de la racha
- Motivación para continuar

#### 34. **Casi Completas tu Perfil** ✅
**Trigger**: Perfil al 70-90%
**Frecuencia**: Una vez
**Contenido**:
- "Tu perfil está casi completo"
- Qué falta
- Beneficios de perfil completo

#### 35. **Aniversario en Munpa** 🎂
**Trigger**: 1 año, 2 años, etc
**Frecuencia**: Anual
**Contenido**:
- "¡${years} ${years === 1 ? 'año' : 'años'} juntos!"
- Resumen de tu actividad
- Momentos destacados

#### 36. **Top Usuario del Mes** ⭐
**Trigger**: Entre los más activos
**Frecuencia**: Mensual
**Contenido**:
- Reconocimiento
- Estadísticas personales
- Regalo/descuento

---

### G. Engagement y Retención (6 nuevos emails)

#### 37. **Te Extrañamos** 💜
**Trigger**: 7 días sin abrir la app
**Frecuencia**: Después de inactividad
**Contenido**:
- "Hola ${userName}, ¿cómo están?"
- Novedades que te perdiste
- Link directo a la app

#### 38. **Novedades Mientras Estuviste Fuera** 📱
**Trigger**: Usuario vuelve después de >14 días
**Frecuencia**: Al volver
**Contenido**:
- Resumen de cambios
- Nuevas funciones
- Contenido popular

#### 39. **Completa tu Onboarding** 🚀
**Trigger**: No completó setup inicial
**Frecuencia**: 3 días después de registro
**Contenido**:
- Beneficios de completar
- Pasos pendientes
- Link directo

#### 40. **Explora Nuevas Funciones** ✨
**Trigger**: No ha usado ciertas features
**Frecuencia**: 14 días después
**Contenido**:
- Features que no ha probado
- Cómo usarlas
- Casos de uso

#### 41. **Usuarios Como Tú También...** 👥
**Trigger**: Sugerencias personalizadas
**Frecuencia**: Mensual
**Contenido**:
- "Mamás con hijos de ${age} también..."
- Funciones populares
- Comunidades relevantes

#### 42. **Feedback Request** 💭
**Trigger**: Después de usar feature nueva
**Frecuencia**: Por feature
**Contenido**:
- "¿Qué te pareció ${feature}?"
- Survey corto (1-2 preguntas)
- Link a encuesta

---

### H. Transaccionales Críticos (4 nuevos emails)

#### 43. **Cambio de Contraseña** 🔒
**Trigger**: Usuario solicita cambio
**Frecuencia**: Inmediato
**Contenido**:
- Link de verificación
- Expira en 1 hora
- Si no fuiste tú, alerta

#### 44. **Nuevo Inicio de Sesión** 🔐
**Trigger**: Login desde nuevo dispositivo
**Frecuencia**: Inmediato
**Contenido**:
- Dispositivo y ubicación
- Fecha y hora
- Si no fuiste tú, opciones

#### 45. **Verificación de Email** ✉️
**Trigger**: Al registrarse o cambiar email
**Frecuencia**: Inmediato
**Contenido**:
- Link de verificación
- Código de 6 dígitos
- Expira en 24h

#### 46. **Cuenta Eliminada** 🗑️
**Trigger**: Usuario elimina cuenta
**Frecuencia**: Inmediato
**Contenido**:
- Confirmación de eliminación
- Datos que se borraron
- Opción de recuperar (7 días)

---

### I. Educativos y Tips (5 nuevos emails)

#### 47. **Tip del Día** 💡
**Trigger**: Todos los días
**Frecuencia**: Diario
**Contenido**:
- Tip de maternidad
- Basado en edad del hijo
- Fuente confiable

#### 48. **Artículo de la Semana** 📚
**Trigger**: Todos los lunes
**Frecuencia**: Semanal
**Contenido**:
- Artículo relevante
- Basado en edad/intereses
- Fuente confiable

#### 49. **Webinar o Taller Próximo** 🎓
**Trigger**: Nuevo webinar relevante
**Frecuencia**: Según calendario
**Contenido**:
- Tema del webinar
- Fecha y hora
- Link de registro

#### 50. **Resumen de Expertosía** 👨‍⚕️
**Trigger**: Respuestas de expertos acumuladas
**Frecuencia**: Quincenal
**Contenido**:
- Top preguntas respondidas
- Consejos de expertos
- Link a consultar

#### 51. **Etapa de Desarrollo** 🌱
**Trigger**: Hijo entra en nueva etapa (6m, 1a, 2a, etc)
**Frecuencia**: Por edad
**Contenido**:
- Qué esperar en esta etapa
- Cambios comunes
- Tips y recursos

---

## 📊 Resumen por Prioridad

### ⭐ Alta Prioridad (Implementar Primero)
1. Nueva Pregunta sobre tu Producto (#19)
2. Nueva Respuesta a tu Comentario (#24)
3. Próxima Vacuna (#6)
4. Verificación de Email (#45)
5. Cambio de Contraseña (#43)

### 🔸 Media Prioridad (Implementar Después)
6. Nuevo Hito Sugerido (#1)
7. Hito Completado (#2)
8. Nuevas Recetas Disponibles (#13)
9. Recordatorio de Cita Médica (#8)
10. Te Extrañamos (#37)

### ⚪ Baja Prioridad (Nice to Have)
11. Todo lo demás según necesidad

---

## 💰 Estimación de Volumen de Emails

### Con 1,500 Usuarios Activos:

| Categoría | Emails/mes estimados |
|-----------|---------------------|
| Ya implementados (12) | ~7,500 |
| Alta prioridad (5 nuevos) | ~2,000 |
| Media prioridad (5 nuevos) | ~3,000 |
| Total con prioridades | ~12,500/mes |

**Plan Resend recomendado**: Pro ($20/mes hasta 50k emails)

---

## 🎯 Recomendación

**Implementar ahora:**
1. ✅ Ya implementados (12 emails) - **LISTO**
2. Emails de alta prioridad (#19, #24, #6, #45, #43) - **Siguiente paso**

**Implementar después:**
3. Media prioridad según feedback de usuarios
4. Baja prioridad según métricas de engagement

---

¿Cuáles te gustaría que implementemos a continuación? 🚀
