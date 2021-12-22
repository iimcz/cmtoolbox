using System.Collections.Generic;
using System.Threading.Tasks;
using System.Xml;
using Microsoft.AspNetCore.Http;

namespace backend.Utilities
{
    public static class MetadataHelpers
    {
        private class MODSMapping
        {
            public string MetaKey { get; set; }
            public string XPath { get; set; }
        }

        private static readonly MODSMapping[] MetaToMods = new MODSMapping[] {
            new MODSMapping { MetaKey = "abstract", XPath = "abstract" },
            new MODSMapping { MetaKey = "date", XPath = "originInfo/dateCreated" },
            new MODSMapping { MetaKey = "language", XPath = "language/languageTerm" },
            new MODSMapping { MetaKey = "edition", XPath = "originInfo/edition" },
            new MODSMapping { MetaKey = "place", XPath = "originInfo/place" },
            new MODSMapping { MetaKey = "publisher", XPath = "originInfo/publisher" },
            new MODSMapping { MetaKey = "length", XPath = "physicalDescription/extent" },
            new MODSMapping { MetaKey = "form", XPath = "physicalDescription/form" },
            new MODSMapping { MetaKey = "note", XPath = "physicalDescription/note" },
            new MODSMapping { MetaKey = "part_name", XPath = "titleInfo/partName" },
            new MODSMapping { MetaKey = "description", XPath = "titleInfo/title" },
            new MODSMapping { MetaKey = "topic", XPath = "subject/topic" },
            new MODSMapping { MetaKey = "type", XPath = "typeOfResource" }
        };

        public static Dictionary<string, string> ParseMODSFile(IFormFile file)
        {
            var metadata = new Dictionary<string, string>();

            XmlDocument doc = new XmlDocument();
            using (var stream = file.OpenReadStream())
            {
                doc.Load(stream);
            }

            string xpathBase = "/mods";
            foreach (var mapping in MetaToMods)
            {
                var node = doc.SelectSingleNode(string.Format("{0}/{1}", xpathBase, mapping.XPath));
                if (node != null)
                {
                    metadata.Add(mapping.MetaKey, node.Value);
                }
            }

            return metadata;
        }

        public static Dictionary<string, string> ParseMuzeionFile(IFormFile file)
        {
            var metadata = new Dictionary<string, string>();

            // TODO: parse

            return metadata;
        }
    }
}