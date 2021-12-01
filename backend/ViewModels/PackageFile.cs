using System;

namespace backend.ViewModels
{
    public class PackageFile
    {
        public Guid ID { get; set; }
        // package reference?

        public PackageFile(Guid id)
        {
            ID = id;
        }
    }
}