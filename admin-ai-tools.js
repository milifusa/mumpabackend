/**
 * Herramientas (tools) para el agente IA de administración.
 * Usa count() para estadísticas y limit() para listas - NUNCA consultas abiertas.
 * Filtra datos sensibles antes de devolver a la IA.
 */

const CAMPOS_SENSIBLES = ['passwordHash', 'password', 'tokens', 'refreshToken', 'customToken'];

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
        description: 'Cuenta documentos en una colección. Usa count(). Colecciones: users, children, communities, posts, lists, recommendations, categories.',
        parameters: {
          type: 'object',
          properties: {
            coleccion: { type: 'string', enum: ['users', 'children', 'communities', 'posts', 'lists', 'recommendations', 'categories'], description: 'Nombre de la colección' }
          },
          required: ['coleccion']
        }
      },
      handler: async (args = {}) => {
        try {
          const coleccion = args?.coleccion;
          if (!coleccion) return { error: 'coleccion requerida' };
          let query = db.collection(coleccion);
          if (coleccion === 'recommendations') {
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
