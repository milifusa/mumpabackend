#!/bin/bash

echo "🚀 Despliegue en Vercel - Backend Firebase"
echo "=========================================="

# Verificar si Vercel CLI está instalado
if ! command -v npx &> /dev/null; then
    echo "❌ npx no está disponible"
    echo "📦 Instalando npx..."
    npm install -g npx
fi

# Verificar si el usuario está logueado
if ! npx vercel whoami &> /dev/null; then
    echo "🔐 Iniciando sesión en Vercel..."
    npx vercel login
fi

echo "📁 Preparando archivos para despliegue..."

# Verificar que el archivo .env existe
if [ ! -f .env ]; then
    echo "❌ Error: El archivo .env no existe"
    echo "💡 Ejecuta primero: npm run setup"
    exit 1
fi

echo "✅ Archivo .env encontrado"

# Hacer commit de los cambios
echo "📝 Haciendo commit de los cambios..."
git add .
git commit -m "Deploy to Vercel - $(date)"

echo "🚀 Iniciando despliegue en Vercel..."
echo "💡 Sigue las instrucciones en pantalla..."
echo "💡 IMPORTANTE: Configura las variables de entorno en el dashboard de Vercel"

# Desplegar
npx vercel

echo ""
echo "🎉 ¡Despliegue completado!"
echo "📋 Próximos pasos:"
echo "1. Ve al dashboard de Vercel"
echo "2. Selecciona tu proyecto"
echo "3. Ve a Settings > Environment Variables"
echo "4. Agrega todas las variables de Firebase del archivo .env"
echo "5. Tu API estará disponible en: https://tu-proyecto.vercel.app"
echo ""
echo "🔗 Para probar: https://tu-proyecto.vercel.app/health"
