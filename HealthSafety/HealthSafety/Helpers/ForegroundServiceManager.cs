namespace HealthSafety.Helpers
{
    public static class ForegroundServiceManager
    {
        public static void StartService()
        {
#if ANDROID
            MainThread.BeginInvokeOnMainThread(() =>
            {
                var context = global::Android.App.Application.Context;
                var intent = new global::Android.Content.Intent(context, typeof(Platforms.Android.SafetyForegroundService));
                
                if (global::Android.OS.Build.VERSION.SdkInt >= global::Android.OS.BuildVersionCodes.O)
                {
                    context.StartForegroundService(intent);
                }
                else
                {
                    context.StartService(intent);
                }
            });
#endif
        }

        public static void StopService()
        {
#if ANDROID
            var context = global::Android.App.Application.Context;
            var intent = new global::Android.Content.Intent(context, typeof(Platforms.Android.SafetyForegroundService));
            context.StopService(intent);
#endif
        }
    }
}