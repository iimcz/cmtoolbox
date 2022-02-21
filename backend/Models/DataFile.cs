using System.Text.Json.Serialization;

namespace backend.Models
{
    public class DataFile
    {
        public int Id { get; set; }
        public string Path { get; set; }
        public string ThumbnailPath { get; set; }
        public string PreviewPath { get; set; }

        [JsonIgnore]
        public PresentationPackage Package { get; set; }
    }
}