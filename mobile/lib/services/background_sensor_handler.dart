import 'dart:async';
import 'dart:convert';

import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:sensors_plus/sensors_plus.dart';
import 'package:geolocator/geolocator.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'settings_service.dart';

/// Arka plan isolate içinde sensör toplama ve API gönderimi
class BackgroundSensorHandler {
  StreamSubscription? _accelSub;
  Timer? _sendTimer;

  double _accelX = 0, _accelY = 0, _accelZ = 0;
  final double _decibels = 55;
  Position? _position;
  bool _networkConnected = true;
  String _networkType = 'unknown';

  int sentCount = 0;
  String? lastStatus;
  DateTime? lastSent;

  double get currentMagnitude =>
      sqrt(_accelX * _accelX + _accelY * _accelY + _accelZ * _accelZ);

  void start(void Function(Map<String, dynamic>) onUpdate) {
    _accelSub = accelerometerEventStream().listen((event) {
      _accelX = event.x;
      _accelY = event.y;
      _accelZ = event.z;
    });

    _sendTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      await _tick(onUpdate);
    });
  }

  void stop() {
    _accelSub?.cancel();
    _sendTimer?.cancel();
  }

  Future<void> _tick(void Function(Map<String, dynamic>) onUpdate) async {
    try {
      await _updateGps();
      await _updateNetwork();
      final readings = _buildReadings();
      final deviceId = await const FlutterSecureStorage().read(key: 'device_id');
      if (deviceId == null) {
        lastStatus = 'Cihaz kaydı yok';
        onUpdate(_statusPayload());
        return;
      }

      await _sendToApi(deviceId, readings);
      sentCount++;
      lastSent = DateTime.now();
      lastStatus = 'Veri gönderildi';
    } catch (e) {
      lastStatus = 'Hata: $e';
    }
    onUpdate(_statusPayload());
  }

  Map<String, dynamic> _statusPayload() => {
        'sentCount': sentCount,
        'lastStatus': lastStatus,
        'lastSent': lastSent?.toIso8601String(),
        'magnitude': currentMagnitude,
      };

  Future<void> _updateGps() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return;
      _position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
    } catch (_) {}
  }

  Future<void> _updateNetwork() async {
    try {
      final result = await Connectivity().checkConnectivity();
      _networkConnected = !result.contains(ConnectivityResult.none);
      _networkType = result.isNotEmpty ? result.first.name : 'none';
    } catch (_) {
      _networkConnected = false;
    }
  }

  List<Map<String, dynamic>> _buildReadings() {
    final now = DateTime.now().toUtc().toIso8601String();
    final readings = <Map<String, dynamic>>[
      {
        'sensorType': 'accelerometer',
        'payload': {'x': _accelX, 'y': _accelY, 'z': _accelZ},
        'recordedAt': now,
      },
      {
        'sensorType': 'network',
        'payload': {'connected': _networkConnected, 'type': _networkType},
        'recordedAt': now,
      },
      {
        'sensorType': 'microphone',
        'payload': {'decibels': _decibels},
        'recordedAt': now,
      },
    ];

    if (_position != null) {
      readings.add({
        'sensorType': 'gps',
        'payload': {
          'lat': _position!.latitude,
          'lng': _position!.longitude,
          'accuracy': _position!.accuracy,
        },
        'recordedAt': now,
      });
    }
    return readings;
  }

  Future<void> _sendToApi(String deviceId, List<Map<String, dynamic>> readings) async {
    final baseUrl = await SettingsService.getApiBaseUrl();
    final storage = const FlutterSecureStorage();
    final token = await storage.read(key: 'auth_token');

    final res = await http.post(
      Uri.parse('$baseUrl/sensor-data'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'deviceId': deviceId, 'readings': readings}),
    );

    if (res.statusCode != 201) {
      final body = jsonDecode(res.body);
      throw Exception(body['error'] ?? 'Gönderim başarısız (${res.statusCode})');
    }
  }
}
