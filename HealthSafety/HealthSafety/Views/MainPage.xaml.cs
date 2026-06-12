using HealthSafety.ViewModels;

namespace HealthSafety.Views
{
    public partial class MainPage : ContentPage
    {
        public MainPage(MainViewModel viewModel)
        {
            InitializeComponent();
            BindingContext = viewModel; // ربط الواجهة الرسومية بمنطق العمل
        }
    }
}