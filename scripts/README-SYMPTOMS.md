# 🩺 Scripts para Poblar Síntomas

Scripts para agregar automáticamente todos los síntomas al sistema de consultas médicas.

---

## 📋 ¿Qué incluyen los scripts?

**34 síntomas** organizados en 7 categorías:

- **General** (5): Fiebre, Dolor, Irritabilidad, etc.
- **Digestivo** (6): Vómito, Diarrea, Cólicos, etc.
- **Respiratorio** (6): Tos, Congestión, Dificultad respiratoria, etc.
- **Piel** (5): Sarpullido, Dermatitis, Eccema, etc.
- **Neurológico** (3): Convulsiones, Temblores, Letargo, etc.
- **Ojos y Oídos** (4): Conjuntivitis, Dolor de oído, etc.
- **Otros** (5): Accidentes, Reacciones alérgicas, etc.

---

## 🚀 Opción 1: Script con Node.js (Recomendado)

### Requisitos:
- Node.js instalado
- Paquete `axios` instalado

### Instalación:
```bash
npm install axios
```

### Configuración:
1. Abre `scripts/populate-symptoms.js`
2. Reemplaza `TU_ADMIN_TOKEN_AQUI` con tu token real:
```javascript
const ADMIN_TOKEN = 'tu_token_admin_aqui';
```

### Ejecución:
```bash
node scripts/populate-symptoms.js
```

### Output:
```
🩺 Iniciando población de síntomas...

✅ Creado: Fiebre
✅ Creado: Dolor General
✅ Creado: Irritabilidad
...

📊 Resumen:
   ✅ Creados: 34
   ❌ Fallidos: 0
   📝 Total: 34

🎉 ¡Síntomas creados exitosamente!

👉 Verifica en: https://api.munpa.online/api/symptoms
```

---

## 🚀 Opción 2: Script con Bash/cURL

### Requisitos:
- Bash (Linux, macOS, Git Bash en Windows)
- cURL (viene preinstalado en la mayoría de sistemas)

### Configuración:
1. Abre `scripts/populate-symptoms.sh`
2. Reemplaza `TU_ADMIN_TOKEN_AQUI` con tu token real:
```bash
ADMIN_TOKEN="tu_token_admin_aqui"
```

### Dar permisos de ejecución:
```bash
chmod +x scripts/populate-symptoms.sh
```

### Ejecución:
```bash
./scripts/populate-symptoms.sh
```

### Output:
```
🩺 Iniciando población de síntomas...

📋 Categoría: General
✅ Creado: Fiebre
✅ Creado: Dolor General
✅ Creado: Irritabilidad
...

📊 Resumen:
   ✅ Creados: 34
   ❌ Fallidos: 0
   📝 Total: 34

🎉 ¡Síntomas creados exitosamente!

👉 Verifica en: https://api.munpa.online/api/symptoms
```

---

## 🔑 ¿Dónde obtener el ADMIN_TOKEN?

### Opción 1: Desde el dashboard admin
1. Inicia sesión en el dashboard admin
2. Ve a tu perfil o configuración
3. Copia tu token de autenticación

### Opción 2: Generar uno manualmente
```bash
# Login con credenciales de admin
curl -X POST https://api.munpa.online/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@munpa.com",
    "password": "tu_password"
  }'
```

El token estará en la respuesta:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## ✅ Verificar que funcionó

### 1. Ver todos los síntomas:
```bash
curl https://api.munpa.online/api/symptoms \
  -H "Authorization: Bearer {tu_token}"
```

### 2. Ver síntomas por categoría:
```bash
curl "https://api.munpa.online/api/symptoms?category=general" \
  -H "Authorization: Bearer {tu_token}"
```

### 3. Contar síntomas (admin):
```bash
curl https://api.munpa.online/api/admin/symptoms \
  -H "Authorization: Bearer {admin_token}"
```

---

## 🔧 Personalización

### Agregar más síntomas:

**En Node.js** (`populate-symptoms.js`):
```javascript
const symptoms = [
  // ... síntomas existentes ...
  {
    name: 'Nuevo Síntoma',
    description: 'Descripción del síntoma',
    category: 'general',
    severity: 'moderate',
    order: 35
  }
];
```

**En Bash** (`populate-symptoms.sh`):
```bash
create_symptom "Nuevo Síntoma" "Descripción del síntoma" "general" "moderate" 35
```

### Cambiar URL del API:
```javascript
// Node.js
const API_URL = 'https://tu-api.com';
```

```bash
# Bash
API_URL="https://tu-api.com"
```

---

## 📊 Categorías Disponibles

| Categoría | Código | Emoji | Ejemplos |
|-----------|--------|-------|----------|
| General | `general` | 🌡️ | Fiebre, Dolor, Irritabilidad |
| Digestivo | `digestivo` | 🍼 | Vómito, Diarrea, Cólicos |
| Respiratorio | `respiratorio` | 🫁 | Tos, Congestión, Sibilancias |
| Piel | `piel` | 🧴 | Sarpullido, Eccema, Urticaria |
| Neurológico | `neurologico` | 🧠 | Convulsiones, Temblores |
| Ojos y Oídos | `ojos_oidos` | 👁️ | Conjuntivitis, Dolor de oído |
| Otros | `otros` | ⚕️ | Accidente, Alergia, Sangrado |

---

## 🎯 Niveles de Severidad

- `mild` (Leve): 💚 Síntomas menores, no urgentes
- `moderate` (Moderado): 💛 Requiere atención pero no urgente
- `severe` (Severo): 🔴 Requiere atención inmediata

---

## ❌ Solución de Problemas

### Error: "Debes configurar tu ADMIN_TOKEN"
**Solución:** Reemplaza `TU_ADMIN_TOKEN_AQUI` con tu token real.

### Error: "Authorization failed"
**Solución:** Tu token no es válido o expiró. Genera uno nuevo.

### Error: "El síntoma ya existe"
**Solución:** Ya ejecutaste el script antes. Puedes:
1. Eliminar los síntomas existentes desde el admin
2. O comentar las líneas de síntomas que ya existen

### Error: "Cannot find module 'axios'"
**Solución:** 
```bash
npm install axios
```

### Error: "command not found: node"
**Solución:** Instala Node.js desde https://nodejs.org

### Script Bash no ejecuta
**Solución:** Dale permisos:
```bash
chmod +x scripts/populate-symptoms.sh
```

---

## 🔄 Ejecutar de nuevo

Si necesitas ejecutar el script de nuevo:

1. **Primero elimina los síntomas existentes:**
```bash
# Ver IDs de síntomas
curl https://api.munpa.online/api/admin/symptoms \
  -H "Authorization: Bearer {admin_token}"

# Eliminar cada uno
curl -X DELETE https://api.munpa.online/api/admin/symptoms/{id} \
  -H "Authorization: Bearer {admin_token}"
```

2. **Luego ejecuta el script de nuevo**

---

## 📝 Notas

- ⏱️ El script toma aproximadamente **3-5 segundos** en completar
- 🔄 Tiene pausas de 100ms entre cada síntoma para no saturar la API
- ✅ Muestra progreso en tiempo real
- 📊 Reporta estadísticas al final
- 🛡️ Maneja errores automáticamente

---

## 🎉 ¡Listo!

Una vez ejecutado el script, tendrás **34 síntomas** listos para usar en el sistema de consultas médicas.

Los usuarios podrán seleccionarlos al crear una consulta médica. 🩺
