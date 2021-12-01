using System;
using System.Collections.Generic;

namespace backend.Models
{
    public enum PackageType
    {
        Gallery,
        Video,
        Scene,
        Model
    }

    public class PresentationPackage
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public PackageType Type { get; set; }
        public ToolboxUser Creator { get; set; }
        public ToolboxUser LastEditedBy { get; set; }
        public DateTime Created { get; set; }
        public DateTime LastEdited { get; set; }

        public ICollection<PackageMetadata> Metadata { get; set; }
        public ICollection<PresentationDevice> IntendedDevices { get; set; }
        public ICollection<PresentationScript> Scripts { get; set; }
    }
}