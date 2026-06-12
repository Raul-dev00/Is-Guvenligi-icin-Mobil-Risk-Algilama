namespace HealthSafety.Services.Interfaces
{
    public interface ISensorService
    {
        void StartMonitoring();
        void StopMonitoring();
        bool IsMonitoring { get; }
    }
}