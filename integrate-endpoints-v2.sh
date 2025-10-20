#!/bin/bash

echo "🔧 Integrando endpoints de perfil de hijos en server.js..."

# Encontrar la línea donde está el middleware 404
LINE_NUM=$(grep -n "// Middleware para rutas no encontradas" server.js | cut -d: -f1)

if [ -z "$LINE_NUM" ]; then
  echo "❌ No se encontró la línea de inserción"
  exit 1
fi

echo "📍 Línea encontrada: $LINE_NUM"

# Calcular línea de inserción (3 líneas antes del middleware 404 para dejar espacio)
INSERT_LINE=$((LINE_NUM - 3))

if [ $INSERT_LINE -lt 1 ]; then
  INSERT_LINE=1
fi

echo "📍 Insertando en línea: $INSERT_LINE"

# Dividir el archivo
head -n $INSERT_LINE server.js > temp_part1.txt
tail -n +$((INSERT_LINE + 1)) server.js > temp_part2.txt

# Extraer solo el código de los endpoints (desde línea 8 hasta casi el final)
tail -n +8 children-endpoints.js | head -n -2 > temp_endpoints.txt

# Ensamblar el nuevo archivo
{
  cat temp_part1.txt
  echo ""
  echo "// =========================================="
  echo "// 📋 ENDPOINTS DE PERFIL COMPLETO DE HIJOS"
  echo "// =========================================="
  echo ""
  cat temp_endpoints.txt
  echo ""
  cat temp_part2.txt
} > server.js.new

# Reemplazar el archivo original
mv server.js.new server.js

# Limpiar archivos temporales
rm temp_part1.txt temp_part2.txt temp_endpoints.txt

LINES=$(wc -l < server.js | tr -d ' ')
echo "✅ Endpoints integrados exitosamente en server.js"
echo "📊 Total de líneas ahora: $LINES"
echo "🎯 Se agregaron aproximadamente 1500 líneas de código"

