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

    public enum PackageState
    {
        Unfinished,
        Processing,
        Finished
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
        public string ParametersJson { get; set; }
        public string InputsJson { get; set; }

        public PackageState State { get; set; }
        public byte[] PipelineState { get; set; }
        public string WorkDir { get; set; }
        public ICollection<DataFile> DataFiles { get; set; }

        public ICollection<PackageMetadata> Metadata { get; set; }
        public ICollection<PresentationDevice> IntendedDevices { get; set; }
        public ICollection<PresentationScript> Scripts { get; set; }
    }
}