# 🔔 Sistema de Notificaciones Push - Munpa

## 📋 Resumen

Sistema completo de notificaciones push usando **Firebase Cloud Messaging (FCM)** con:

✅ **Notificaciones automáticas** - Mensajes, compras, transacciones  
✅ **Envío desde dashboard** - A usuarios específicos o todos  
✅ **Segmentación** - Por ciudad, estado, si tienen hijos  
✅ **Programación** - Enviar notificaciones en fecha/hora específica  
✅ **Historial** - Ver todas las notificaciones enviadas  
✅ **Estadísticas** - Métricas de notificaciones  
✅ **Limpieza automática** - Elimina tokens inválidos  

---

## 🎯 Tipos de Notificaciones

### 1. Notificaciones Automáticas (Triggers)

- 💬 **Nuevo mensaje** - Cuando alguien te envía un mensaje en el marketplace
- 🎉 **Venta realizada** - Cuando alguien compra tu producto
- 📌 **Producto reservado** - Cuando alguien reserva tu producto
- 👀 **Interés en producto** - Cuando alguien muestra interés

### 2. Notificaciones del Dashboard

- 📢 **Broadcast** - Enviar a todos los usuarios (con opción de segmentar)
- 👥 **Usuarios específicos** - Enviar a usuarios seleccionados
- ⏰ **Programadas** - Enviar en una fecha/hora específica

---

## 🔧 Configuración Inicial

### 1. En Firebase Console

1. Ve a **Project Settings** → **Cloud Messaging**
2. Copia el **Server key** (ya está configurado en tu backend)
3. Asegúrate de que **Cloud Messaging API (Legacy)** esté habilitado

### 2. En la App (Flutter/React Native)

#### Para Flutter:

```dart
// pubspec.yaml
dependencies:
  firebase_messaging: ^14.7.6
  flutter_local_notifications: ^16.2.0
```

```dart
// main.dart o notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Solicitar permiso
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ Permisos de notificaciones concedidos');
      
      // Obtener token FCM
      String? token = await _fcm.getToken();
      if (token != null) {
        print('📱 Token FCM: $token');
        await registerToken(token);
      }
      
      // Escuchar cambios de token
      _fcm.onTokenRefresh.listen((newToken) {
        registerToken(newToken);
      });
    }

    // Configurar notificaciones locales para Android
    const AndroidInitializationSettings androidSettings = 
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings iosSettings = 
        DarwinInitializationSettings();
    
    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        _handleNotificationTap(response);
      },
    );

    // Manejar notificaciones cuando la app está en foreground
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📬 Notificación recibida en foreground');
      _showLocalNotification(message);
    });

    // Manejar cuando el usuario toca la notificación
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('📬 Notificación tocada');
      _handleNotificationNavigation(message);
    });
  }

  // Registrar token en el backend
  Future<void> registerToken(String token) async {
    try {
      final response = await http.post(
        Uri.parse('https://api.munpa.online/api/notifications/register-token'),
        headers: {
          'Authorization': 'Bearer ${await getAuthToken()}',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'token': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
        }),
      );

      if (response.statusCode == 200) {
        print('✅ Token registrado en el backend');
      }
    } catch (e) {
      print('❌ Error registrando token: $e');
    }
  }

  // Mostrar notificación local
  Future<void> _showLocalNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails = 
        AndroidNotificationDetails(
      'munpa_notifications',
      'Notificaciones Munpa',
      channelDescription: 'Notificaciones de la app Munpa',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails();

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'Munpa',
      message.notification?.body ?? '',
      details,
      payload: jsonEncode(message.data),
    );
  }

  // Navegar según el tipo de notificación
  void _handleNotificationNavigation(RemoteMessage message) {
    final data = message.data;
    final type = data['type'];
    final screen = data['screen'];

    switch (type) {
      case 'new_message':
        navigatorKey.currentState?.pushNamed(
          '/chat',
          arguments: {
            'chatId': data['chatId'],
            'senderId': data['senderId'],
            'productId': data['productId'],
          },
        );
        break;

      case 'purchase':
      case 'reservation':
      case 'interest':
        navigatorKey.currentState?.pushNamed('/my-products');
        break;

      case 'admin_notification':
      case 'broadcast':
        if (screen != null && screen.isNotEmpty) {
          navigatorKey.currentState?.pushNamed('/${screen.toLowerCase()}');
        }
        break;

      default:
        navigatorKey.currentState?.pushNamed('/home');
    }
  }

  void _handleNotificationTap(NotificationResponse response) {
    if (response.payload != null) {
      final data = jsonDecode(response.payload!);
      // Navegar según el payload
    }
  }

  // Eliminar token (al hacer logout)
  Future<void> removeToken() async {
    try {
      String? token = await _fcm.getToken();
      if (token != null) {
        await http.post(
          Uri.parse('https://api.munpa.online/api/notifications/remove-token'),
          headers: {
            'Authorization': 'Bearer ${await getAuthToken()}',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({'token': token}),
        );
      }
    } catch (e) {
      print('❌ Error eliminando token: $e');
    }
  }
}
```

---

## 📡 API - Endpoints (19 endpoints)

### **Para la App (9 endpoints):**

1. `POST /api/notifications/register-token` - Registrar token FCM
2. `POST /api/notifications/remove-token` - Eliminar token
3. `GET /api/notifications` - Ver notificaciones
4. `PATCH /api/notifications/:id/read` - Marcar como leída
5. `PATCH /api/notifications/read-all` - Marcar todas como leídas
6. `DELETE /api/notifications/:id` - Eliminar notificación
7. `DELETE /api/notifications/read-all` - Eliminar todas las leídas
8. `GET /api/notifications/unread-count` - Contador de no leídas
9. `POST /api/notifications/new-message` - Enviar notificación de mensaje
10. `POST /api/notifications/transaction` - Enviar notificación de compra

### **Para el Dashboard (9 endpoints):**

11. `POST /api/admin/notifications/send` - Enviar a usuarios específicos
12. `POST /api/admin/notifications/broadcast` - Broadcast a todos
13. `POST /api/admin/notifications/schedule` - Programar notificación
14. `GET /api/admin/notifications/scheduled` - Ver programadas
15. `DELETE /api/admin/notifications/scheduled/:id` - Cancelar programada
16. `GET /api/admin/notifications/history` - Ver historial
17. `GET /api/admin/notifications/stats` - Estadísticas

---

### 1. Registrar Token FCM

```http
POST /api/notifications/register-token
Authorization: Bearer {token}
```

**Body:**
```json
{
  "token": "fcm_token_del_dispositivo",
  "platform": "ios"  // o "android"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Token registrado exitosamente"
}
```

**Uso:**
- Llamar al iniciar la app
- Llamar cuando el token FCM cambie
- Un usuario puede tener múltiples tokens (varios dispositivos)

---

### 2. Eliminar Token FCM

```http
POST /api/notifications/remove-token
Authorization: Bearer {token}
```

**Body:**
```json
{
  "token": "fcm_token_del_dispositivo"
}
```

**Uso:**
- Llamar al hacer logout
- Llamar al desinstalar la app

---

### 3. Obtener Notificaciones del Usuario

```http
GET /api/notifications?page=1&limit=50&unreadOnly=false
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number) - Número de página (default: 1)
- `limit` (number) - Notificaciones por página (default: 50)
- `unreadOnly` (boolean) - Solo no leídas (default: false)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "userId": "user_456",
      "type": "new_message",
      "title": "💬 Nuevo mensaje de María",
      "body": "¿Aún está disponible la carriola?",
      "imageUrl": null,
      "data": {
        "type": "new_message",
        "senderId": "user_789",
        "productId": "prod_123",
        "screen": "ChatScreen"
      },
      "read": false,
      "createdAt": "2025-11-11T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1,
    "unreadCount": 8
  }
}
```

---

### 4. Marcar Notificación como Leída

```http
PATCH /api/notifications/:id/read
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

---

### 5. Marcar Todas como Leídas

```http
PATCH /api/notifications/read-all
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "8 notificaciones marcadas como leídas"
}
```

---

### 6. Eliminar Notificación

```http
DELETE /api/notifications/:id
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Notificación eliminada exitosamente"
}
```

---

### 7. Eliminar Todas las Leídas

```http
DELETE /api/notifications/read-all
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "15 notificaciones eliminadas exitosamente"
}
```

---

### 8. Obtener Contador de No Leídas

```http
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 8
  }
}
```

**Uso:** Para mostrar el badge en el ícono de notificaciones.

---

### 9. Notificación de Nuevo Mensaje

```http
POST /api/notifications/new-message
Authorization: Bearer {token}
```

**Body:**
```json
{
  "receiverId": "user_123",
  "senderName": "María López",
  "message": "¿Aún está disponible la carriola?",
  "productId": "prod_456",
  "productTitle": "Carriola evenflo"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Notificación enviada",
  "result": {
    "successCount": 2,
    "failureCount": 0
  }
}
```

**Uso en el chat:**
```typescript
// Cuando envías un mensaje
async function sendMessage(message) {
  // 1. Guardar mensaje en Firestore
  await saveMessageToFirestore(message);
  
  // 2. Enviar notificación push
  await fetch('https://api.munpa.online/api/notifications/new-message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receiverId: chatUser.id,
      senderName: currentUser.name,
      message: message.text,
      productId: product.id,
      productTitle: product.title
    })
  });
}
```

---

### 10. Notificación de Compra/Transacción

```http
POST /api/notifications/transaction
Authorization: Bearer {token}
```

**Body:**
```json
{
  "sellerId": "user_789",
  "buyerName": "Juan Pérez",
  "productTitle": "Carriola evenflo",
  "transactionType": "purchase"  // purchase, reservation, interest
}
```

**Tipos de transacción:**
- `purchase` → "🎉 ¡Venta realizada!"
- `reservation` → "📌 Producto reservado"
- `interest` → "👀 Alguien está interesado"

**Uso cuando compran un producto:**
```typescript
async function purchaseProduct(productId, sellerId) {
  // 1. Actualizar estado del producto en Firestore
  await updateProductStatus(productId, 'vendido');
  
  // 2. Enviar notificación al vendedor
  await fetch('https://api.munpa.online/api/notifications/transaction', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sellerId: sellerId,
      buyerName: currentUser.name,
      productTitle: product.title,
      transactionType: 'purchase'
    })
  });
}
```

---

## 🛠️ ADMIN - Enviar desde el Dashboard

### 5. Enviar a Usuarios Específicos

```http
POST /api/admin/notifications/send
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "userIds": ["user_123", "user_456", "user_789"],
  "title": "¡Nueva función disponible!",
  "body": "Ahora puedes hacer trueques en el marketplace",
  "imageUrl": "https://storage.googleapis.com/.../promo.jpg",
  "screen": "MarketplaceScreen",
  "data": {
    "customField": "value"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Notificación enviada a 3 usuarios",
  "result": {
    "successCount": 3,
    "failureCount": 0
  }
}
```

---

### 6. Broadcast a Todos los Usuarios

```http
POST /api/admin/notifications/broadcast
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "title": "🎉 ¡Nuevo marketplace disponible!",
  "body": "Ahora puedes vender, donar o hacer trueques de artículos para bebés",
  "imageUrl": "https://storage.googleapis.com/.../banner.jpg",
  "screen": "MarketplaceScreen",
  "segment": {
    "hasChildren": true,
    "city": "Monterrey",
    "state": "Nuevo León"
  }
}
```

**Segmentación (opcional):**
- `hasChildren` (boolean) - Solo usuarios con hijos
- `city` (string) - Por ciudad
- `state` (string) - Por estado

**Sin segmento = todos los usuarios**

**Respuesta:**
```json
{
  "success": true,
  "message": "Notificación enviada a 1,523 usuarios",
  "stats": {
    "usersCount": 1523,
    "tokensCount": 2145,
    "successCount": 2140,
    "failureCount": 5
  }
}
```

---

### 7. Programar Notificación

```http
POST /api/admin/notifications/schedule
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "title": "🎁 Recordatorio de evento",
  "body": "Mañana inicia la feria del bebé en Monterrey",
  "imageUrl": "https://storage.googleapis.com/.../event.jpg",
  "screen": "EventsScreen",
  "scheduledFor": "2025-11-15T10:00:00Z",
  "segment": {
    "city": "Monterrey"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Notificación programada exitosamente",
  "id": "sched_123",
  "scheduledFor": "2025-11-15T10:00:00.000Z"
}
```

---

### 8. Ver Notificaciones Programadas

```http
GET /api/admin/notifications/scheduled?status=pending&page=1&limit=20
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `status` - pending, sent, cancelled
- `page` - Número de página
- `limit` - Items por página

---

### 9. Cancelar Notificación Programada

```http
DELETE /api/admin/notifications/scheduled/:id
Authorization: Bearer {admin_token}
```

---

### 10. Historial de Notificaciones

```http
GET /api/admin/notifications/history?page=1&limit=50&type=new_message
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `page` - Número de página
- `limit` - Items por página
- `type` - new_message, purchase, admin_notification, broadcast

---

### 11. Estadísticas de Notificaciones

```http
GET /api/admin/notifications/stats
Authorization: Bearer {admin_token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 5420,
    "byType": {
      "new_message": 3200,
      "purchase": 850,
      "admin_notification": 450,
      "broadcast": 920
    },
    "read": 4100,
    "unread": 1320,
    "last24h": 234,
    "last7days": 1567
  }
}
```

---

## 💻 Integración en la App

### Pantalla de Notificaciones (Flutter)

```dart
// NotificationsScreen.dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class NotificationsScreen extends StatefulWidget {
  @override
  _NotificationsScreenState createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> notifications = [];
  int unreadCount = 0;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadNotifications();
    loadUnreadCount();
  }

  // Cargar notificaciones
  Future<void> loadNotifications() async {
    setState(() => isLoading = true);
    
    try {
      final response = await http.get(
        Uri.parse('https://api.munpa.online/api/notifications?page=1&limit=50'),
        headers: {
          'Authorization': 'Bearer ${await getAuthToken()}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          notifications = data['data'];
          unreadCount = data['pagination']['unreadCount'];
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error cargando notificaciones: $e');
      setState(() => isLoading = false);
    }
  }

  // Cargar contador de no leídas
  Future<void> loadUnreadCount() async {
    try {
      final response = await http.get(
        Uri.parse('https://api.munpa.online/api/notifications/unread-count'),
        headers: {
          'Authorization': 'Bearer ${await getAuthToken()}',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          unreadCount = data['data']['unreadCount'];
        });
      }
    } catch (e) {
      print('Error cargando contador: $e');
    }
  }

  // Marcar como leída
  Future<void> markAsRead(String notificationId) async {
    try {
      await http.patch(
        Uri.parse('https://api.munpa.online/api/notifications/$notificationId/read'),
        headers: {
          'Authorization': 'Bearer ${await getAuthToken()}',
        },
      );
      
      loadNotifications(); // Recargar lista
    } catch (e) {
      print('Error marcando como leída: $e');
    }
  }

  // Marcar todas como leídas
  Future<void> markAllAsRead() async {
    try {
      await http.patch(
        Uri.parse('https://api.munpa.online/api/notifications/read-all'),
        headers: {
          'Authorization': 'Bearer ${await getAuthToken()}',
        },
      );
      
      loadNotifications();
    } catch (e) {
      print('Error marcando todas: $e');
    }
  }

  // Eliminar notificación
  Future<void> deleteNotification(String notificationId) async {
    try {
      await http.delete(
        Uri.parse('https://api.munpa.online/api/notifications/$notificationId'),
        headers: {
          'Authorization': 'Bearer ${await getAuthToken()}',
        },
      );
      
      loadNotifications();
    } catch (e) {
      print('Error eliminando: $e');
    }
  }

  // Eliminar todas las leídas
  Future<void> deleteAllRead() async {
    try {
      await http.delete(
        Uri.parse('https://api.munpa.online/api/notifications/read-all'),
        headers: {
          'Authorization': 'Bearer ${await getAuthToken()}',
        },
      );
      
      loadNotifications();
    } catch (e) {
      print('Error eliminando: $e');
    }
  }

  // Navegar según el tipo de notificación
  void handleNotificationTap(dynamic notification) {
    // Marcar como leída
    if (!notification['read']) {
      markAsRead(notification['id']);
    }

    // Navegar según el tipo
    final data = notification['data'];
    final type = data['type'];
    final screen = data['screen'];

    switch (type) {
      case 'new_message':
        Navigator.pushNamed(
          context,
          '/chat',
          arguments: {
            'chatId': data['chatId'],
            'productId': data['productId'],
          },
        );
        break;

      case 'purchase':
      case 'reservation':
      case 'interest':
        Navigator.pushNamed(context, '/my-products');
        break;

      case 'admin_notification':
      case 'broadcast':
        if (screen != null && screen.isNotEmpty) {
          Navigator.pushNamed(context, '/${screen.toLowerCase()}');
        }
        break;

      default:
        Navigator.pushNamed(context, '/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Notificaciones'),
        actions: [
          // Badge con contador
          if (unreadCount > 0)
            Padding(
              padding: EdgeInsets.only(right: 16),
              child: Center(
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$unreadCount',
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
              ),
            ),
          
          // Menú de opciones
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'mark_all') {
                markAllAsRead();
              } else if (value == 'delete_all') {
                deleteAllRead();
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'mark_all',
                child: Text('Marcar todas como leídas'),
              ),
              PopupMenuItem(
                value: 'delete_all',
                child: Text('Eliminar todas las leídas'),
              ),
            ],
          ),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text(
                        'No tienes notificaciones',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: loadNotifications,
                  child: ListView.builder(
                    itemCount: notifications.length,
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      final isUnread = !notification['read'];

                      return Dismissible(
                        key: Key(notification['id']),
                        background: Container(
                          color: Colors.red,
                          alignment: Alignment.centerRight,
                          padding: EdgeInsets.only(right: 16),
                          child: Icon(Icons.delete, color: Colors.white),
                        ),
                        direction: DismissDirection.endToStart,
                        onDismissed: (direction) {
                          deleteNotification(notification['id']);
                        },
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isUnread ? Colors.blue : Colors.grey[300],
                            child: Icon(
                              _getIconForType(notification['type']),
                              color: Colors.white,
                            ),
                          ),
                          title: Text(
                            notification['title'],
                            style: TextStyle(
                              fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(height: 4),
                              Text(
                                notification['body'],
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              SizedBox(height: 4),
                              Text(
                                _formatDate(notification['createdAt']),
                                style: TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                          trailing: isUnread
                              ? Container(
                                  width: 12,
                                  height: 12,
                                  decoration: BoxDecoration(
                                    color: Colors.blue,
                                    shape: BoxShape.circle,
                                  ),
                                )
                              : null,
                          onTap: () => handleNotificationTap(notification),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'new_message':
        return Icons.message;
      case 'purchase':
        return Icons.shopping_cart;
      case 'reservation':
        return Icons.bookmark;
      case 'interest':
        return Icons.favorite;
      case 'admin_notification':
      case 'broadcast':
        return Icons.campaign;
      default:
        return Icons.notifications;
    }
  }

  String _formatDate(dynamic date) {
    try {
      DateTime dateTime;
      if (date is String) {
        dateTime = DateTime.parse(date);
      } else if (date is Map && date['_seconds'] != null) {
        dateTime = DateTime.fromMillisecondsSinceEpoch(date['_seconds'] * 1000);
      } else {
        return '';
      }

      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inDays > 7) {
        return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
      } else if (difference.inDays > 0) {
        return 'Hace ${difference.inDays} día${difference.inDays > 1 ? 's' : ''}';
      } else if (difference.inHours > 0) {
        return 'Hace ${difference.inHours} hora${difference.inHours > 1 ? 's' : ''}';
      } else if (difference.inMinutes > 0) {
        return 'Hace ${difference.inMinutes} minuto${difference.inMinutes > 1 ? 's' : ''}';
      } else {
        return 'Ahora';
      }
    } catch (e) {
      return '';
    }
  }
}
```

---

## 💻 Integración en el Dashboard

### Componente para Enviar Notificaciones

```typescript
// SendNotificationForm.tsx
import React, { useState } from 'react';

const SendNotificationForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    imageUrl: '',
    screen: 'HomeScreen',
    sendTo: 'all', // 'all', 'specific', 'segment'
    userIds: [],
    segment: {}
  });

  const handleSend = async () => {
    const endpoint = formData.sendTo === 'all' 
      ? '/api/admin/notifications/broadcast'
      : '/api/admin/notifications/send';

    const body = formData.sendTo === 'all'
      ? {
          title: formData.title,
          body: formData.body,
          imageUrl: formData.imageUrl,
          screen: formData.screen,
          segment: formData.segment
        }
      : {
          title: formData.title,
          body: formData.body,
          imageUrl: formData.imageUrl,
          screen: formData.screen,
          userIds: formData.userIds
        };

    const response = await fetch(
      `https://api.munpa.online${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    
    if (data.success) {
      alert(`Notificación enviada: ${data.message}`);
    }
  };

  return (
    <div className="notification-form">
      <h2>📢 Enviar Notificación Push</h2>
      
      <div className="form-group">
        <label>Título *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Ej: ¡Nueva función disponible!"
          maxLength={50}
        />
        <small>{formData.title.length}/50 caracteres</small>
      </div>

      <div className="form-group">
        <label>Mensaje *</label>
        <textarea
          value={formData.body}
          onChange={(e) => setFormData({...formData, body: e.target.value})}
          placeholder="Escribe el mensaje de la notificación..."
          maxLength={200}
          rows={4}
        />
        <small>{formData.body.length}/200 caracteres</small>
      </div>

      <div className="form-group">
        <label>Imagen (URL opcional)</label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
          placeholder="https://..."
        />
        {formData.imageUrl && (
          <img 
            src={formData.imageUrl} 
            alt="Preview" 
            style={{ maxWidth: '200px', marginTop: '10px' }}
          />
        )}
      </div>

      <div className="form-group">
        <label>Pantalla de destino</label>
        <select
          value={formData.screen}
          onChange={(e) => setFormData({...formData, screen: e.target.value})}
        >
          <option value="HomeScreen">Inicio</option>
          <option value="MarketplaceScreen">Marketplace</option>
          <option value="RecommendationsScreen">Recomendaciones</option>
          <option value="ProfileScreen">Perfil</option>
          <option value="EventsScreen">Eventos</option>
        </select>
      </div>

      <div className="form-group">
        <label>Enviar a:</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="all"
              checked={formData.sendTo === 'all'}
              onChange={(e) => setFormData({...formData, sendTo: e.target.value})}
            />
            Todos los usuarios
          </label>
          
          <label>
            <input
              type="radio"
              value="specific"
              checked={formData.sendTo === 'specific'}
              onChange={(e) => setFormData({...formData, sendTo: e.target.value})}
            />
            Usuarios específicos
          </label>
          
          <label>
            <input
              type="radio"
              value="segment"
              checked={formData.sendTo === 'segment'}
              onChange={(e) => setFormData({...formData, sendTo: e.target.value})}
            />
            Segmento
          </label>
        </div>
      </div>

      {formData.sendTo === 'segment' && (
        <div className="segment-options">
          <h4>Filtrar por:</h4>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                onChange={(e) => setFormData({
                  ...formData,
                  segment: {
                    ...formData.segment,
                    hasChildren: e.target.checked ? true : undefined
                  }
                })}
              />
              Solo usuarios con hijos
            </label>
          </div>

          <div className="form-group">
            <label>Ciudad</label>
            <input
              type="text"
              placeholder="Ej: Monterrey"
              onChange={(e) => setFormData({
                ...formData,
                segment: {
                  ...formData.segment,
                  city: e.target.value || undefined
                }
              })}
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <input
              type="text"
              placeholder="Ej: Nuevo León"
              onChange={(e) => setFormData({
                ...formData,
                segment: {
                  ...formData.segment,
                  state: e.target.value || undefined
                }
              })}
            />
          </div>
        </div>
      )}

      <button 
        onClick={handleSend}
        disabled={!formData.title || !formData.body}
        className="btn-primary btn-large"
      >
        📤 Enviar Notificación
      </button>

      <div className="preview-box">
        <h4>Vista previa:</h4>
        <div className="notification-preview">
          {formData.imageUrl && (
            <img src={formData.imageUrl} alt="Preview" />
          )}
          <div className="notification-content">
            <strong>{formData.title || 'Título'}</strong>
            <p>{formData.body || 'Mensaje de la notificación...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendNotificationForm;
```

---

### Componente para Programar Notificaciones

```typescript
// ScheduleNotificationForm.tsx
const ScheduleNotificationForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    scheduledFor: '',
    screen: 'HomeScreen'
  });

  const handleSchedule = async () => {
    const response = await fetch(
      'https://api.munpa.online/api/admin/notifications/schedule',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      }
    );

    const data = await response.json();
    
    if (data.success) {
      alert(`Notificación programada para: ${data.scheduledFor}`);
    }
  };

  return (
    <div>
      <h2>⏰ Programar Notificación</h2>
      
      <input
        type="text"
        placeholder="Título"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
      />

      <textarea
        placeholder="Mensaje"
        value={formData.body}
        onChange={(e) => setFormData({...formData, body: e.target.value})}
      />

      <input
        type="datetime-local"
        value={formData.scheduledFor}
        onChange={(e) => setFormData({...formData, scheduledFor: e.target.value})}
      />

      <button onClick={handleSchedule}>
        📅 Programar Envío
      </button>
    </div>
  );
};
```

---

## 📊 Estructura de Datos en Firestore

### Colección: `users`

```javascript
{
  uid: "user_123",
  name: "María López",
  email: "maria@ejemplo.com",
  fcmTokens: [
    "token_dispositivo_1",
    "token_dispositivo_2"
  ],  // Array de tokens (múltiples dispositivos)
  lastTokenUpdate: Timestamp,
  platform: "ios"  // o "android"
}
```

### Colección: `notifications`

```javascript
{
  userId: "user_123",
  type: "new_message",  // new_message, purchase, admin_notification, broadcast
  title: "💬 Nuevo mensaje de Juan",
  body: "¿Aún está disponible?",
  imageUrl: "https://...",
  data: {
    type: "new_message",
    senderId: "user_456",
    productId: "prod_789",
    screen: "ChatScreen"
  },
  read: false,
  sentBy: "admin_uid",  // Si fue enviada desde dashboard
  createdAt: Timestamp
}
```

### Colección: `scheduled_notifications`

```javascript
{
  title: "Recordatorio",
  body: "Evento mañana",
  imageUrl: "https://...",
  data: {},
  screen: "EventsScreen",
  userIds: ["user_1", "user_2"],  // null = todos
  segment: {
    city: "Monterrey",
    hasChildren: true
  },
  scheduledFor: Timestamp,
  status: "pending",  // pending, sent, cancelled
  createdBy: "admin_uid",
  createdAt: Timestamp
}
```

---

## ⚙️ Configuración de Índices en Firestore

Necesitarás crear estos índices compuestos en Firestore:

1. **Para notifications:**
   - Collection: `notifications`
   - Fields: `type` (Ascending), `createdAt` (Descending)

2. **Para scheduled_notifications:**
   - Collection: `scheduled_notifications`
   - Fields: `status` (Ascending), `scheduledFor` (Descending)

3. **Para limpieza de tokens:**
   - Collection: `users`
   - Fields: `fcmTokens` (Arrays)

---

## 🎯 Casos de Uso

### Caso 1: Usuario envía mensaje en el chat

```typescript
// En tu función de enviar mensaje
async function sendChatMessage(receiverId, message, productInfo) {
  // 1. Guardar mensaje en Firestore
  await saveMessage(message);
  
  // 2. Enviar notificación push
  await fetch('https://api.munpa.online/api/notifications/new-message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receiverId,
      senderName: currentUser.name,
      message: message.text,
      productId: productInfo.id,
      productTitle: productInfo.title
    })
  });
}
```

---

### Caso 2: Usuario compra un producto

```typescript
async function completeProductPurchase(product, sellerId) {
  // 1. Actualizar producto
  await updateProduct(product.id, { status: 'vendido' });
  
  // 2. Notificar al vendedor
  await fetch('https://api.munpa.online/api/notifications/transaction', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sellerId,
      buyerName: currentUser.name,
      productTitle: product.title,
      transactionType: 'purchase'
    })
  });
}
```

---

### Caso 3: Admin envía comunicado desde dashboard

```typescript
// Enviar a todos los usuarios de Monterrey
async function sendAnnouncementToMonterrey() {
  await fetch('https://api.munpa.online/api/admin/notifications/broadcast', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: '📣 Evento en Monterrey',
      body: 'Feria del bebé este sábado en la plaza',
      imageUrl: 'https://...',
      screen: 'EventsScreen',
      segment: {
        city: 'Monterrey'
      }
    })
  });
}
```

---

## 🔒 Seguridad y Mejores Prácticas

### 1. Validación de Tokens

El sistema automáticamente:
- ✅ Valida tokens antes de enviar
- ✅ Limpia tokens inválidos o expirados
- ✅ Maneja errores de FCM

### 2. Rate Limiting

FCM tiene límites:
- 500 tokens por solicitud multicast
- El sistema divide automáticamente en lotes

### 3. Privacidad

- Los tokens FCM son únicos por dispositivo
- No contienen información personal
- Se eliminan automáticamente al hacer logout

---

## 🐛 Solución de Problemas

### Problema 1: No llegan notificaciones

**Posibles causas:**
1. Token no registrado → Verificar que se llame `registerToken()` al iniciar
2. Permisos denegados → Solicitar permisos en settings de la app
3. Token inválido → Se limpia automáticamente

**Solución:**
```dart
// Verificar estado del token
String? token = await FirebaseMessaging.instance.getToken();
print('Token actual: $token');

// Verificar permisos
NotificationSettings settings = 
    await FirebaseMessaging.instance.requestPermission();
print('Permiso: ${settings.authorizationStatus}');
```

---

### Problema 2: Notificaciones no aparecen en foreground

**Solución:** Implementar `FirebaseMessaging.onMessage` con notificaciones locales:

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  // Mostrar notificación local
  _showLocalNotification(message);
});
```

---

### Problema 3: No navega correctamente al tocar notificación

**Solución:** Implementar manejo correcto del `data` payload:

```dart
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  final type = message.data['type'];
  final screen = message.data['screen'];
  
  // Navegar según el tipo
  navigateToScreen(screen, message.data);
});
```

---

## 📈 Estadísticas y Monitoreo

El dashboard permite ver:
- ✅ Total de notificaciones enviadas
- ✅ Notificaciones por tipo
- ✅ Notificaciones leídas vs no leídas
- ✅ Notificaciones en últimas 24h / 7 días
- ✅ Tasa de éxito de envío

---

## 🎉 ¡Sistema Completo!

Tu sistema de notificaciones push está listo para:

✅ **Enviar automáticamente** cuando hay mensajes o compras  
✅ **Enviar desde el dashboard** a usuarios específicos o todos  
✅ **Segmentar** por ciudad, estado, etc.  
✅ **Programar** notificaciones futuras  
✅ **Ver historial** y estadísticas completas  
✅ **Limpiar automáticamente** tokens inválidos  

¡Todo funciona con Firebase Cloud Messaging! 🚀

