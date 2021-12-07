using System;

namespace backend.ViewModels
{
    public class PackageFile
    {
        public int ID { get; set; }
        public string Filename { get; set; }

        public PackageFile(int id, string filename)
        {
            ID = id;
            Filename = filename;
        }
    }
}