using System.Globalization;

namespace HealthSafety.Converters
{
    public class InverseBoolConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            // تحويل القيمة إلى عكسها (إذا كانت True تصبح False)
            if (value is bool booleanValue)
                return !booleanValue;

            return false;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is bool booleanValue)
                return !booleanValue;

            return false;
        }
    }
}