namespace backend.Models
{
    public enum SensorType
    {
        Skeletal,
        Pir,
        Distance,
        Light,
        GenericValue
    }

    public class DeviceSensor
    {
        public int Id { get; set; }
        public SensorType Type { get; set; }

        public int DeviceId { get; set; }
        public PresentationDevice Device { get; set; }
    }
}