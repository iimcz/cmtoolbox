using System;
using System.Collections.Generic;

namespace backend.Models
{
    public class UnfinishedPackage : PresentationPackage
    {
        public byte[] PipelineState { get; set; }
        public string WorkDir { get; set; }


        public ICollection<DataFile> DataFiles { get; set; }

        public PresentationPackage GenerateFinished()
        {
            var clone = new PresentationPackage()
            {
                Name = this.Name,
                Description = this.Description,
                Created = this.Created,
                Creator = this.Creator,
                IntendedDevices = this.IntendedDevices,
                LastEdited = this.LastEdited,
                LastEditedBy = this.LastEditedBy,
                Scripts = this.Scripts,
                Type = this.Type
            };
            clone.Metadata = new List<PackageMetadata>();
            if (Metadata != null)
            {
                foreach (var meta in Metadata)
                {
                    clone.Metadata.Add(new PackageMetadata { Key = meta.Key, Value = meta.Value });
                }
            }

            return clone;
        }
    }
}