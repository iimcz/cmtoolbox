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
            var clone = MemberwiseClone() as PresentationPackage;
            clone.Id = 0;
            return clone;
        }
    }
}