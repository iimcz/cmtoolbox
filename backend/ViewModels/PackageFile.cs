using System;

namespace backend.ViewModels
{
    public class PackageFile
    {
        public int ID { get; set; }
        public string Filename { get; set; }
        public string Thumbnail { get; set; }

        public PackageFile(int id, string filename, string thumbnail)
        {
            ID = id;
            Filename = filename;
            Thumbnail = thumbnail;
        }
    }
}