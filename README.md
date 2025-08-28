# Backend de Autenticación con Firebase

Un backend robusto construido con Node.js y Firebase para manejar autenticación de usuarios, incluyendo registro, login, gestión de perfiles y más.

## 🚀 Características

- ✅ Registro de usuarios (Sign Up)
- ✅ Login de usuarios (Sign In)
- ✅ Verificación de tokens JWT
- ✅ Gestión de perfiles de usuario
- ✅ Cambio de contraseñas
- ✅ Eliminación de cuentas
- ✅ Validación de datos de entrada
- ✅ Middleware de autenticación
- ✅ Integración completa con Firebase Auth y Firestore
- ✅ Manejo de errores robusto
- ✅ CORS configurado
- ✅ Logging de requests

## 📋 Prerrequisitos

- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta de Firebase con proyecto creado
- Credenciales de servicio de Firebase

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd mumpabackend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   **Opción A: Convertir desde archivo JSON existente**
   ```bash
   npm run convert:env
   ```
   
   **Opción B: Configurar manualmente**
   ```bash
   cp env.example .env
   # Edita el archivo .env con tus credenciales
   ```

4. **Configurar Firebase**
   - Ve a la [Consola de Firebase](https://console.firebase.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente
   - Ve a Configuración del proyecto > Cuentas de servicio
   - Genera una nueva clave privada
   - Descarga el archivo JSON con las credenciales
   - Si usas la Opción A, el script convertirá automáticamente el JSON a variables de entorno
   - Si usas la Opción B, copia manualmente los valores al archivo `.env`

5. **Configurar Firestore**
   - En la consola de Firebase, ve a Firestore Database
   - Crea una base de datos en modo de prueba
   - Configura las reglas de seguridad según tus necesidades

## ⚙️ Configuración

### Variables de Entorno (.env)

El servidor ahora utiliza variables de entorno en lugar del archivo JSON de Firebase. Esto es más seguro y flexible para diferentes entornos.

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de Firebase (obtener desde el archivo JSON de Firebase Admin SDK)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu-clave-privada-aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40tu-proyecto.iam.gserviceaccount.com

# Configuración de CORS (opcional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

**Nota importante:** El archivo `.env` está incluido en `.gitignore` para mantener seguras tus credenciales. Nunca subas este archivo al repositorio.

## 🚀 Uso

### Iniciar el servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📚 API Endpoints

### Autenticación

#### POST `/api/auth/signup`
Registra un nuevo usuario.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Contraseña123",
  "displayName": "Nombre Usuario"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "uid": "user-id",
    "email": "usuario@ejemplo.com",
    "displayName": "Nombre Usuario",
    "customToken": "firebase-custom-token"
  }
}
```

#### POST `/api/auth/login`
Inicia sesión de un usuario.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Contraseña123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "uid": "user-id",
    "email": "usuario@ejemplo.com",
    "displayName": "Nombre Usuario",
    "customToken": "firebase-custom-token"
  }
}
```

### Perfil de Usuario (Requiere autenticación)

#### GET `/api/auth/profile`
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

#### PUT `/api/auth/profile`
Actualiza el perfil del usuario.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Body:**
```json
{
  "displayName": "Nuevo Nombre"
}
```

#### PUT `/api/auth/change-password`
Cambia la contraseña del usuario.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Body:**
```json
{
  "newPassword": "NuevaContraseña123"
}
```

#### DELETE `/api/auth/account`
Elimina la cuenta del usuario.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

#### GET `/api/auth/verify-token`
Verifica si el token es válido.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

### Utilidades

#### GET `/health`
Verifica el estado del servidor.

#### GET `/`
Información general de la API.

## 🔐 Autenticación

El sistema utiliza Firebase Authentication con tokens JWT. Para acceder a rutas protegidas:

1. Obtén un token de Firebase Auth (usando el SDK del cliente)
2. Incluye el token en el header `Authorization: Bearer <token>`

## 📝 Validaciones

### Registro
- Email debe ser válido
- Contraseña mínimo 6 caracteres
- Contraseña debe contener mayúscula, minúscula y número
- Nombre entre 2 y 50 caracteres

### Login
- Email debe ser válido
- Contraseña requerida

### Cambio de contraseña
- Nueva contraseña mínimo 6 caracteres
- Nueva contraseña debe contener mayúscula, minúscula y número

## 🧪 Testing

Para probar la API puedes usar herramientas como:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

### Ejemplo con curl

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Obtener perfil (con token)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <tu-token-aqui>"
```

## 🏗️ Estructura del Proyecto

```
mumpabackend/
├── config/
│   └── firebase.js          # Configuración de Firebase
├── controllers/
│   └── authController.js    # Controladores de autenticación
├── middleware/
│   ├── auth.js             # Middleware de autenticación
│   └── validation.js       # Validaciones de entrada
├── routes/
│   └── auth.js             # Rutas de autenticación
├── .env                    # Variables de entorno
├── env.example             # Ejemplo de variables de entorno
├── package.json            # Dependencias del proyecto
├── server.js               # Servidor principal
└── README.md               # Documentación
```

## 🔧 Desarrollo

### Scripts disponibles

```bash
npm start          # Inicia el servidor en producción
npm run dev        # Inicia el servidor en desarrollo con nodemon
npm run convert:env # Convierte el archivo JSON de Firebase a variables de entorno
npm run setup      # Configuración inicial de Firebase
npm run deploy:vercel # Despliega en Vercel
npm run setup:vercel  # Configura variables de entorno en Vercel
```

### Logs

El servidor registra automáticamente:
- Todas las requests con timestamp
- Errores de autenticación
- Errores de validación
- Errores internos del servidor

## 🚀 Despliegue

### Heroku
1. Conecta tu repositorio a Heroku
2. Configura las variables de entorno en Heroku
3. Despliega automáticamente

### Vercel
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de Firebase
2. Verifica que las variables de entorno estén correctamente configuradas
3. Revisa los logs del servidor
4. Abre un issue en el repositorio

## 🔗 Enlaces Útiles

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Express.js](https://expressjs.com/)
- [Node.js](https://nodejs.org/)
# Test de conexión GitHub-Vercel - Thu Aug 28 13:19:05 CST 2025
