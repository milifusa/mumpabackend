/**
 * Herramientas (tools) para el agente IA de administración.
 * Usa count() para estadísticas y limit() para listas - NUNCA consultas abiertas.
 * Filtra datos sensibles antes de devolver a la IA.
 * Puede consultar CUALQUIER colección permitida.
 */

const CAMPOS_SENSIBLES = ['passwordHash', 'password', 'tokens', 'refreshToken', 'customToken'];

const COLECCIONES_PERMITIDAS = [
  'users', 'children', 'communities', 'posts', 'lists', 'recommendations', 'categories',
  'countries', 'cities', 'recommendationReviews', 'banners', 'milestoneCategories', 'milestones',
  'faq_history', 'doula_conversations', 'notifications', 'childInvitations', 'marketplace_products',
  'articles', 'consultations', 'vendor_orders'
];

const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (CAMPOS_SENSIBLES.includes(k)) continue;
    if (v && typeof v.toDate === 'function') out[k] = v.toDate().toISOString();
    else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = sanitize(v);
    else out[k] = v;
  }
  return out;
};

const toolsFactory = (db) => {
  if (!db) return [];

  return [
    {
      type: 'function',
      function: {
        name: 'contar_usuarios',
        description: 'Cuenta el total de usuarios. Usa count() - 1 lectura. Para estadísticas de usuarios totales.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      handler: async () => {
        try {
          const snapshot = await db.collection('users').count().get();
          const d = typeof snapshot.data === 'function' ? snapshot.data() : snapshot.data;
          const count = (d && d.count) ?? 0;
          return { total: count };
        } catch (e) {
          return { error: e.message };
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'contar_usuarias_embarazadas',
        description: 'Cuenta usuarias con isPregnant=true. Usa count(). Para preguntas sobre embarazadas.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      handler: async () => {
        try {
          const snapshot = await db.collection('users').where('isPregnant', '==', true).count().get();
          const d = typeof snapshot.data === 'function' ? snapshot.data() : snapshot.data;
          return { total: (d && d.count) ?? 0 };
        } catch (e) {
          return { error: e.message };
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'listar_usuarias_embarazadas',
        description: 'Lista usuarias embarazadas con email y displayName. Siempre limit(50). Para "dame los emails" o "lista de embarazadas".',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Máximo de registros (default 50, máx 50)', default: 50 }
          },
          required: []
        }
      },
      handler: async (args = {}) => {
        try {
          const limit = Math.min(Math.max(parseInt(args.limit) || 50, 1), 50);
          const snapshot = await db.collection('users')
            .where('isPregnant', '==', true)
            .limit(limit)
            .get();
          const lista = snapshot.docs.map(doc => {
            const d = doc.data();
            return sanitize({ id: doc.id, email: d.email || '(sin email)', displayName: d.displayName || '(sin nombre)' });
          });
          return { total: lista.length, lista };
        } catch (e) {
          return { error: e.message };
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'contar_coleccion',
        description: 'Cuenta documentos en CUALQUIER colección. Usa count(). Colecciones: users, children, communities, posts, lists, recommendations, categories, countries, cities, recommendationReviews, banners, milestones, faq_history, etc.',
        parameters: {
          type: 'object',
          properties: {
            coleccion: { type: 'string', description: 'Nombre de la colección (users, children, posts, recommendations, etc.)' },
            filtro_campo: { type: 'string', description: 'Opcional: campo para filtrar (ej: isPregnant, isActive)' },
            filtro_valor: { type: 'string', description: 'Opcional: valor del filtro (ej: true)' }
          },
          required: ['coleccion']
        }
      },
      handler: async (args = {}) => {
        try {
          const coleccion = String(args?.coleccion || '').trim().toLowerCase();
          if (!COLECCIONES_PERMITIDAS.includes(coleccion)) {
            return { error: `Colección no permitida. Disponibles: ${COLECCIONES_PERMITIDAS.join(', ')}` };
          }
          let query = db.collection(coleccion);
          if (args?.filtro_campo && args?.filtro_valor !== undefined) {
            const val = args.filtro_valor === 'true' ? true : args.filtro_valor === 'false' ? false : args.filtro_valor;
            query = query.where(args.filtro_campo, '==', val);
          } else if (coleccion === 'recommendations') {
            query = query.where('isActive', '==', true);
          }
          const snapshot = await query.count().get();
          const d = typeof snapshot.data === 'function' ? snapshot.data() : snapshot.data;
          return { coleccion, total: (d && d.count) ?? 0 };
        } catch (e) {
          return { error: e.message };
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'listar_coleccion',
        description: 'Lista documentos de CUALQUIER colección. Siempre limit(50). Para ver datos de users, children, posts, recommendations, communities, etc.',
        parameters: {
          type: 'object',
          properties: {
            coleccion: { type: 'string', description: 'Nombre de la colección (users, children, posts, recommendations, communities, etc.)' },
            limit: { type: 'number', description: 'Máximo de registros (default 50, máx 50)' },
            filtro_campo: { type: 'string', description: 'Opcional: filtrar por campo (ej: isPregnant)' },
            filtro_valor: { type: 'string', description: 'Opcional: valor del filtro (ej: true)' }
          },
          required: ['coleccion']
        }
      },
      handler: async (args = {}) => {
        try {
          const coleccion = String(args?.coleccion || '').trim().toLowerCase();
          if (!COLECCIONES_PERMITIDAS.includes(coleccion)) {
            return { error: `Colección no permitida. Disponibles: ${COLECCIONES_PERMITIDAS.join(', ')}` };
          }
          const limit = Math.min(Math.max(parseInt(args.limit) || 50, 1), 50);
          let query = db.collection(coleccion);
          if (args?.filtro_campo && args?.filtro_valor !== undefined) {
            const val = args.filtro_valor === 'true' ? true : args.filtro_valor === 'false' ? false : args.filtro_valor;
            query = query.where(args.filtro_campo, '==', val);
          } else if (coleccion === 'recommendations') {
            query = query.where('isActive', '==', true);
          }
          const snapshot = await query.limit(limit).get();
          const lista = snapshot.docs.map(doc => sanitize({ id: doc.id, ...doc.data() }));
          return { coleccion, total: lista.length, lista };
        } catch (e) {
          return { error: e.message };
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'colecciones_disponibles',
        description: 'Devuelve la lista de colecciones que se pueden consultar. Útil cuando el usuario pregunta qué datos hay o qué puede consultar.',
        parameters: { type: 'object', properties: {}, required: [] }
      },
      handler: async () => {
        return { colecciones: COLECCIONES_PERMITIDAS };
      }
    },
    {
      type: 'function',
      function: {
        name: 'listar_usuarios',
        description: 'Lista usuarios con email, displayName. Siempre limit(50). Para listas de usuarios.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Máximo (default 50, máx 50)', default: 50 }
          },
          required: []
        }
      },
      handler: async (args = {}) => {
        try {
          const limit = Math.min(Math.max(parseInt(args.limit) || 50, 1), 50);
          const snapshot = await db.collection('users').limit(limit).get();
          const lista = snapshot.docs.map(doc => {
            const d = doc.data();
            return sanitize({ id: doc.id, email: d.email, displayName: d.displayName, createdAt: d.createdAt });
          });
          return { total: lista.length, lista };
        } catch (e) {
          return { error: e.message };
        }
      }
    }
  ];
};

const buildToolsForOpenAI = (tools) => tools.map(t => ({
  type: 'function',
  function: {
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters
  }
}));

const executeTool = async (tools, name, args) => {
  const tool = tools.find(t => t.function.name === name);
  if (!tool || !tool.handler) return { error: `Tool ${name} no encontrada` };
  return tool.handler(args);
};

module.exports = { toolsFactory, buildToolsForOpenAI, executeTool };
