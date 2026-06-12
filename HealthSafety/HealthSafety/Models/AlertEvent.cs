using SQLite;
using System;
using System.Collections.Generic;
using System.Text;

namespace HealthSafety.Models
{
    public class AlertEvent
    {
        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }

        // نوع الخطر: سقوط، سكون، دخول منطقة محظورة
        public string EventType { get; set; }

        // درجة الخطورة (Risk Score)
        public int SeverityScore { get; set; }

        public DateTime Timestamp { get; set; }
        public bool IsSynced { get; set; }
    }
}
