import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'settings_service.dart';

class ApiService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _deviceIdKey = 'device_id';

  static Future<String?> getToken() => _storage.read(key: _tokenKey);
  static Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);
  static Future<void> clearToken() => _storage.delete(key: _tokenKey);

  static Future<String?> getDeviceId() => _storage.read(key: _deviceIdKey);
  static Future<void> saveDeviceId(String id) => _storage.write(key: _deviceIdKey, value: id);

  static Future<String> getApiBaseUrl() => SettingsService.getApiBaseUrl();

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final baseUrl = await getApiBaseUrl();
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode != 200) {
      final body = jsonDecode(res.body);
      throw Exception(body['error'] ?? 'Giriş başarısız');
    }
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> registerDevice(String deviceName) async {
    final baseUrl = await getApiBaseUrl();
    final res = await http.post(
      Uri.parse('$baseUrl/devices/register'),
      headers: await _headers(),
      body: jsonEncode({
        'deviceName': deviceName,
        'platform': 'flutter',
      }),
    );
    if (res.statusCode != 201) {
      final body = jsonDecode(res.body);
      throw Exception(body['error'] ?? 'Cihaz kaydı başarısız');
    }
    return jsonDecode(res.body);
  }

  static Future<void> sendSensorData(String deviceId, List<Map<String, dynamic>> readings) async {
    final baseUrl = await getApiBaseUrl();
    final res = await http.post(
      Uri.parse('$baseUrl/sensor-data'),
      headers: await _headers(),
      body: jsonEncode({'deviceId': deviceId, 'readings': readings}),
    );
    if (res.statusCode != 201) {
      final body = jsonDecode(res.body);
      throw Exception(body['error'] ?? 'Veri gönderimi başarısız');
    }
  }

  static Future<bool> testConnection() async {
    final baseUrl = await getApiBaseUrl();
    final url = SettingsService.healthCheckUrl(baseUrl);
    final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 5));
    if (res.statusCode != 200) return false;
    final body = jsonDecode(res.body);
    return body['status'] == 'ok';
  }
}
