using Android.App;
using Android.Content;
using Android.OS;
using AndroidX.Core.App;
using HealthSafety.Services.Interfaces;

namespace HealthSafety.Platforms.Android
{
    [Service(ForegroundServiceType = global::Android.Content.PM.ForegroundService.TypeLocation)]
    public class SafetyForegroundService : Service
    {
        private const string ChannelId = "HealthSafetyChannel";
        private const int NotificationId = 10001;

        public override IBinder OnBind(Intent intent)
        {
            return null;
        }

        public override StartCommandResult OnStartCommand(Intent intent, StartCommandFlags flags, int startId)
        {
            CreateNotificationChannel();

            var mainActivityIntent = new Intent(this, typeof(MainActivity));

            var pendingIntentFlags = Build.VERSION.SdkInt >= BuildVersionCodes.S
                ? PendingIntentFlags.UpdateCurrent | PendingIntentFlags.Immutable
                : PendingIntentFlags.UpdateCurrent;

            var pendingIntent = PendingIntent.GetActivity(this, 0, mainActivityIntent, pendingIntentFlags);

            var notification = new NotificationCompat.Builder(this, ChannelId)
                .SetContentTitle("Sistem Aktif")
                .SetContentText("Sistem çalışıyor ve güvendesiniz.")
                .SetSmallIcon(HealthSafety.Resource.Mipmap.appicon) 
                .SetOngoing(true)
                .SetContentIntent(pendingIntent) 
                .Build();

            StartForeground(NotificationId, notification);

            var sensorService = IPlatformApplication.Current.Services.GetService<ISensorService>();
            if (sensorService != null && !sensorService.IsMonitoring)
            {
                MainThread.BeginInvokeOnMainThread(() =>
                {
                    sensorService.StartMonitoring();
                });
            }

            return StartCommandResult.Sticky;
        }

        public override void OnDestroy()
        {
            var sensorService = IPlatformApplication.Current.Services.GetService<ISensorService>();
            sensorService?.StopMonitoring();
            base.OnDestroy();
        }

        private void CreateNotificationChannel()
        {
            if (Build.VERSION.SdkInt >= BuildVersionCodes.O)
            {
                var channel = new NotificationChannel(ChannelId, "İş Güvenliği Sistemi", NotificationImportance.Low)
                {
                    Description = "Sensörleri arka planda izler."
                };

                var notificationManager = (NotificationManager)GetSystemService(NotificationService);
                notificationManager.CreateNotificationChannel(channel);
            }
        }
    }
}