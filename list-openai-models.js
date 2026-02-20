// Cargar .env (prueba también 'env' si existe)
require('dotenv').config();
require('dotenv').config({ path: 'env' });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY no encontrada. Usa: OPENAI_API_KEY=sk-xxx node list-openai-models.js');
  process.exit(1);
}

const client = new OpenAI({ apiKey });

async function main() {
  try {
    const response = await client.models.list();
    console.log(JSON.stringify(response, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
    if (!process.env.OPENAI_API_KEY) {
      console.error('Asegúrate de tener OPENAI_API_KEY en tu archivo .env');
    }
  }
}

main();
