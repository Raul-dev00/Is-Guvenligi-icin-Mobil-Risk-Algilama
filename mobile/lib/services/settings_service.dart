import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';

class SettingsService {
  static const _apiUrlKey = 'api_base_url';

  static Future<String> getApiBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_apiUrlKey) ?? AppConfig.defaultApiBaseUrl;
  }

  static Future<void> setApiBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_apiUrlKey, url.trim().replaceAll(RegExp(r'/+$'), ''));
  }

  static String healthCheckUrl(String apiBaseUrl) {
    final base = apiBaseUrl.replaceAll(RegExp(r'/+$'), '');
    return '$base/health';
  }
}
