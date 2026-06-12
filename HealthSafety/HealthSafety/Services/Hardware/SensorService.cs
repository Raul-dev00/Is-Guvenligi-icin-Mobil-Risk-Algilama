using HealthSafety.Helpers;
using HealthSafety.Models;
using HealthSafety.Services.Api;
using HealthSafety.Services.Interfaces;
using HealthSafety.Services.Storage;
using Microsoft.Maui.Devices.Sensors;

namespace HealthSafety.Services.Hardware
{
    public class SensorService : ISensorService
    {
        private readonly DatabaseService _databaseService;
        private readonly ApiService _apiService;
        public bool IsMonitoring { get; private set; }

        private bool _isLocationTrackingActive;
        private const double HardImpactThreshold = 3.5;

        // إحداثيات افتراضية لمنطقة خطرة (مثلاً: مستودع مواد كيميائية)
        // في النظام الحقيقي، هذه البيانات سيتم جلبها من خادم Node.js
        private const double HazardZoneLat = 40.2000;
        private const double HazardZoneLon = 29.0000;
        private const double HazardRadiusMeters = 50.0; // الخطر يكمن في دائرة نصف قطرها 50 متراً

        public SensorService(DatabaseService databaseService, ApiService apiService)
        {
            _databaseService = databaseService;
            _apiService = apiService;
        }

        public void StartMonitoring()
        {
            if (!IsMonitoring)
            {
                IsMonitoring = true;

                // 1. تشغيل مراقبة التسارع (للسقوط والصدمات)
                if (Accelerometer.Default.IsSupported)
                {
                    Accelerometer.Default.ReadingChanged += Accelerometer_ReadingChanged;
                    Accelerometer.Default.Start(SensorSpeed.UI);
                }

                // 2. تشغيل المراقبة المكانية المستمرة (Geofencing)
                StartLocationTrackingAsync();
            }
        }

        public void StopMonitoring()
        {
            if (IsMonitoring)
            {
                IsMonitoring = false;
                _isLocationTrackingActive = false;

                if (Accelerometer.Default.IsSupported)
                {
                    Accelerometer.Default.ReadingChanged -= Accelerometer_ReadingChanged;
                    Accelerometer.Default.Stop();
                }
            }
        }

        private async void StartLocationTrackingAsync()
        {
            _isLocationTrackingActive = true;

            // حلقة تعمل في الخلفية طوال فترة نشاط النظام
            while (_isLocationTrackingActive)
            {
                try
                {
                    // طلب الإحداثيات بدقة متوسطة للحفاظ على استهلاك البطارية
                    var request = new GeolocationRequest(GeolocationAccuracy.Medium, TimeSpan.FromSeconds(5));
                    var location = await Geolocation.Default.GetLocationAsync(request);

                    if (location != null)
                    {
                        // استخدام معادلة هافرسين التي كتبناها لحساب المسافة
                        double distanceToHazard = MathUtils.CalculateDistance(
                            location.Latitude, location.Longitude,
                            HazardZoneLat, HazardZoneLon);

                        // إذا كانت المسافة المحسوبة أقل من نصف قطر الخطر
                        if (distanceToHazard <= HazardRadiusMeters)
                        {
                            await HandleZoneViolationAsync(distanceToHazard);
                        }
                    }
                }
                catch (Exception)
                {
                    // تجاهل الأخطاء المؤقتة لانقطاع إشارة الـ GPS
                }

                // الانتظار لمدة 15 ثانية قبل فحص الموقع مرة أخرى (Polling Rate)
                await Task.Delay(15000);
            }
        }

        private async Task HandleZoneViolationAsync(double currentDistance)
        {
            // توثيق الانتهاك الأمني
            var alert = new AlertEvent
            {
                EventType = $"Tehlikeli Bölge İhlali ({Math.Round(currentDistance, 1)}m mesafe)", // انتهاك منطقة خطرة
                SeverityScore = 75, // درجة خطورة مرتفعة
                Timestamp = DateTime.UtcNow,
                IsSynced = false
            };

            await _databaseService.SaveAlertAsync(alert);

            // إيقاف التتبع لمدة دقيقتين لتجنب إغراق قاعدة البيانات بآلاف الإنذارات لنفس الحادثة
            await Task.Delay(TimeSpan.FromMinutes(2));
        }

        private async void Accelerometer_ReadingChanged(object sender, AccelerometerChangedEventArgs e)
        {
            var data = e.Reading;
            double gForce = Math.Sqrt(Math.Pow(data.Acceleration.X, 2) +
                                      Math.Pow(data.Acceleration.Y, 2) +
                                      Math.Pow(data.Acceleration.Z, 2));

            if (gForce > HardImpactThreshold)
            {
                // إيقاف مؤقت لمنع التكرار
                if (Accelerometer.Default.IsSupported)
                    Accelerometer.Default.Stop();

                var alert = new AlertEvent
                {
                    EventType = "Sert Darbe / Düşme", // صدمة قوية / سقوط
                    SeverityScore = 90,
                    Timestamp = DateTime.UtcNow,
                    IsSynced = false
                };

                await _databaseService.SaveAlertAsync(alert);

                // حفظ الإنذار في قاعدة البيانات المحلية (SQLite)
                await _databaseService.SaveAlertAsync(alert);

                // محاولة إرسال الإنذار الفوري للخادم
                await _apiService.SendAlertAsync(alert);

                await Task.Delay(5000);
                if (IsMonitoring && Accelerometer.Default.IsSupported)
                    Accelerometer.Default.Start(SensorSpeed.UI);
            }
        }
    }
}