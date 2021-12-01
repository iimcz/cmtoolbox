using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class PresentationDevice
    {
        public int Id { get; set; }
        public string DeviceName { get; set; }
        public string DeviceShort { get; set; }

        public ICollection<DeviceSensor> Sensors { get; set; }
        public ICollection<PresentationPackage> Packages { get; set; }
    }
}