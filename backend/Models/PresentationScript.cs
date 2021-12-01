using System.Collections.Generic;

namespace backend.Models
{
    public class ScriptParameter
    {
        public int Id { get; set; }
        public string Key { get; set; }
        public string DefaultValue { get; set; }
    }

    public class PresentationScript
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        

        public ICollection<PresentationPackage> Packages { get; set; }
        public ICollection<DataFile> Files { get; set; }
        public ICollection<ScriptParameter> Parameters { get; set; }
    }
}