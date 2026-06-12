using System.Net.Http.Json;
using System.Text.Json;
using HealthSafety.Models;
using HealthSafety.Services.Storage;

namespace HealthSafety.Services.Api
{
    public class ApiService
    {
        private readonly HttpClient _httpClient;
        private readonly DatabaseService _databaseService;

        private const string BaseUrl = "https://webhook.site/c6066789-9b95-44a7-b5b6-f3314bfc3762";

        public ApiService(DatabaseService databaseService)
        {
            _databaseService = databaseService;

            // إعداد HttpClient مع مهلة زمنية قصيرة لتجنب تجميد التطبيق إذا كان الإنترنت ضعيفاً
            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(7)
            };
        }

       
        public async Task<bool> SendAlertAsync(AlertEvent alert)
        {
            try
            {
                // إرسال البيانات بصيغة JSON باستخدام POST
                var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}/alerts", alert);

                if (response.IsSuccessStatusCode)
                {
                    // إذا استلم الخادم البيانات بنجاح، نُحدث الحالة في قاعدة البيانات المحلية
                    alert.IsSynced = true;
                    await _databaseService.UpdateAlertAsync(alert);
                    return true;
                }
            }
            catch (Exception ex)
            {
                // الخادم مغلق أو لا يوجد إنترنت. 
                // لا مشكلة، البيانات محفوظة محلياً بالفعل وسيتم إرسالها لاحقاً.
                Console.WriteLine($"API Error: {ex.Message}");
            }

            return false;
        }

       
        public async Task SyncPendingDataAsync()
        {
            // جلب كل الإنذارات التي لم يتم إرسالها
            var pendingAlerts = await _databaseService.GetUnsyncedAlertsAsync();

            if (pendingAlerts.Any())
            {
                foreach (var alert in pendingAlerts)
                {
                    await SendAlertAsync(alert);
                }
            }
        }
    }
}