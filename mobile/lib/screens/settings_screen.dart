import 'package:flutter/material.dart';
import '../services/settings_service.dart';
import '../services/api_service.dart';
import '../config.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _urlController = TextEditingController();
  bool _loading = true;
  bool _testing = false;
  String? _message;
  bool _success = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final url = await SettingsService.getApiBaseUrl();
    _urlController.text = url;
    setState(() => _loading = false);
  }

  Future<void> _save() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) {
      setState(() {
        _message = 'URL boş olamaz';
        _success = false;
      });
      return;
    }
    await SettingsService.setApiBaseUrl(url);
    setState(() {
      _message = 'Ayarlar kaydedildi';
      _success = true;
    });
  }

  Future<void> _test() async {
    setState(() {
      _testing = true;
      _message = null;
    });
    try {
      await SettingsService.setApiBaseUrl(_urlController.text.trim());
      final ok = await ApiService.testConnection();
      setState(() {
        _message = ok ? 'Bağlantı başarılı' : 'Bağlantı başarısız';
        _success = ok;
      });
    } catch (e) {
      setState(() {
        _message = 'Bağlantı hatası: $e';
        _success = false;
      });
    } finally {
      setState(() => _testing = false);
    }
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ayarlar'),
        backgroundColor: const Color(0xFF1A2332),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Sunucu Adresi',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                labelText: 'API URL',
                hintText: 'http://192.168.1.10:3000/api',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 8),
            Text(
              'Varsayılan: ${AppConfig.defaultApiBaseUrl}',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Text(
              'Android emülatör: http://10.0.2.2:3000/api\nFiziksel cihaz: http://BILGISAYAR_IP:3000/api',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            if (_message != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _success ? Colors.green.shade50 : Colors.red.shade50,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  _message!,
                  style: TextStyle(color: _success ? Colors.green.shade800 : Colors.red.shade800),
                ),
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _save,
              child: const Text('Kaydet'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _testing ? null : _test,
              child: Text(_testing ? 'Test ediliyor...' : 'Bağlantıyı Test Et'),
            ),
          ],
        ),
      ),
    );
  }
}
