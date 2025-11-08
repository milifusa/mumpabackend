#!/bin/bash

# Script para configurar CORS en Firebase Storage
# Esto permitirá que el dashboard y la app accedan a las imágenes

echo "🔧 Configurando CORS en Firebase Storage..."
echo ""

# Verificar que el archivo de configuración existe
if [ ! -f "cors-storage-config.json" ]; then
  echo "❌ Error: No se encontró el archivo cors-storage-config.json"
  exit 1
fi

echo "✅ Archivo de configuración encontrado"
echo ""

# Mostrar el contenido de la configuración
echo "📋 Configuración CORS actual:"
cat cors-storage-config.json
echo ""

# Obtener el nombre del bucket
BUCKET_NAME="mumpabackend.firebasestorage.app"

echo "🪣 Bucket de Firebase Storage: gs://${BUCKET_NAME}"
echo ""

# Aplicar configuración CORS
echo "⚙️ Aplicando configuración CORS..."
echo ""

# Opción 1: Usar gsutil (si está instalado)
if command -v gsutil &> /dev/null; then
  echo "✅ gsutil encontrado, aplicando configuración..."
  gsutil cors set cors-storage-config.json gs://${BUCKET_NAME}
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡CORS configurado exitosamente!"
    echo ""
    echo "📝 Verificar configuración actual:"
    gsutil cors get gs://${BUCKET_NAME}
  else
    echo ""
    echo "❌ Error al aplicar configuración CORS"
    echo ""
    echo "💡 Solución alternativa: Configurar desde la consola de Firebase"
    echo "1. Ve a: https://console.firebase.google.com/project/mumpabackend/storage"
    echo "2. Click en los 3 puntos del bucket"
    echo "3. Selecciona 'Edit CORS configuration'"
    echo "4. Pega el contenido de cors-storage-config.json"
    exit 1
  fi
else
  echo "⚠️  gsutil no está instalado"
  echo ""
  echo "📦 Para instalar gsutil:"
  echo "   brew install google-cloud-sdk"
  echo "   gcloud init"
  echo "   gcloud auth login"
  echo ""
  echo "O configura CORS manualmente desde Firebase Console:"
  echo "1. Ve a: https://console.firebase.google.com/project/mumpabackend/storage"
  echo "2. Click en los 3 puntos del bucket"
  echo "3. Selecciona 'Edit CORS configuration'"
  echo "4. Pega el contenido de cors-storage-config.json"
  exit 1
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "Ahora las imágenes serán accesibles desde:"
echo "  - http://localhost:4200"
echo "  - https://munpa.online"
echo "  - https://www.munpa.online"
echo "  - https://dash.munpa.online"
echo ""

