# 📚 Ejemplos de Uso - API de Predicción de Sueño

Ejemplos prácticos en diferentes lenguajes y frameworks para integrar el sistema de predicción de sueño.

---

## 🌐 JavaScript / TypeScript

### React Native (Hooks)

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://tu-api.com/api';

interface SleepPrediction {
  nextNap: {
    time: string;
    confidence: number;
    expectedDuration: number;
  };
  bedtime: {
    time: string;
    confidence: number;
  };
  sleepPressure: {
    level: 'low' | 'medium' | 'high' | 'critical';
    hoursSinceLastSleep: number;
    recommendation: string;
  };
}

export const useSleepPrediction = (childId: string) => {
  const [prediction, setPrediction] = useState<SleepPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/sleep/predict/${childId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setPrediction(data.prediction);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error al cargar predicción');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchPrediction, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [childId]);

  return { prediction, loading, error, refetch: fetchPrediction };
};

// Componente de ejemplo
export const SleepDashboard: React.FC<{ childId: string }> = ({ childId }) => {
  const { prediction, loading, refetch } = useSleepPrediction(childId);
  const [recording, setRecording] = useState<string | null>(null);

  const startSleep = async (type: 'nap' | 'nightsleep') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`${API_URL}/sleep/record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId,
          type,
          startTime: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setRecording(data.sleepEventId);
        Alert.alert('✅', 'Registro iniciado');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el registro');
    }
  };

  const endSleep = async (quality: string) => {
    if (!recording) return;

    try {
      const token = await AsyncStorage.getItem('authToken');
      
      await fetch(`${API_URL}/sleep/${recording}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          quality,
        }),
      });

      setRecording(null);
      refetch();
      Alert.alert('✅', 'Sueño registrado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo finalizar el registro');
    }
  };

  if (loading) return <Text>Cargando...</Text>;

  return (
    <View>
      {prediction?.nextNap && (
        <View>
          <Text>Próxima Siesta: {new Date(prediction.nextNap.time).toLocaleTimeString()}</Text>
          <Text>Confianza: {prediction.nextNap.confidence}%</Text>
        </View>
      )}

      {!recording ? (
        <>
          <Button title="Iniciar Siesta" onPress={() => startSleep('nap')} />
          <Button title="Dormir Noche" onPress={() => startSleep('nightsleep')} />
        </>
      ) : (
        <>
          <Text>🔴 Registrando...</Text>
          <Button title="Bien 😊" onPress={() => endSleep('good')} />
          <Button title="Regular 😐" onPress={() => endSleep('fair')} />
          <Button title="Malo 😔" onPress={() => endSleep('poor')} />
        </>
      )}
    </View>
  );
};
```

### Next.js (API Routes)

```typescript
// pages/api/sleep/predict.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { childId } = req.query;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const response = await fetch(
      `${process.env.API_URL}/api/sleep/predict/${childId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener predicción' });
  }
}

// pages/sleep/[childId].tsx
import { useQuery, useMutation } from '@tanstack/react-query';

export default function SleepPage({ childId }: { childId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sleep-prediction', childId],
    queryFn: () => fetch(`/api/sleep/predict?childId=${childId}`).then(r => r.json()),
    refetchInterval: 5 * 60 * 1000, // Cada 5 minutos
  });

  const recordSleep = useMutation({
    mutationFn: async (sleepData: any) => {
      const response = await fetch('/api/sleep/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sleepData),
      });
      return response.json();
    },
  });

  return (
    <div>
      {data?.prediction && (
        <div>
          <h2>Próxima Siesta</h2>
          <p>{new Date(data.prediction.nextNap.time).toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 📱 Flutter / Dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/material.dart';

class SleepService {
  final String baseUrl;
  final String authToken;

  SleepService({
    required this.baseUrl,
    required this.authToken,
  });

  Future<SleepPrediction> getPrediction(String childId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/sleep/predict/$childId'),
      headers: {
        'Authorization': 'Bearer $authToken',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return SleepPrediction.fromJson(data['prediction']);
    } else {
      throw Exception('Error al cargar predicción');
    }
  }

  Future<String> recordSleep({
    required String childId,
    required String type,
    required DateTime startTime,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/sleep/record'),
      headers: {
        'Authorization': 'Bearer $authToken',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'childId': childId,
        'type': type,
        'startTime': startTime.toIso8601String(),
      }),
    );

    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      return data['sleepEventId'];
    } else {
      throw Exception('Error al registrar sueño');
    }
  }

  Future<void> updateSleep({
    required String eventId,
    required DateTime endTime,
    required String quality,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/api/sleep/$eventId'),
      headers: {
        'Authorization': 'Bearer $authToken',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'endTime': endTime.toIso8601String(),
        'quality': quality,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Error al actualizar sueño');
    }
  }
}

class SleepPrediction {
  final NextNap? nextNap;
  final Bedtime? bedtime;
  final SleepPressure? sleepPressure;

  SleepPrediction({
    this.nextNap,
    this.bedtime,
    this.sleepPressure,
  });

  factory SleepPrediction.fromJson(Map<String, dynamic> json) {
    return SleepPrediction(
      nextNap: json['nextNap'] != null 
        ? NextNap.fromJson(json['nextNap']) 
        : null,
      bedtime: json['bedtime'] != null 
        ? Bedtime.fromJson(json['bedtime']) 
        : null,
      sleepPressure: json['sleepPressure'] != null 
        ? SleepPressure.fromJson(json['sleepPressure']) 
        : null,
    );
  }
}

class NextNap {
  final DateTime time;
  final int confidence;
  final int expectedDuration;

  NextNap({
    required this.time,
    required this.confidence,
    required this.expectedDuration,
  });

  factory NextNap.fromJson(Map<String, dynamic> json) {
    return NextNap(
      time: DateTime.parse(json['time']),
      confidence: json['confidence'],
      expectedDuration: json['expectedDuration'],
    );
  }
}

// Widget de ejemplo
class SleepDashboard extends StatefulWidget {
  final String childId;

  const SleepDashboard({Key? key, required this.childId}) : super(key: key);

  @override
  _SleepDashboardState createState() => _SleepDashboardState();
}

class _SleepDashboardState extends State<SleepDashboard> {
  late SleepService _sleepService;
  SleepPrediction? _prediction;
  String? _recordingId;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _sleepService = SleepService(
      baseUrl: 'https://tu-api.com',
      authToken: 'tu_token',
    );
    _loadPrediction();
  }

  Future<void> _loadPrediction() async {
    try {
      final prediction = await _sleepService.getPrediction(widget.childId);
      setState(() {
        _prediction = prediction;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al cargar predicción')),
      );
    }
  }

  Future<void> _startSleep(String type) async {
    try {
      final eventId = await _sleepService.recordSleep(
        childId: widget.childId,
        type: type,
        startTime: DateTime.now(),
      );
      setState(() => _recordingId = eventId);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al iniciar registro')),
      );
    }
  }

  Future<void> _endSleep(String quality) async {
    if (_recordingId == null) return;

    try {
      await _sleepService.updateSleep(
        eventId: _recordingId!,
        endTime: DateTime.now(),
        quality: quality,
      );
      setState(() => _recordingId = null);
      _loadPrediction();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al finalizar registro')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(title: Text('Predicción de Sueño')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            if (_prediction?.nextNap != null)
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text(
                        'Próxima Siesta',
                        style: Theme.of(context).textTheme.headline6,
                      ),
                      SizedBox(height: 8),
                      Text(
                        TimeOfDay.fromDateTime(_prediction!.nextNap!.time)
                            .format(context),
                        style: Theme.of(context).textTheme.headline4,
                      ),
                      Text('Confianza: ${_prediction!.nextNap!.confidence}%'),
                    ],
                  ),
                ),
              ),
            SizedBox(height: 16),
            if (_recordingId == null)
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _startSleep('nap'),
                      child: Text('Iniciar Siesta'),
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _startSleep('nightsleep'),
                      child: Text('Dormir Noche'),
                    ),
                  ),
                ],
              )
            else
              Column(
                children: [
                  Text('🔴 Registrando...'),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _endSleep('good'),
                          child: Text('Bien 😊'),
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _endSleep('fair'),
                          child: Text('Regular 😐'),
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _endSleep('poor'),
                          child: Text('Malo 😔'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🍎 Swift / iOS

```swift
import Foundation

struct SleepPrediction: Codable {
    let nextNap: NextNap?
    let bedtime: Bedtime?
    let sleepPressure: SleepPressure?
}

struct NextNap: Codable {
    let time: String
    let confidence: Int
    let expectedDuration: Int
}

struct Bedtime: Codable {
    let time: String
    let confidence: Int
}

struct SleepPressure: Codable {
    let level: String
    let hoursSinceLastSleep: Double?
    let recommendation: String
}

class SleepService {
    private let baseURL = "https://tu-api.com/api"
    private var authToken: String
    
    init(authToken: String) {
        self.authToken = authToken
    }
    
    func getPrediction(childId: String, completion: @escaping (Result<SleepPrediction, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/sleep/predict/\(childId)") else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0)))
            return
        }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: 0)))
                return
            }
            
            do {
                let decoder = JSONDecoder()
                let result = try decoder.decode([String: SleepPrediction].self, from: data)
                if let prediction = result["prediction"] {
                    completion(.success(prediction))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    func recordSleep(
        childId: String,
        type: String,
        startTime: Date,
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        guard let url = URL(string: "\(baseURL)/sleep/record") else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let formatter = ISO8601DateFormatter()
        let body: [String: Any] = [
            "childId": childId,
            "type": type,
            "startTime": formatter.string(from: startTime)
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: 0)))
                return
            }
            
            do {
                let result = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                if let eventId = result?["sleepEventId"] as? String {
                    completion(.success(eventId))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

// SwiftUI View
import SwiftUI

struct SleepDashboardView: View {
    @State private var prediction: SleepPrediction?
    @State private var isLoading = true
    @State private var recordingId: String?
    
    let childId: String
    let sleepService: SleepService
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let nextNap = prediction?.nextNap {
                    VStack {
                        Text("Próxima Siesta")
                            .font(.headline)
                        Text(formatTime(nextNap.time))
                            .font(.largeTitle)
                        Text("Confianza: \(nextNap.confidence)%")
                            .foregroundColor(.gray)
                    }
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)
                }
                
                if recordingId == nil {
                    HStack {
                        Button("Iniciar Siesta") {
                            startSleep(type: "nap")
                        }
                        .buttonStyle(.borderedProminent)
                        
                        Button("Dormir Noche") {
                            startSleep(type: "nightsleep")
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    VStack {
                        Text("🔴 Registrando...")
                        HStack {
                            Button("Bien 😊") {
                                endSleep(quality: "good")
                            }
                            Button("Regular 😐") {
                                endSleep(quality: "fair")
                            }
                            Button("Malo 😔") {
                                endSleep(quality: "poor")
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .onAppear {
            loadPrediction()
        }
    }
    
    func loadPrediction() {
        sleepService.getPrediction(childId: childId) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let pred):
                    self.prediction = pred
                case .failure(let error):
                    print("Error: \(error)")
                }
                self.isLoading = false
            }
        }
    }
    
    func startSleep(type: String) {
        sleepService.recordSleep(
            childId: childId,
            type: type,
            startTime: Date()
        ) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let eventId):
                    self.recordingId = eventId
                case .failure(let error):
                    print("Error: \(error)")
                }
            }
        }
    }
    
    func endSleep(quality: String) {
        // Implementar actualización
    }
    
    func formatTime(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: isoString) else {
            return isoString
        }
        let timeFormatter = DateFormatter()
        timeFormatter.timeStyle = .short
        return timeFormatter.string(from: date)
    }
}
```

---

## 🤖 Kotlin / Android

```kotlin
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

data class SleepPrediction(
    val nextNap: NextNap?,
    val bedtime: Bedtime?,
    val sleepPressure: SleepPressure?
)

data class NextNap(
    val time: String,
    val confidence: Int,
    val expectedDuration: Int
)

data class Bedtime(
    val time: String,
    val confidence: Int
)

data class SleepPressure(
    val level: String,
    val hoursSinceLastSleep: Double?,
    val recommendation: String
)

data class RecordSleepRequest(
    val childId: String,
    val type: String,
    val startTime: String
)

data class RecordSleepResponse(
    val success: Boolean,
    val sleepEventId: String
)

interface SleepApiService {
    @GET("sleep/predict/{childId}")
    suspend fun getPrediction(
        @Path("childId") childId: String,
        @Header("Authorization") token: String
    ): Map<String, SleepPrediction>
    
    @POST("sleep/record")
    suspend fun recordSleep(
        @Header("Authorization") token: String,
        @Body request: RecordSleepRequest
    ): RecordSleepResponse
    
    @PUT("sleep/{eventId}")
    suspend fun updateSleep(
        @Path("eventId") eventId: String,
        @Header("Authorization") token: String,
        @Body updates: Map<String, Any>
    )
}

class SleepRepository(private val authToken: String) {
    private val api: SleepApiService
    
    init {
        val retrofit = Retrofit.Builder()
            .baseUrl("https://tu-api.com/api/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        
        api = retrofit.create(SleepApiService::class.java)
    }
    
    suspend fun getPrediction(childId: String): SleepPrediction? {
        return try {
            val response = api.getPrediction(childId, "Bearer $authToken")
            response["prediction"]
        } catch (e: Exception) {
            null
        }
    }
    
    suspend fun recordSleep(childId: String, type: String): String? {
        return try {
            val request = RecordSleepRequest(
                childId = childId,
                type = type,
                startTime = java.time.Instant.now().toString()
            )
            val response = api.recordSleep("Bearer $authToken", request)
            response.sleepEventId
        } catch (e: Exception) {
            null
        }
    }
}

// Jetpack Compose UI
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SleepDashboard(
    childId: String,
    repository: SleepRepository
) {
    var prediction by remember { mutableStateOf<SleepPrediction?>(null) }
    var recordingId by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    
    LaunchedEffect(childId) {
        prediction = repository.getPrediction(childId)
        isLoading = false
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator()
        } else {
            prediction?.nextNap?.let { nextNap ->
                Card {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Próxima Siesta", style = MaterialTheme.typography.headlineSmall)
                        Text(nextNap.time, style = MaterialTheme.typography.displayMedium)
                        Text("Confianza: ${nextNap.confidence}%")
                    }
                }
            }
            
            if (recordingId == null) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            // Iniciar siesta
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Iniciar Siesta")
                    }
                    
                    Button(
                        onClick = {
                            // Dormir noche
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Dormir Noche")
                    }
                }
            } else {
                Text("🔴 Registrando...")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { /* Bien */ }) {
                        Text("Bien 😊")
                    }
                    Button(onClick = { /* Regular */ }) {
                        Text("Regular 😐")
                    }
                    Button(onClick = { /* Malo */ }) {
                        Text("Malo 😔")
                    }
                }
            }
        }
    }
}
```

---

## 🌐 cURL (Testing)

```bash
# Variables
API_URL="https://tu-api.com/api"
TOKEN="tu_token_aqui"
CHILD_ID="child_123"

# 1. Registrar siesta
curl -X POST "$API_URL/sleep/record" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "'$CHILD_ID'",
    "type": "nap",
    "startTime": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "location": "crib"
  }'

# 2. Obtener predicción
curl "$API_URL/sleep/predict/$CHILD_ID" \
  -H "Authorization: Bearer $TOKEN"

# 3. Ver historial
curl "$API_URL/sleep/history/$CHILD_ID?days=7" \
  -H "Authorization: Bearer $TOKEN"

# 4. Análisis detallado
curl "$API_URL/sleep/analysis/$CHILD_ID?days=30" \
  -H "Authorization: Bearer $TOKEN"

# 5. Recordatorios
curl "$API_URL/sleep/reminders/$CHILD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Postman Collection

```json
{
  "info": {
    "name": "Sleep Prediction API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://tu-api.com/api"
    },
    {
      "key": "token",
      "value": "tu_token"
    },
    {
      "key": "childId",
      "value": "child_123"
    }
  ],
  "item": [
    {
      "name": "Record Sleep",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"childId\": \"{{childId}}\",\n  \"type\": \"nap\",\n  \"startTime\": \"{{$isoTimestamp}}\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/sleep/record",
          "host": ["{{baseUrl}}"],
          "path": ["sleep", "record"]
        }
      }
    },
    {
      "name": "Get Prediction",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/sleep/predict/{{childId}}",
          "host": ["{{baseUrl}}"],
          "path": ["sleep", "predict", "{{childId}}"]
        }
      }
    }
  ]
}
```

---

**¡Usa estos ejemplos para integrar rápidamente el sistema de predicción de sueño en tu aplicación! 🚀**

