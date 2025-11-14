#!/bin/bash

echo "🧪 Probando endpoint de recordatorios diarios..."
echo ""

# Cambiar este valor por tu CRON_SECRET real
CRON_SECRET="munpa-cron-2025-xyz123-change-me"

echo "📡 Enviando request a:"
echo "https://mumpabackend.vercel.app/api/notifications/daily-reminders"
echo ""

curl -X GET https://mumpabackend.vercel.app/api/notifications/daily-reminders \
  -H "x-cron-secret: $CRON_SECRET" \
  -v

echo ""
echo ""
echo "✅ Si ves 'success: true' → El endpoint funciona"
echo "❌ Si ves 401/403 → CRON_SECRET incorrecto o no configurado"
echo "❌ Si ves otro error → Revisar logs arriba"

