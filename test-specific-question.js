// Probar la pregunta específica que está fallando

// Función para validar si un mensaje es relevante al tema de doula
const isRelevantToDoulaScope = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Palabras clave relacionadas con el ámbito de doula (embarazo, parto, crianza)
  const onTopicKeywords = [
    'embarazo', 'embarazada', 'gestación', 'bebé', 'bebe', 'hijo', 'hija', 'niño', 'niña',
    'parto', 'dar a luz', 'contracciones', 'posparto', 'postparto', 'recuperación',
    'lactancia', 'amamantar', 'leche materna', 'pecho', 'teta',
    'recién nacido', 'recien nacido', 'neonato', 'cuidados',
    'trimestre', 'semana', 'mes', 'desarrollo', 'crecimiento',
    'pañal', 'panal', 'baño', 'sueño', 'dormir', 'alimentación', 'alimentacion',
    'maternidad', 'paternidad', 'crianza', 'familia',
    'síntoma', 'sintoma', 'dolor', 'malestar', 'náusea', 'nausea', 'vómito', 'vomito',
    'vitamina', 'ácido fólico', 'acido folico', 'hierro', 'calcio',
    'ecografía', 'ecografia', 'ultrasonido', 'ginecólogo', 'ginecologo', 'obstetra', 'matrona',
    'cesárea', 'cesarea', 'parto natural', 'epidural',
    'depresión posparto', 'depresion posparto', 'ansiedad', 'estrés', 'estres',
    'cordón umbilical', 'cordon umbilical', 'placenta', 'útero', 'utero',
    'movimientos fetales', 'patadas', 'feto', 'embrión', 'embrion'
  ];
  
  // Palabras clave ALTAMENTE prohibidas (siempre rechazar, incluso si menciona embarazo)
  const strictlyOffTopicKeywords = [
    'taco', 'tacos', 'pizza', 'hamburguesa', 'burrito', 'enchilada', 'quesadilla',
    'programación', 'programacion', 'código', 'codigo', 'javascript', 'python', 'html', 'css', 'desarrollo web', 'software',
    'fútbol', 'futbol', 'basketball', 'basquetbol', 'partido de', 'equipo deportivo',
    'película', 'pelicula', 'serie', 'netflix', 'cine', 'actor', 'actriz',
    'videojuegos', 'gaming', 'consola', 'playstation', 'xbox', 'nintendo',
    'automóvil', 'automovil', 'carro', 'coche', 'auto mecánica', 'mecánico automotriz', 'arreglo carro'
  ];
  
  // Palabras clave fuera del ámbito (rechazar solo si NO hay palabras de embarazo)
  const generalOffTopicKeywords = [
    'finanzas', 'dinero', 'inversión', 'inversion', 'banco', 'crédito', 'credito', 'préstamo', 'prestamo', 'economía', 'economia',
    'derecho', 'ley', 'legal', 'abogado', 'contrato', 'trámite', 'tramite', 'notario',
    'tecnología', 'tecnologia', 'computadora', 'smartphone', 'internet', 'redes sociales', 'facebook', 'instagram',
    'cocina general', 'cocinar', 'chef', 'restaurante', 'menú restaurante', 'menu restaurante',
    'gimnasio', 'musculación', 'musculacion', 'pesas', 'entrenamiento deportivo',
    'política', 'politica', 'elecciones', 'gobierno', 'presidente', 'partido político', 'partido politico',
    'viajes', 'turismo', 'hotel', 'avión', 'avion', 'crucero',
    'música concierto', 'musica concierto', 'festival musical'
  ];
  
  // Patrones de preguntas claramente sobre comida no relacionada con embarazo
  const foodPatterns = [
    /receta de (taco|pizza|hamburguesa|pasta|postre|pastel|torta)/i,
    /cómo (hacer|preparar|cocinar) (taco|pizza|hamburguesa|pasta)/i,
    /como (hacer|preparar|cocinar) (taco|pizza|hamburguesa|pasta)/i,
    /ingredientes (para|de) (taco|pizza|hamburguesa|pasta)/i,
    /(dónde|donde) (comprar|comer|encontrar) (taco|pizza|hamburguesa)/i
  ];
  
  // Verificar patrones de comida prohibidos
  const matchesFoodPattern = foodPatterns.some(pattern => pattern.test(message));
  
  // Verificar palabras estrictamente prohibidas
  const hasStrictlyOffTopicKeyword = strictlyOffTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Verificar palabras generalmente fuera de tema
  const hasGeneralOffTopicKeyword = generalOffTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Verificar si contiene palabras relacionadas con el tema
  const hasOnTopicKeyword = onTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Debug
  console.log('\n🔍 ANÁLISIS DEL MENSAJE:');
  console.log('Mensaje:', message);
  console.log('Mensaje en minúsculas:', lowerMessage);
  console.log('Coincide con patrón de comida?', matchesFoodPattern);
  console.log('Tiene palabra estrictamente prohibida?', hasStrictlyOffTopicKeyword);
  console.log('Tiene palabra generalmente fuera de tema?', hasGeneralOffTopicKeyword);
  console.log('Tiene palabra relacionada con embarazo?', hasOnTopicKeyword);
  
  // Lógica de validación:
  // 1. Si coincide con patrones de comida prohibidos -> RECHAZAR
  // 2. Si tiene palabras estrictamente prohibidas -> RECHAZAR siempre
  // 3. Si tiene palabras generalmente fuera de tema Y NO tiene palabras de embarazo -> RECHAZAR
  // 4. De lo contrario -> PERMITIR
  
  if (matchesFoodPattern) {
    console.log('❌ RESULTADO: RECHAZAR (patrón de comida)');
    return false; // Rechazar recetas de comida
  }
  
  if (hasStrictlyOffTopicKeyword) {
    console.log('❌ RESULTADO: RECHAZAR (palabra estrictamente prohibida)');
    return false; // Rechazar temas estrictamente prohibidos
  }
  
  if (hasGeneralOffTopicKeyword && !hasOnTopicKeyword) {
    console.log('❌ RESULTADO: RECHAZAR (tema general fuera de ámbito)');
    return false; // Rechazar temas generales fuera del ámbito si no menciona embarazo
  }
  
  console.log('✅ RESULTADO: PERMITIR');
  return true; // Permitir el resto
};

// Probar la pregunta exacta de la imagen
const testQuestions = [
  "Tienes una receta de tacos ?",
  "Tienes una receta de tacos?",
  "tienes una receta de tacos",
  "¿Tienes una receta de tacos?",
  "Hola tienes una receta de tacos",
];

console.log('═'.repeat(80));
console.log('🧪 PRUEBA DE PREGUNTAS ESPECÍFICAS SOBRE TACOS');
console.log('═'.repeat(80));

testQuestions.forEach((question, index) => {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`TEST ${index + 1}:`);
  const result = isRelevantToDoulaScope(question);
  console.log(`\n📊 RESULTADO FINAL: ${result ? '✅ PERMITIDO (MAL)' : '❌ RECHAZADO (BIEN)'}`);
});

console.log('\n' + '═'.repeat(80));

