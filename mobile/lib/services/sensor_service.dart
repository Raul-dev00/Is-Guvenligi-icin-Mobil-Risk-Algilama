import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:geolocator/geolocator.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:noise_meter/noise_meter.dart';
import 'package:permission_handler/permission_handler.dart';

class SensorService {
  StreamSubscription? _accelSub;
  StreamSubscription? _noiseSub;
  Timer? _sendTimer;

  double _accelX = 0, _accelY = 0, _accelZ = 0;
  double _decibels = 0;
  Position? _position;
  bool _networkConnected = true;
  String _networkType = 'unknown';

  final _noiseMeter = NoiseMeter();

  Future<bool> requestPermissions() async {
    final statuses = await [
      Permission.location,
      Permission.locationWhenInUse,
      Permission.microphone,
      Permission.sensors,
    ].request();

    return statuses.values.every((s) => s.isGranted || s.isLimited);
  }

  Future<void> _updateGps() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;
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

  void startCollecting({
    required void Function(List<Map<String, dynamic>> readings) onReadings,
    Duration interval = const Duration(seconds: 3),
  }) {
    _accelSub = accelerometerEventStream().listen((event) {
      _accelX = event.x;
      _accelY = event.y;
      _accelZ = event.z;
    });

    if (!Platform.isLinux) {
      try {
        _noiseSub = _noiseMeter.noise.listen((reading) {
          _decibels = reading.meanDecibel;
        });
      } catch (_) {
        _decibels = 50 + Random().nextDouble() * 10;
      }
    }

    _sendTimer = Timer.periodic(interval, (_) async {
      await _updateGps();
      await _updateNetwork();
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

      readings.add({
        'sensorType': 'microphone',
        'payload': {'decibels': _decibels},
        'recordedAt': now,
      });

      onReadings(readings);
    });
  }

  void stopCollecting() {
    _accelSub?.cancel();
    _noiseSub?.cancel();
    _sendTimer?.cancel();
  }

  double get currentMagnitude =>
      sqrt(_accelX * _accelX + _accelY * _accelY + _accelZ * _accelZ);
}
