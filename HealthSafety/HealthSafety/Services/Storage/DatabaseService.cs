using HealthSafety.Models;
using SQLite;
using System;
using System.Collections.Generic;
using System.Text;

namespace HealthSafety.Services.Storage
{
    public class DatabaseService
    {
        private SQLiteAsyncConnection _database;
        private readonly string _dbPath;

        public DatabaseService()
        {
            // تحديد مسار حفظ قاعدة البيانات داخل الهاتف
            _dbPath = Path.Combine(FileSystem.AppDataDirectory, "SafetyData.db3");
        }

        private async Task InitAsync()
        {
            if (_database != null)
                return;

            _database = new SQLiteAsyncConnection(_dbPath);

            // إنشاء الجداول بناءً على النماذج
            await _database.CreateTableAsync<SensorReading>();
            await _database.CreateTableAsync<AlertEvent>();
        }

        // حفظ قراءة جديدة للحساسات
        public async Task<int> SaveReadingAsync(SensorReading reading)
        {
            await InitAsync();
            return await _database.InsertAsync(reading);
        }

        // حفظ إنذار جديد
        public async Task<int> SaveAlertAsync(AlertEvent alert)
        {
            await InitAsync();
            return await _database.InsertAsync(alert);
        }

        // جلب البيانات التي لم يتم مزامنتها مع الخادم (لإرسالها عند عودة الإنترنت)
        public async Task<List<SensorReading>> GetUnsyncedReadingsAsync()
        {
            await InitAsync();
            return await _database.Table<SensorReading>().Where(r => !r.IsSynced).ToListAsync();
        }

        public async Task<List<AlertEvent>> GetUnsyncedAlertsAsync()
        {
            await InitAsync();
            return await _database.Table<AlertEvent>().Where(a => !a.IsSynced).ToListAsync();
        }

        // تحديث حالة السجل بعد إرساله للخادم بنجاح
        public async Task<int> UpdateAlertAsync(AlertEvent alert)
        {
            await InitAsync();
            return await _database.UpdateAsync(alert);
        }
    }
}
