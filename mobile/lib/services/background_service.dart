import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'background_sensor_handler.dart';

class BackgroundServiceManager {
  static final _notifications = FlutterLocalNotificationsPlugin();
  static const _channelId = 'isg_risk_channel';
  static const _notificationId = 888;

  static Future<void> initialize() async {
    await _initNotifications();

    final service = FlutterBackgroundService();
    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false,
        isForegroundMode: true,
        notificationChannelId: _channelId,
        initialNotificationTitle: 'ISG Risk',
        initialNotificationContent: 'İzleniyor',
        foregroundServiceNotificationId: _notificationId,
        foregroundServiceTypes: [AndroidForegroundType.location],
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
    );
  }

  static Future<void> _initNotifications() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: android);
    await _notifications.initialize(settings);

    const channel = AndroidNotificationChannel(
      _channelId,
      'ISG Risk İzleme',
      description: 'Saha izleme foreground servisi',
      importance: Importance.low,
    );

    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  static Future<void> start() async {
    final service = FlutterBackgroundService();
    final isRunning = await service.isRunning();
    if (!isRunning) {
      await service.startService();
    }
  }

  static Future<void> stop() async {
    final service = FlutterBackgroundService();
    service.invoke('stop');
  }

  static Stream<Map<String, dynamic>?> get onUpdate {
    return FlutterBackgroundService().on('update').map((e) {
      if (e == null) return null;
      return Map<String, dynamic>.from(e);
    });
  }

  static Future<bool> isRunning() => FlutterBackgroundService().isRunning();
}

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final handler = BackgroundSensorHandler();
  final notifications = FlutterLocalNotificationsPlugin();

  if (service is AndroidServiceInstance) {
    service.on('setAsForeground').listen((_) {
      service.setAsForegroundService();
    });
    service.setAsForegroundService();
  }

  service.on('stop').listen((_) {
    handler.stop();
    service.stopSelf();
  });

  void updateNotification(String content) {
    if (service is AndroidServiceInstance) {
      service.setForegroundNotificationInfo(
        title: 'ISG Risk — İzleniyor',
        content: content,
      );
    }
    notifications.show(
      BackgroundServiceManager._notificationId,
      'ISG Risk — İzleniyor',
      content,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          BackgroundServiceManager._channelId,
          'ISG Risk İzleme',
          icon: '@mipmap/ic_launcher',
          ongoing: true,
        ),
      ),
    );
  }

  updateNotification('Sensör verisi toplanıyor...');

  handler.start((status) {
    service.invoke('update', status);
    final count = status['sentCount'] ?? 0;
    final last = status['lastStatus'] ?? '';
    updateNotification('Gönderim: $count | $last');
  });
}
