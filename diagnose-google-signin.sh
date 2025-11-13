#!/bin/bash

# Script de diagnóstico para Google Sign-In en Android
# Detecta problemas comunes de configuración

echo "🔍 DIAGNÓSTICO DE GOOGLE SIGN-IN - MUNPA"
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0
SUCCESS=0

echo "📋 Verificando configuración..."
echo ""

# 1. Verificar que estamos en el directorio correcto
echo "1️⃣ Verificando directorio del proyecto..."
if [ ! -d "android" ]; then
    echo -e "${RED}❌ No se encontró el directorio 'android'. Ejecuta este script desde la raíz de tu proyecto React Native.${NC}"
    ERRORS=$((ERRORS + 1))
    exit 1
else
    echo -e "${GREEN}✅ Directorio android encontrado${NC}"
    SUCCESS=$((SUCCESS + 1))
fi
echo ""

# 2. Verificar google-services.json
echo "2️⃣ Verificando google-services.json..."
if [ ! -f "android/app/google-services.json" ]; then
    echo -e "${RED}❌ google-services.json NO ENCONTRADO en android/app/${NC}"
    echo "   Descárgalo desde Firebase Console y colócalo en android/app/"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ google-services.json encontrado${NC}"
    
    # Verificar fecha de modificación
    MOD_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" android/app/google-services.json 2>/dev/null || stat -c "%y" android/app/google-services.json 2>/dev/null)
    echo "   📅 Última modificación: $MOD_DATE"
    
    # Verificar que tenga contenido
    if [ ! -s "android/app/google-services.json" ]; then
        echo -e "${RED}   ❌ El archivo está vacío${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}   ✅ El archivo tiene contenido${NC}"
        SUCCESS=$((SUCCESS + 1))
    fi
fi
echo ""

# 3. Obtener Package Name
echo "3️⃣ Obteniendo Package Name..."
if [ -f "android/app/build.gradle" ]; then
    PACKAGE_NAME=$(grep "applicationId" android/app/build.gradle | sed 's/.*"\(.*\)".*/\1/')
    if [ ! -z "$PACKAGE_NAME" ]; then
        echo -e "${GREEN}✅ Package Name: $PACKAGE_NAME${NC}"
        echo "   Este DEBE coincidir con el Package Name en Firebase Console"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${YELLOW}⚠️  No se pudo extraer el Package Name automáticamente${NC}"
        echo "   Verifica manualmente en android/app/build.gradle"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ No se encontró android/app/build.gradle${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Obtener SHA-1 y SHA-256
echo "4️⃣ Obteniendo SHA-1 y SHA-256 del keystore DEBUG..."
echo "   (Esto puede tardar unos segundos...)"
echo ""

cd android
SIGNING_REPORT=$(./gradlew signingReport 2>/dev/null)
cd ..

if [ $? -eq 0 ]; then
    # Extraer SHA-1
    SHA1=$(echo "$SIGNING_REPORT" | grep "SHA1:" | head -1 | sed 's/.*SHA1: //')
    # Extraer SHA-256
    SHA256=$(echo "$SIGNING_REPORT" | grep "SHA-256:" | head -1 | sed 's/.*SHA-256: //')
    
    if [ ! -z "$SHA1" ]; then
        echo -e "${GREEN}✅ SHA-1 (DEBUG):${NC}"
        echo "   $SHA1"
        echo ""
        echo -e "${YELLOW}   👆 COPIA ESTE SHA-1 y agrégalo en Firebase Console${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}❌ No se pudo obtener SHA-1${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    echo ""
    
    if [ ! -z "$SHA256" ]; then
        echo -e "${GREEN}✅ SHA-256 (DEBUG):${NC}"
        echo "   $SHA256"
        echo ""
        echo -e "${YELLOW}   👆 COPIA ESTE SHA-256 y agrégalo en Firebase Console${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}❌ No se pudo obtener SHA-256${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Error ejecutando ./gradlew signingReport${NC}"
    echo "   Verifica que Gradle esté configurado correctamente"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Verificar dependencias en build.gradle
echo "5️⃣ Verificando dependencias de Google Sign-In..."
if grep -q "com.google.android.gms:play-services-auth" android/app/build.gradle; then
    VERSION=$(grep "com.google.android.gms:play-services-auth" android/app/build.gradle | sed 's/.*:\([0-9.]*\).*/\1/')
    echo -e "${GREEN}✅ play-services-auth encontrado (versión $VERSION)${NC}"
    SUCCESS=$((SUCCESS + 1))
else
    echo -e "${YELLOW}⚠️  play-services-auth no encontrado en android/app/build.gradle${NC}"
    echo "   Agrega: implementation 'com.google.android.gms:play-services-auth:20.7.0'"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 6. Verificar google-services plugin
echo "6️⃣ Verificando Google Services Plugin..."
if grep -q "com.google.gms.google-services" android/build.gradle; then
    echo -e "${GREEN}✅ Google Services classpath encontrado en build.gradle${NC}"
    SUCCESS=$((SUCCESS + 1))
else
    echo -e "${YELLOW}⚠️  Google Services classpath no encontrado${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -q "com.google.gms.google-services" android/app/build.gradle; then
    echo -e "${GREEN}✅ Google Services plugin aplicado en app/build.gradle${NC}"
    SUCCESS=$((SUCCESS + 1))
else
    echo -e "${RED}❌ Google Services plugin NO aplicado en app/build.gradle${NC}"
    echo "   Agrega al final: apply plugin: 'com.google.gms.google-services'"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Resumen
echo ""
echo "========================================"
echo "📊 RESUMEN DEL DIAGNÓSTICO"
echo "========================================"
echo -e "${GREEN}✅ Verificaciones exitosas: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Advertencias: $WARNINGS${NC}"
echo -e "${RED}❌ Errores: $ERRORS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}🔴 HAY ERRORES QUE DEBEN CORREGIRSE${NC}"
    echo ""
    echo "Pasos siguientes:"
    echo "1. Corrige los errores marcados arriba"
    echo "2. Ejecuta este script de nuevo para verificar"
    echo "3. Sigue la guía en FIX-GOOGLE-SIGNIN-ERROR.md"
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}🟡 HAY ADVERTENCIAS - Revisa la configuración${NC}"
    echo ""
    echo "Pasos siguientes:"
    echo "1. Revisa las advertencias marcadas arriba"
    echo "2. Si el problema persiste, sigue FIX-GOOGLE-SIGNIN-ERROR.md"
else
    echo -e "${GREEN}🟢 TODO PARECE ESTAR BIEN${NC}"
    echo ""
    echo "Si aún tienes DEVELOPER_ERROR:"
    echo "1. Verifica que los SHA estén agregados en Firebase Console"
    echo "2. Descarga un NUEVO google-services.json"
    echo "3. Ejecuta: cd android && ./gradlew clean && cd .."
    echo "4. Desinstala la app del dispositivo"
    echo "5. Reinstala: npx react-native run-android"
fi
echo ""

# Instrucciones finales
echo "========================================"
echo "📝 PRÓXIMOS PASOS"
echo "========================================"
echo ""
echo "1️⃣ COPIA los SHA de arriba (SHA-1 y SHA-256)"
echo ""
echo "2️⃣ Ve a Firebase Console:"
echo "   https://console.firebase.google.com/"
echo ""
echo "3️⃣ Agrega los SHA en:"
echo "   Project Settings > Your apps > Android app > SHA certificate fingerprints"
echo ""
echo "4️⃣ DESCARGA el nuevo google-services.json y reemplázalo en:"
echo "   android/app/google-services.json"
echo ""
echo "5️⃣ LIMPIA todo:"
echo "   cd android && ./gradlew clean && cd .."
echo "   rm -rf node_modules && npm install"
echo ""
echo "6️⃣ DESINSTALA la app del dispositivo"
echo ""
echo "7️⃣ REINSTALA:"
echo "   npx react-native run-android"
echo ""
echo "📖 Para más detalles, lee: FIX-GOOGLE-SIGNIN-ERROR.md"
echo ""

