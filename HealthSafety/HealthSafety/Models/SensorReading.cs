using SQLite;
using System;
using System.Collections.Generic;
using System.Text;

namespace HealthSafety.Models
{
    public class SensorReading
    {
        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }

        // بيانات مقياس التسارع
        public double AccelX { get; set; }
        public double AccelY { get; set; }
        public double AccelZ { get; set; }

        // بيانات الموقع
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public DateTime Timestamp { get; set; }

        // علامة لمعرفة ما إذا تم إرسال البيانات للخادم أم لا
        public bool IsSynced { get; set; }
    }
}
