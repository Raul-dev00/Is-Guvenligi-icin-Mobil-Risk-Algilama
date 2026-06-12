import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/api_service.dart';
import '../services/background_service.dart';
import 'login_screen.dart';
import 'settings_screen.dart';

class MonitoringScreen extends StatefulWidget {
  const MonitoringScreen({super.key});

  @override
  State<MonitoringScreen> createState() => _MonitoringScreenState();
}

class _MonitoringScreenState extends State<MonitoringScreen> {
  bool _monitoring = false;
  bool _initializing = true;
  String? _deviceId;
  String? _status;
  DateTime? _lastSent;
  int _sentCount = 0;
  double _magnitude = 0;
  StreamSubscription? _updateSub;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _requestPermissions();
    var deviceId = await ApiService.getDeviceId();
    if (deviceId == null) {
      try {
        final device = await ApiService.registerDevice('Saha Telefonu');
        deviceId = device['id'];
        await ApiService.saveDeviceId(deviceId!);
      } catch (e) {
        setState(() { _status = 'Cihaz kaydı hatası: $e'; });
      }
    }

    final running = await BackgroundServiceManager.isRunning();
    if (running) {
      _monitoring = true;
      _listenToService();
    }

    setState(() {
      _deviceId = deviceId;
      _initializing = false;
    });
  }

  Future<void> _requestPermissions() async {
    final permissions = [
      Permission.location,
      Permission.locationWhenInUse,
      Permission.locationAlways,
      Permission.microphone,
      Permission.sensors,
    ];
    if (Platform.isAndroid) {
      permissions.add(Permission.notification);
    }
    await permissions.request();
  }

  void _listenToService() {
    _updateSub?.cancel();
    _updateSub = BackgroundServiceManager.onUpdate.listen((data) {
      if (data == null || !mounted) return;
      setState(() {
        _sentCount = data['sentCount'] as int? ?? _sentCount;
        _status = data['lastStatus'] as String? ?? _status;
        _magnitude = (data['magnitude'] as num?)?.toDouble() ?? _magnitude;
        final last = data['lastSent'] as String?;
        if (last != null) _lastSent = DateTime.tryParse(last);
      });
    });
  }

  Future<void> _toggleMonitoring() async {
    if (_monitoring) {
      await BackgroundServiceManager.stop();
      _updateSub?.cancel();
      setState(() {
        _monitoring = false;
        _status = 'İzleme durduruldu';
      });
    } else {
      await BackgroundServiceManager.start();
      _listenToService();
      setState(() {
        _monitoring = true;
        _status = 'İzleme aktif';
      });
    }
  }

  Future<void> _logout() async {
    if (_monitoring) await BackgroundServiceManager.stop();
    _updateSub?.cancel();
    await ApiService.clearToken();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  void dispose() {
    _updateSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_initializing) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saha İzleme'),
        backgroundColor: const Color(0xFF1A2332),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            ),
          ),
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              color: _monitoring ? Colors.green.shade50 : Colors.grey.shade100,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Icon(
                      _monitoring ? Icons.sensors : Icons.sensors_off,
                      size: 48,
                      color: _monitoring ? Colors.green : Colors.grey,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _monitoring ? 'İzleme Aktif' : 'İzleme Kapalı',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    if (_monitoring) ...[
                      const SizedBox(height: 4),
                      const Text(
                        'Arka planda çalışıyor — bildirim çubuğunu kontrol edin',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                    if (_status != null) ...[
                      const SizedBox(height: 4),
                      Text(_status!, style: const TextStyle(color: Colors.grey)),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _infoTile('Cihaz ID', _deviceId ?? '—'),
            _infoTile('Son Gönderim', _lastSent?.toLocal().toString().substring(11, 19) ?? '—'),
            _infoTile('Gönderim Sayısı', '$_sentCount'),
            _infoTile('İvme Büyüklüğü', '${_magnitude.toStringAsFixed(2)} m/s²'),
            const Spacer(),
            FilledButton.icon(
              onPressed: _deviceId != null ? _toggleMonitoring : null,
              icon: Icon(_monitoring ? Icons.stop : Icons.play_arrow),
              label: Text(_monitoring ? 'İzlemeyi Durdur' : 'İzlemeyi Başlat'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: _monitoring ? Colors.red : Colors.green,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Sensörler: ivmeölçer, GPS, mikrofon, ağ durumu',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Flexible(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500), textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}
