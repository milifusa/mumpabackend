#!/bin/bash

###############################################################################
# Script para poblar síntomas en el sistema de consultas médicas
# Uso: ./scripts/populate-symptoms.sh
###############################################################################

# ⚠️ CONFIGURACIÓN
API_URL="https://api.munpa.online"
ADMIN_TOKEN="TU_ADMIN_TOKEN_AQUI"  # ⚠️ Reemplazar con tu token real

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que el token está configurado
if [ "$ADMIN_TOKEN" = "TU_ADMIN_TOKEN_AQUI" ]; then
  echo -e "${RED}❌ ERROR: Debes configurar tu ADMIN_TOKEN en el script${NC}"
  echo ""
  echo "📝 Abre el archivo y reemplaza TU_ADMIN_TOKEN_AQUI con tu token real"
  exit 1
fi

echo -e "${BLUE}🩺 Iniciando población de síntomas...${NC}"
echo ""

CREATED=0
FAILED=0

# Función para crear síntoma
create_symptom() {
  local name=$1
  local description=$2
  local category=$3
  local severity=$4
  local order=$5

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/admin/symptoms" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"description\": \"$description\",
      \"category\": \"$category\",
      \"severity\": \"$severity\",
      \"order\": $order
    }")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✅ Creado: $name${NC}"
    ((CREATED++))
  else
    echo -e "${RED}❌ Error creando $name (HTTP $http_code)${NC}"
    ((FAILED++))
  fi

  sleep 0.1  # Pausa para no saturar la API
}

# ==================== GENERAL ====================
echo -e "${BLUE}📋 Categoría: General${NC}"
create_symptom "Fiebre" "Temperatura corporal elevada por encima de 37.5°C" "general" "moderate" 1
create_symptom "Dolor General" "Malestar o dolor en cualquier parte del cuerpo" "general" "moderate" 2
create_symptom "Irritabilidad" "El bebé está más inquieto o llorón de lo normal" "general" "mild" 3
create_symptom "Falta de Apetito" "No quiere comer o rechaza alimentos" "general" "moderate" 4
create_symptom "Sueño Excesivo" "Duerme mucho más de lo habitual" "general" "moderate" 5

# ==================== DIGESTIVO ====================
echo -e "${BLUE}📋 Categoría: Digestivo${NC}"
create_symptom "Vómito" "Expulsión forzada del contenido del estómago" "digestivo" "moderate" 6
create_symptom "Diarrea" "Heces líquidas o muy blandas, más frecuentes" "digestivo" "moderate" 7
create_symptom "Estreñimiento" "Dificultad para evacuar, heces duras" "digestivo" "mild" 8
create_symptom "Gases Excesivos" "Mucha acumulación de gas en el estómago" "digestivo" "mild" 9
create_symptom "Cólicos" "Llanto intenso y prolongado, abdomen tenso" "digestivo" "moderate" 10
create_symptom "Reflujo" "Regurgitación frecuente después de comer" "digestivo" "mild" 11

# ==================== RESPIRATORIO ====================
echo -e "${BLUE}📋 Categoría: Respiratorio${NC}"
create_symptom "Tos Seca" "Tos sin flema, irritativa" "respiratorio" "mild" 12
create_symptom "Tos con Flema" "Tos productiva con secreciones" "respiratorio" "moderate" 13
create_symptom "Congestión Nasal" "Nariz tapada, dificultad para respirar por la nariz" "respiratorio" "mild" 14
create_symptom "Dificultad para Respirar" "Respiración rápida o laboriosa" "respiratorio" "severe" 15
create_symptom "Sibilancias" "Silbido al respirar" "respiratorio" "moderate" 16
create_symptom "Estornudos Frecuentes" "Estornudos repetidos" "respiratorio" "mild" 17

# ==================== PIEL ====================
echo -e "${BLUE}📋 Categoría: Piel${NC}"
create_symptom "Sarpullido" "Erupción cutánea, manchas rojas" "piel" "moderate" 18
create_symptom "Dermatitis del Pañal" "Enrojecimiento e irritación en el área del pañal" "piel" "moderate" 19
create_symptom "Urticaria" "Ronchas o habones en la piel" "piel" "moderate" 20
create_symptom "Piel Seca o Escamosa" "Resequedad o descamación de la piel" "piel" "mild" 21
create_symptom "Eccema" "Parches de piel seca, enrojecida y con picazón" "piel" "moderate" 22

# ==================== NEUROLÓGICO ====================
echo -e "${BLUE}📋 Categoría: Neurológico${NC}"
create_symptom "Convulsiones" "Movimientos involuntarios o pérdida de conciencia" "neurologico" "severe" 23
create_symptom "Temblores" "Movimientos involuntarios suaves" "neurologico" "moderate" 24
create_symptom "Debilidad o Letargo" "Falta de energía, muy decaído" "neurologico" "moderate" 25

# ==================== OJOS Y OÍDOS ====================
echo -e "${BLUE}📋 Categoría: Ojos y Oídos${NC}"
create_symptom "Conjuntivitis" "Ojos rojos, lagrimeo, secreción" "ojos_oidos" "moderate" 26
create_symptom "Dolor de Oído" "Se toca o jala la oreja, llanto al acostarse" "ojos_oidos" "moderate" 27
create_symptom "Supuración de Oído" "Líquido saliendo del oído" "ojos_oidos" "moderate" 28
create_symptom "Ojos Llorosos" "Lagrimeo excesivo" "ojos_oidos" "mild" 29

# ==================== OTROS ====================
echo -e "${BLUE}📋 Categoría: Otros${NC}"
create_symptom "Accidente o Caída" "Golpe, caída o trauma reciente" "otros" "severe" 30
create_symptom "Intoxicación Sospechosa" "Posible ingesta de sustancia tóxica" "otros" "severe" 31
create_symptom "Reacción Alérgica" "Hinchazón, ronchas o dificultad respiratoria" "otros" "severe" 32
create_symptom "Sangrado" "Sangrado que no para o en lugares inusuales" "otros" "severe" 33
create_symptom "Otro Síntoma" "Algo diferente que te preocupa" "otros" "moderate" 34

# Resumen
echo ""
echo -e "${BLUE}📊 Resumen:${NC}"
echo -e "   ${GREEN}✅ Creados: $CREATED${NC}"
echo -e "   ${RED}❌ Fallidos: $FAILED${NC}"
echo -e "   📝 Total: 34"
echo ""

if [ $CREATED -gt 0 ]; then
  echo -e "${GREEN}🎉 ¡Síntomas creados exitosamente!${NC}"
  echo ""
  echo -e "👉 Verifica en: ${API_URL}/api/symptoms"
  echo ""
fi
