namespace HealthSafety.Helpers
{
    public static class MathUtils
    {
        // نصف قطر الأرض التقريبي بالأمتار
        private const double EarthRadiusMeters = 6371000.0;

        public static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // تحويل الدرجات إلى راديان (Radians) للعمل مع الدوال المثلثية
            double dLat = ToRadians(lat2 - lat1);
            double dLon = ToRadians(lon2 - lon1);

            // تطبيق معادلة هافرسين
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            double c = 2 * Math.Asin(Math.Min(1, Math.Sqrt(a)));

            // المسافة النهائية بالأمتار
            return EarthRadiusMeters * c;
        }

        private static double ToRadians(double angle)
        {
            return (Math.PI / 180.0) * angle;
        }
    }
}