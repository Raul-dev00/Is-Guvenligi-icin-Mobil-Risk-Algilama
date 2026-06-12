using System.ComponentModel;
using System.Windows.Input;
using HealthSafety.Helpers;
using HealthSafety.Models;
using HealthSafety.Services.Api;
using HealthSafety.Services.Storage;
using Microsoft.Maui.Networking; // ضروري جداً لمراقبة حالة الإنترنت

namespace HealthSafety.ViewModels
{
    public class MainViewModel : INotifyPropertyChanged
    {
        private readonly DatabaseService _databaseService;
        private readonly ApiService _apiService;

        // حالة النظام الأساسية
        private string _statusText = "Sistem Beklemede"; // النظام في وضع الاستعداد
        private bool _isMonitoring = false;

        // حالة شبكة الإنترنت
        private string _networkStatusText;
        private Color _networkColor;

        public event PropertyChangedEventHandler PropertyChanged;

        public string StatusText
        {
            get => _statusText;
            set { _statusText = value; OnPropertyChanged(nameof(StatusText)); }
        }

        public bool IsMonitoring
        {
            get => _isMonitoring;
            set { _isMonitoring = value; OnPropertyChanged(nameof(IsMonitoring)); }
        }

        public string NetworkStatusText
        {
            get => _networkStatusText;
            set { _networkStatusText = value; OnPropertyChanged(nameof(NetworkStatusText)); }
        }

        public Color NetworkColor
        {
            get => _networkColor;
            set { _networkColor = value; OnPropertyChanged(nameof(NetworkColor)); }
        }

        // أوامر الأزرار
        public ICommand StartCommand { get; }
        public ICommand StopCommand { get; }
        public ICommand SosCommand { get; }

        public MainViewModel(DatabaseService databaseService, ApiService apiService)
        {
            _databaseService = databaseService;
            _apiService = apiService;

            StartCommand = new Command(StartSystemAsync);
            StopCommand = new Command(StopSystem);
            SosCommand = new Command(TriggerSosAsync);

            // 1. فحص حالة الإنترنت فور فتح التطبيق
            UpdateNetworkStatus(Connectivity.Current.NetworkAccess);

            // 2. الاستماع المباشر (مراقبة) لتغيرات الشبكة
            Connectivity.Current.ConnectivityChanged += Connectivity_ConnectivityChanged;
        }

        private async void Connectivity_ConnectivityChanged(object sender, ConnectivityChangedEventArgs e)
        {
            UpdateNetworkStatus(e.NetworkAccess);

            // إذا عاد الإنترنت، قم بعملية المزامنة فوراً لإرسال الإنذارات العالقة
            if (e.NetworkAccess == NetworkAccess.Internet)
            {
                await _apiService.SyncPendingDataAsync();
            }
        }

        private void UpdateNetworkStatus(NetworkAccess access)
        {
            if (access == NetworkAccess.Internet)
            {
                NetworkStatusText = "İnternet Bağlantısı: VAR"; // يوجد اتصال
                NetworkColor = Color.FromArgb("#28a745"); // أخضر
            }
            else
            {
                NetworkStatusText = "Çevrimdışı (Veriler Cihaza Kaydediliyor)"; // غير متصل - يتم حفظ البيانات في الجهاز
                NetworkColor = Color.FromArgb("#dc3545"); // أحمر
            }
        }

        private async void StartSystemAsync()
        {
            try
            {
                // 1. التحقق وطلب إذن الموقع
                var locationStatus = await Permissions.CheckStatusAsync<Permissions.LocationWhenInUse>();
                if (locationStatus != PermissionStatus.Granted)
                {
                    locationStatus = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
                }

                if (locationStatus != PermissionStatus.Granted)
                {
                    StatusText = "Konum izni gerekli!"; // إذن الموقع مطلوب
                    return;
                }

                // 2. التحقق وطلب إذن الإشعارات (متطلب إلزامي في أندرويد 13+)
                if (DeviceInfo.Platform == DevicePlatform.Android && DeviceInfo.Version.Major >= 13)
                {
                    var notifyStatus = await Permissions.CheckStatusAsync<Permissions.PostNotifications>();
                    if (notifyStatus != PermissionStatus.Granted)
                    {
                        notifyStatus = await Permissions.RequestAsync<Permissions.PostNotifications>();
                    }

                    if (notifyStatus != PermissionStatus.Granted)
                    {
                        StatusText = "Bildirim izni reddedildi!"; // تم رفض إذن الإشعارات
                        return;
                    }
                }

                // 3. تشغيل الخدمة الأمامية بعد ضمان كافة الصلاحيات
                ForegroundServiceManager.StartService();
                IsMonitoring = true;
                StatusText = "Sistem Aktif - İzleniyor"; // النظام نشط - قيد المراقبة
            }
            catch (Exception ex)
            {
                StatusText = "Hata: " + ex.Message;
            }
        }

        private void StopSystem()
        {
            ForegroundServiceManager.StopService();
            IsMonitoring = false;
            StatusText = "Sistem Durduruldu"; // تم إيقاف النظام
        }

        private async void TriggerSosAsync()
        {
            // إنشاء سجل إنذار بأعلى درجات الخطورة عند ضغط العامل على زر الطوارئ
            var alert = new AlertEvent
            {
                EventType = "Manuel SOS Bildirimi", // إشعار طوارئ يدوي
                SeverityScore = 100, // أقصى درجة خطورة
                Timestamp = DateTime.UtcNow,
                IsSynced = false
            };

            // الحفظ المحلي أولاً (ضمان عدم ضياع البيانات)
            await _databaseService.SaveAlertAsync(alert);
            StatusText = "SOS GÖNDERİLDİ!"; // تم إرسال الطوارئ

            // محاولة الإرسال الفوري للخادم فقط إذا كان هناك إنترنت متاح حالياً
            if (Connectivity.Current.NetworkAccess == NetworkAccess.Internet)
            {
                await _apiService.SendAlertAsync(alert);
            }
        }

        protected void OnPropertyChanged(string propertyName) =>
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}