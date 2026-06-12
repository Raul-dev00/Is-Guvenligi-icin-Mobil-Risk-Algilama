using Microsoft.Extensions.Logging;

namespace HealthSafety
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            var builder = MauiApp.CreateBuilder();
            builder
                .UseMauiApp<App>()
                .ConfigureFonts(fonts =>
                {
                    fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                    fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
                });

            builder.Services.AddSingleton<Services.Storage.DatabaseService>();
            builder.Services.AddSingleton<Services.Interfaces.ISensorService, Services.Hardware.SensorService>();
            builder.Services.AddTransient<ViewModels.MainViewModel>();
            builder.Services.AddTransient<Views.MainPage>();
            builder.Services.AddSingleton<Services.Api.ApiService>();

#if DEBUG
            builder.Logging.AddDebug();
#endif

            return builder.Build();
        }
    }
}
