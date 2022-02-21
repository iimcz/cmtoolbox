using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using Guidepipe.IO;
using Guidepipe.Pipelines;
using Guidepipe.Steps;
using Microsoft.Extensions.Configuration;
using Naki3D.Common.Json;

namespace backend.Utilities
{
    public static class PackageUtils
    {
        // TODO: proper schema location
        private static readonly string PACKAGE_DESCRIPTOR_SCHEMA = "https://www.iim.cz/package-schema.json";

        public static async Task FinishProcessingVideoPackage(PresentationPackage package, string dataDir, IConfiguration config)
        {
            var videoFile = package.DataFiles.FirstOrDefault();
            if (videoFile == null)
                return;

            var videoFilePath = new FilePath(videoFile.Path);

            var checkPipeline = ConversionPipelines.ConstructVideoCheckPipeline(videoFile.Path, config);
            bool shouldConvert = ! await checkPipeline.ExecuteAsync(videoFilePath);

            if (shouldConvert)
            {
                var pipeline = ConversionPipelines.ConstructVideoProcessPipeline(videoFile.Path, null, config);

                using (var stream = new MemoryStream(package.PipelineState))
                    pipeline.LoadState(stream);

                await pipeline.ExecuteAsync(videoFilePath);
            }
        }

        public static async Task WritePackageJsonAsync(PresentationPackage package, TextWriter writer, string packageFilePath, string packageUrl)
        {
            bool shouldGenerateHash = packageFilePath != null && packageUrl != null;

            PackageDescriptor packageDescriptor = new PackageDescriptor();
            packageDescriptor.Schema = PACKAGE_DESCRIPTOR_SCHEMA;
            packageDescriptor.Version = "N/A"; // TODO: version?

            packageDescriptor.Inputs = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Naki3D.Common.Json.Action>>(package.InputsJson, Naki3D.Common.Json.Converter.Settings);
            packageDescriptor.Parameters = Newtonsoft.Json.JsonConvert.DeserializeObject<Parameters>(package.ParametersJson, Naki3D.Common.Json.Converter.Settings);

            packageDescriptor.Metadata = new Metadata
            {
                PackageName = package.Name,
                Description = package.Description,
                Author = package.Metadata.FirstOrDefault(m => m.Key == "author")?.Value,
                Exposition = package.Metadata.FirstOrDefault(m => m.Key == "expo")?.Value,
                Other = package.Metadata.Where(m => m.Key != "author" && m.Key != "expo")
                    .Select(m => new Other { Key = m.Key, Value = m.Value }).ToList()
            };
            if (shouldGenerateHash)
            {
                byte[] hash;
                using (var sha256 = System.Security.Cryptography.SHA256.Create())
                {
                    using (var file = File.OpenRead(packageFilePath))
                    {
                        hash = await sha256.ComputeHashAsync(file);
                    }
                }

                packageDescriptor.Package = new Package
                {
                    Url = new Uri(packageUrl),
                    Checksum = BitConverter.ToString(hash).Replace("-", String.Empty).ToLowerInvariant()
                };
            }
            else
            {
                packageDescriptor.Package = new Package { };
            }

            packageDescriptor.Sync = new Sync();

            await writer.WriteAsync(packageDescriptor.ToJson());
        }
    }
}