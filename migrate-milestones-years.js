const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./mumpabackend-firebase-adminsdk-fbsvc-0c400d3af7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Datos de hitos 1-18 años
const milestonesData = {
  "milestones_1_18_years": [
    {"age": 1, "social": ["Juega de forma paralela", "Busca cercanía del cuidador", "Imita acciones simples", "Muestra afecto"], "cognitivo": ["Reconoce objetos comunes", "Explora causa y efecto", "Sigue instrucciones simples", "Identifica rutinas"], "motriz": ["Camina de forma independiente", "Se agacha y levanta", "Empuja objetos", "Usa pinza fina básica"], "comunicacion": ["Dice varias palabras", "Comprende órdenes simples", "Usa gestos para comunicarse", "Imita sonidos"]},
    {"age": 2, "social": ["Imita a otros niños", "Empieza a compartir", "Muestra independencia", "Expresa emociones básicas"], "cognitivo": ["Clasifica objetos simples", "Reconoce colores básicos", "Resuelve problemas sencillos", "Identifica partes del cuerpo"], "motriz": ["Corre con mayor estabilidad", "Sube escaleras con ayuda", "Lanza una pelota", "Usa utensilios simples"], "comunicacion": ["Forma frases de dos palabras", "Nombra objetos familiares", "Comprende preguntas simples", "Señala para pedir"]},
    {"age": 3, "social": ["Participa en juegos imaginativos", "Sigue reglas simples", "Busca amigos", "Expresa empatía inicial"], "cognitivo": ["Comprende conceptos básicos", "Recuerda secuencias cortas", "Sigue instrucciones de dos pasos", "Reconoce formas"], "motriz": ["Salta con ambos pies", "Pedalea triciclo", "Dibuja líneas", "Se viste con ayuda"], "comunicacion": ["Habla en frases completas", "Hace preguntas", "Cuenta experiencias simples", "Pronuncia con mayor claridad"]},
    {"age": 4, "social": ["Coopera en juegos", "Respeta turnos", "Hace amigos", "Comprende emociones ajenas"], "cognitivo": ["Comprende el tiempo básico", "Reconoce números y letras", "Resuelve problemas simples", "Clasifica por categorías"], "motriz": ["Salta en un pie", "Atrapa una pelota", "Dibuja figuras simples", "Se viste casi solo"], "comunicacion": ["Cuenta historias simples", "Explica ideas", "Usa vocabulario variado", "Comprende conversaciones"]},
    {"age": 5, "social": ["Forma amistades estables", "Sigue normas sociales", "Trabaja en grupo", "Muestra autonomía social"], "cognitivo": ["Reconoce números y letras", "Comprende secuencias", "Resuelve problemas básicos", "Memoriza información simple"], "motriz": ["Mejora coordinación general", "Escribe algunas letras", "Dibuja figuras complejas", "Controla movimientos finos"], "comunicacion": ["Se expresa con claridad", "Hace preguntas complejas", "Comprende historias", "Expresa emociones verbalmente"]},
    {"age": 6, "social": ["Respeta reglas", "Fortalece amistades", "Muestra responsabilidad", "Colabora en equipo"], "cognitivo": ["Lee palabras simples", "Comprende conceptos matemáticos básicos", "Sigue instrucciones complejas", "Planifica tareas simples"], "motriz": ["Mejora escritura", "Corre y salta con control", "Practica deportes básicos", "Refina motricidad fina"], "comunicacion": ["Mantiene conversaciones", "Expresa ideas con orden", "Comprende textos simples", "Escucha activamente"]},
    {"age": 7, "social": ["Comprende reglas sociales", "Desarrolla empatía", "Participa en equipo", "Resuelve conflictos simples"], "cognitivo": ["Pensamiento lógico básico", "Comprende causa y efecto", "Organiza información", "Resuelve problemas escolares"], "motriz": ["Mayor coordinación", "Escribe con fluidez", "Practica deportes", "Mejora equilibrio"], "comunicacion": ["Explica ideas con claridad", "Comprende textos", "Hace preguntas reflexivas", "Usa vocabulario amplio"]},
    {"age": 8, "social": ["Fortalece amistades", "Comprende normas sociales", "Trabaja en grupo", "Muestra liderazgo inicial"], "cognitivo": ["Resuelve problemas complejos", "Comprende conceptos abstractos iniciales", "Planifica actividades", "Memoriza información"], "motriz": ["Control corporal avanzado", "Mejora escritura", "Practica deportes organizados", "Coordinación fina precisa"], "comunicacion": ["Expresa ideas complejas", "Argumenta opiniones", "Comprende textos largos", "Participa en debates"]},
    {"age": 9, "social": ["Comprende puntos de vista ajenos", "Fortalece relaciones", "Sigue reglas grupales", "Resuelve conflictos"], "cognitivo": ["Pensamiento lógico avanzado", "Resuelve problemas académicos", "Comprende conceptos abstractos", "Planifica a corto plazo"], "motriz": ["Mayor fuerza y resistencia", "Control corporal", "Destrezas deportivas", "Precisión motriz fina"], "comunicacion": ["Expresión verbal clara", "Comprensión lectora avanzada", "Comunica ideas con orden", "Escucha activamente"]},
    {"age": 10, "social": ["Mayor independencia social", "Sentido de pertenencia", "Respeto por normas", "Trabajo colaborativo"], "cognitivo": ["Pensamiento crítico inicial", "Organiza información", "Resuelve problemas complejos", "Planifica tareas"], "motriz": ["Coordinación madura", "Habilidades deportivas", "Resistencia física", "Precisión manual"], "comunicacion": ["Argumenta ideas", "Comprende textos complejos", "Expresión emocional verbal", "Comunicación clara"]},
    {"age": 11, "social": ["Busca identidad grupal", "Fortalece amistades", "Empatía desarrollada", "Responsabilidad social"], "cognitivo": ["Pensamiento abstracto inicial", "Análisis de situaciones", "Planificación básica", "Comprensión crítica"], "motriz": ["Cambios corporales iniciales", "Control motor avanzado", "Fuerza creciente", "Resistencia física"], "comunicacion": ["Comunicación reflexiva", "Expresa opiniones", "Comprende textos abstractos", "Participa en debates"]},
    {"age": 12, "social": ["Búsqueda de identidad", "Mayor influencia de pares", "Independencia emocional", "Relaciones más profundas"], "cognitivo": ["Pensamiento crítico", "Razonamiento abstracto", "Planificación a mediano plazo", "Toma de decisiones"], "motriz": ["Cambios puberales", "Mayor fuerza", "Coordinación corporal", "Resistencia física"], "comunicacion": ["Expresión emocional compleja", "Argumentación", "Comunicación social madura", "Comprensión profunda"]},
    {"age": 13, "social": ["Consolidación de identidad", "Relaciones cercanas", "Autonomía social", "Empatía avanzada"], "cognitivo": ["Pensamiento abstracto consolidado", "Análisis crítico", "Planificación a largo plazo", "Resolución compleja de problemas"], "motriz": ["Fuerza y resistencia", "Control corporal", "Cambios físicos avanzados", "Habilidades deportivas"], "comunicacion": ["Comunicación madura", "Expresión emocional clara", "Debate reflexivo", "Comprensión social"]},
    {"age": 14, "social": ["Relaciones profundas", "Identidad social definida", "Autonomía creciente", "Responsabilidad social"], "cognitivo": ["Pensamiento crítico avanzado", "Toma de decisiones complejas", "Planificación estratégica", "Análisis profundo"], "motriz": ["Coordinación adulta", "Fuerza física", "Resistencia", "Control motor fino"], "comunicacion": ["Comunicación argumentativa", "Expresión clara de ideas", "Comprensión abstracta", "Diálogo reflexivo"]},
    {"age": 15, "social": ["Autonomía social", "Relaciones estables", "Empatía madura", "Responsabilidad personal"], "cognitivo": ["Pensamiento crítico sólido", "Planificación a largo plazo", "Resolución compleja de problemas", "Toma de decisiones consciente"], "motriz": ["Fuerza y coordinación", "Resistencia física", "Habilidades deportivas avanzadas", "Control corporal pleno"], "comunicacion": ["Comunicación asertiva", "Argumentación lógica", "Expresión emocional equilibrada", "Comprensión profunda"]},
    {"age": 16, "social": ["Independencia social", "Identidad consolidada", "Relaciones maduras", "Responsabilidad social"], "cognitivo": ["Pensamiento abstracto avanzado", "Análisis crítico profundo", "Planificación a largo plazo", "Decisiones responsables"], "motriz": ["Coordinación adulta", "Fuerza física óptima", "Resistencia", "Control corporal total"], "comunicacion": ["Comunicación madura", "Expresión clara y reflexiva", "Diálogo complejo", "Escucha activa"]},
    {"age": 17, "social": ["Autonomía plena", "Relaciones estables", "Empatía adulta", "Responsabilidad social"], "cognitivo": ["Pensamiento crítico avanzado", "Toma de decisiones complejas", "Planificación de vida", "Análisis profundo"], "motriz": ["Plena coordinación", "Fuerza y resistencia", "Control motor completo", "Capacidad física adulta"], "comunicacion": ["Comunicación adulta", "Argumentación sólida", "Expresión emocional madura", "Comprensión social avanzada"]},
    {"age": 18, "social": ["Autonomía social completa", "Identidad consolidada", "Relaciones maduras", "Responsabilidad social adulta"], "cognitivo": ["Pensamiento crítico adulto", "Toma de decisiones responsables", "Planificación a largo plazo", "Análisis complejo"], "motriz": ["Desarrollo físico adulto", "Coordinación plena", "Resistencia y fuerza", "Control corporal total"], "comunicacion": ["Comunicación efectiva adulta", "Expresión clara de ideas", "Argumentación madura", "Comprensión profunda del entorno"]}
  ]
};

// Mapeo de categorías
const categoryMapping = {
  'social': 'fQaVcHEBHwDYnyLtYsYO',
  'cognitivo': 'Z8lzzytnEN99AzEn6Si9',
  'motriz': 'IllBvxKzqNSINPVYYwXI',
  'comunicacion': 'ztdwfgdKJfxTOySUeVBr'
};

async function migrateMilestonesYears() {
  try {
    console.log('🚀 Iniciando carga de hitos 1-18 años...\n');

    let createdCount = 0;
    let errorCount = 0;

    // Procesar cada año
    for (const yearData of milestonesData.milestones_1_18_years) {
      const { age, social, cognitivo, motriz, comunicacion } = yearData;
      
      console.log(`📅 Procesando edad ${age} años...`);
      
      const allCategories = {
        social,
        cognitivo,
        motriz,
        comunicacion
      };

      // Por cada categoría en el año
      for (const [categoryKey, items] of Object.entries(allCategories)) {
        if (!items || !Array.isArray(items)) continue;

        const categoryId = categoryMapping[categoryKey];
        if (!categoryId) {
          console.warn(`⚠️  Categoría no mapeada: ${categoryKey}`);
          continue;
        }

        // Por cada hito en la categoría
        for (let i = 0; i < items.length; i++) {
          const title = items[i];
          
          try {
            const ageInMonths = age * 12;
            
            const milestoneData = {
              title: title.trim(),
              description: `Hito del desarrollo para los ${age} años`,
              categoryId,
              ageMonthsMin: ageInMonths,
              ageMonthsMax: ageInMonths + 11, // Todo el año
              order: i + 1,
              isActive: true,
              tips: '',
              videoUrl: null,
              imageUrl: null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: 'migration_script'
            };

            await db.collection('milestones').add(milestoneData);
            
            createdCount++;
            console.log(`   ✅ ${title}`);

          } catch (error) {
            errorCount++;
            console.error(`   ❌ Error: ${title} - ${error.message}`);
          }
        }
      }
      
      console.log(`   ✓ Edad ${age} años completada\n`);
    }

    console.log('\n🎉 ¡Migración completada!');
    console.log(`✅ Hitos creados: ${createdCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateMilestonesYears();
