using System.Text.Json.Serialization;

namespace backend.Models
{
    public enum SensorType
    {
        Skeletal,
        Pir,
        Distance,
        Light,
        Noise,
        GenericValue
    }

    public class DeviceSensor
    {
        public int Id { get; set; }
        public SensorType Type { get; set; }
        public string Name { get; set; }

        public int DeviceId { get; set; }
        
        [JsonIgnore]
        public PresentationDevice Device { get; set; }
    }
}