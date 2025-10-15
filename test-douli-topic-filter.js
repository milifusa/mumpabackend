// Script para probar el filtro de temas fuera del ámbito de Douli
// Este script valida que Douli rechace preguntas fuera de su especialidad

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
  
  // Palabras clave fuera del ámbito de doula
  const offTopicKeywords = [
    'taco', 'tacos', 'pizza', 'hamburguesa', 'burrito', 'torta', 'pastel', 'postre',
    'programación', 'programacion', 'código', 'codigo', 'javascript', 'python', 'html', 'css', 'desarrollo web', 'app', 'software',
    'finanzas', 'dinero', 'inversión', 'inversion', 'banco', 'crédito', 'credito', 'préstamo', 'prestamo', 'economía', 'economia',
    'derecho', 'ley', 'legal', 'abogado', 'contrato', 'trámite', 'tramite', 'notario',
    'tecnología', 'tecnologia', 'computadora', 'celular', 'smartphone', 'internet', 'redes sociales', 'facebook', 'instagram',
    'cocina', 'cocinar', 'chef', 'restaurante', 'menú', 'menu',
    'deportes', 'fútbol', 'futbol', 'basketball', 'basquetbol', 'gimnasio', 'musculación', 'musculacion',
    'política', 'politica', 'elecciones', 'gobierno', 'presidente', 'partido político', 'partido politico',
    'viajes', 'turismo', 'hotel', 'avión', 'avion', 'vacaciones', 'playa', 'crucero',
    'automóvil', 'automovil', 'carro', 'coche', 'auto', 'mecánico', 'mecanico',
    'música', 'musica', 'canción', 'cancion', 'concierto', 'festival',
    'película', 'pelicula', 'serie', 'netflix', 'cine', 'actor', 'actriz',
    'videojuegos', 'gaming', 'consola', 'playstation', 'xbox', 'nintendo'
  ];
  
  // Verificar si contiene palabras claramente fuera de tema
  const hasOffTopicKeyword = offTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Verificar si contiene palabras relacionadas con el tema
  const hasOnTopicKeyword = onTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Es relevante si:
  // 1. NO tiene palabras fuera de tema, O
  // 2. Tiene palabras relacionadas con el tema (prioridad)
  return !hasOffTopicKeyword || hasOnTopicKeyword;
};

// Casos de prueba
const testCases = [
  // Preguntas válidas (dentro del ámbito)
  { message: '¿Qué síntomas son normales en el primer trimestre?', shouldPass: true },
  { message: 'Mi bebé tiene 3 meses y no duerme bien', shouldPass: true },
  { message: '¿Cómo puedo mejorar mi lactancia?', shouldPass: true },
  { message: 'Tengo 20 semanas de embarazo y me duele la espalda', shouldPass: true },
  { message: '¿Qué cuidados necesita un recién nacido?', shouldPass: true },
  { message: '¿Es normal sentir ansiedad en el posparto?', shouldPass: true },
  { message: 'Mi hijo tiene 6 meses, ¿cuándo empiezo con alimentación complementaria?', shouldPass: true },
  
  // Preguntas inválidas (fuera del ámbito)
  { message: '¿Cómo hago tacos al pastor?', shouldPass: false },
  { message: '¿Dónde puedo comprar tacos en mi ciudad?', shouldPass: false },
  { message: '¿Cuál es la mejor receta de pizza?', shouldPass: false },
  { message: '¿Cómo programo en JavaScript?', shouldPass: false },
  { message: '¿Qué banco me da mejor crédito?', shouldPass: false },
  { message: '¿Cuál es el mejor hotel en Cancún?', shouldPass: false },
  { message: '¿Quién ganó el partido de fútbol?', shouldPass: false },
  { message: '¿Qué película me recomiendas en Netflix?', shouldPass: false },
  { message: '¿Cómo arreglo mi carro?', shouldPass: false },
  
  // Preguntas ambiguas o límite
  { message: '¿Qué comida es buena para el embarazo?', shouldPass: true }, // Relacionado con embarazo
  { message: '¿Puedo comer tacos durante el embarazo?', shouldPass: true }, // Relacionado con embarazo, aunque mencione tacos
  { message: '¿Qué ejercicios puedo hacer estando embarazada?', shouldPass: true },
];

console.log('🧪 PRUEBA DEL FILTRO DE TEMAS DE DOULI\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = isRelevantToDoulaScope(testCase.message);
  const expectedResult = testCase.shouldPass;
  const success = result === expectedResult;
  
  if (success) {
    passed++;
    console.log(`\n✅ Test ${index + 1}: PASÓ`);
  } else {
    failed++;
    console.log(`\n❌ Test ${index + 1}: FALLÓ`);
  }
  
  console.log(`   Mensaje: "${testCase.message}"`);
  console.log(`   Esperado: ${expectedResult ? 'PERMITIR' : 'RECHAZAR'}`);
  console.log(`   Resultado: ${result ? 'PERMITIR' : 'RECHAZAR'}`);
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 RESULTADOS FINALES:`);
console.log(`   ✅ Pruebas pasadas: ${passed}/${testCases.length}`);
console.log(`   ❌ Pruebas fallidas: ${failed}/${testCases.length}`);
console.log(`   📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(2)}%\n`);

if (failed === 0) {
  console.log('🎉 ¡Todos los tests pasaron exitosamente!');
  console.log('✨ El filtro de temas está funcionando correctamente.\n');
} else {
  console.log('⚠️  Algunos tests fallaron. Revisa la lógica del filtro.\n');
}

