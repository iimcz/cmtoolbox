using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using backend.ViewModels;
using backend.Extensions;
using backend.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO.Compression;
using Microsoft.AspNetCore.Http;
using Naki3D.Common.Json;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PackagesController : ControllerBase
    {
        ILogger<PackagesController> _logger;
        CMTContext _dbContext;
        EventBus _eventBus;
        IConfiguration _config;
        string _baseWorkDir;
        string _basePackageDir;

        public PackagesController(ILogger<PackagesController> logger, CMTContext dbContext, IConfiguration config, EventBus eventBus)
        {
            _logger = logger;
            _dbContext = dbContext;
            _eventBus = eventBus;
            _config = config;

            _baseWorkDir = config.GetSection("UnfinishedPackages").GetValue<string>("BaseWorkDir");
            _basePackageDir = config.GetSection("Packages").GetValue<string>("BaseStorageDir");
        }

        [HttpGet("all")]
        public IEnumerable<PresentationPackage> GetPackages() =>
            _dbContext.PresentationPackages.Where(p => p.State != PackageState.Unfinished).ToList();

        [HttpGet("single/{id}")]
        public async Task<ActionResult<PresentationPackage>> GetPackage(int id)
        {
            var package = await _dbContext.PresentationPackages
                .Include(p => p.Metadata)
                .SingleOrDefaultAsync(p => p.Id == id);
            
            if (package == null)
                return NotFound();
            return Ok(package);
        }

        [HttpGet("unfinished")]
        public IEnumerable<PresentationPackage> GetUnfinishedPackages() =>
            _dbContext.PresentationPackages.Where(p => p.State == PackageState.Unfinished).ToList();

        [HttpGet("unfinished/{id}")]
        public async Task<ActionResult<PresentationPackage>> GetUnfinishedPackage(int id)
        {
            var package = await _dbContext.PresentationPackages
                .Where(p => p.State == PackageState.Unfinished)
                .Include(p => p.Metadata)
                .Include(p => p.DataFiles)
                .AsSplitQuery()
                .SingleOrDefaultAsync(p => p.Id == id);
            
            if (package == null)
                return NotFound();
            return Ok(package);
        }

        [HttpGet("unfinished/{id}/files")]
        public IEnumerable<PackageFile> GetUnfinishedPackageFiles(int id) =>
            _dbContext.PresentationPackages.Include(p => p.DataFiles).Single(p => p.Id == id).DataFiles.Select(f => new PackageFile(f.Id, Path.GetFileName(f.Path)));
        
        [HttpPost("new/{type}")]
        public async Task<ActionResult<CreatedUnfinishedPackage>> CreateNewPackage(PackageType type)
        {
            PresentationPackage newPkg = new PresentationPackage
            {
                Type = type,
                Name = "Novy balicek",
                Description = "Bez popisu",
                State = PackageState.Unfinished,
                IntendedDevices = new List<PresentationDevice>()
            };
            newPkg.IntendedDevices.Add(await _dbContext.PresentationDevices.FindAsync(1));
            _dbContext.PresentationPackages.Add(newPkg);
            await _dbContext.SaveChangesAsync();

            newPkg.WorkDir = Path.Combine(_baseWorkDir, newPkg.Id.ToString());
            await _dbContext.SaveChangesAsync();

            Directory.CreateDirectory(newPkg.WorkDir);

            return Ok(new CreatedUnfinishedPackage(newPkg.Id));
        }

        [HttpPost("finish/{id}")]
        public async Task<ActionResult<FinishedPackage>> FinishPackage(int id)
        {
            var unfinished = await _dbContext.PresentationPackages
                .Where(p => p.State == PackageState.Unfinished)
                .Include(p => p.DataFiles)
                .Include(p => p.Metadata)
                .AsSplitQuery()
                .SingleOrDefaultAsync(p => p.Id == id);
            if (unfinished == null)
            {
                return NotFound();
            }
            unfinished.State = PackageState.Processing;
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Finalizing package {0}...", unfinished.Id);

            Response.OnCompleted(async () => {
                await FinalizePackageData(unfinished);

                // TODO: improve performance
                foreach (var file in unfinished.DataFiles)
                    _dbContext.DataFiles.Remove(file);
                unfinished.Metadata.Clear();
                unfinished.DataFiles.Clear();

                unfinished.State = PackageState.Finished;
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation("Package {0} finalized.", unfinished.Id);
                _eventBus.PushEvent(BusEventType.PackageProcessed);
            });

            return Ok(new FinishedPackage(unfinished.Id));
        }

        private async Task FinalizePackageData(PresentationPackage package)
        {
            // TODO: launch final data processing

            string pkgDir = Path.Combine(_basePackageDir, package.Id.ToString());
            Directory.CreateDirectory(pkgDir);

            string pkgDataRoot = Path.Combine(pkgDir, "dataroot");
            Directory.CreateDirectory(pkgDataRoot);

            switch (package.Type)
            {
                case PackageType.Video:
                    await PackageUtils.FinishProcessingVideoPackage(package, pkgDataRoot, _config);
                    break;
                default: // TODO: handle other cases
                    break;
            }

            foreach (var file in package.DataFiles)
            {
                // TODO: this should be handled individually according to the package type
                //System.IO.File.Move(file.Path, Path.Combine(pkgDataRoot, Path.GetFileName(file.Path)));

                if (file.ThumbnailPath != null && System.IO.File.Exists(file.ThumbnailPath))
                    System.IO.File.Delete(file.ThumbnailPath);
                if (file.PreviewPath != null && System.IO.File.Exists(file.PreviewPath))
                    System.IO.File.Delete(file.PreviewPath);
            }

            // TODO: make "package.json" a constant somewhere
            using (var packageDotJson = new StreamWriter(Path.Combine(pkgDir, "package.json"), false, System.Text.Encoding.UTF8))
            {
                await PackageUtils.WritePackageJsonAsync(package, packageDotJson, null, null);
            }

            // Final zip
            await Task.Run(
                () => ZipFile.CreateFromDirectory(pkgDir, Path.Combine(_basePackageDir, String.Format("{0}.zip", package.Id)))
            );
        }

        [HttpGet("metadata/{id}")]
        public async Task<ActionResult<IEnumerable<MetadataRecord>>> GetMetadataForPackage(int id)
        {
            var package = await _dbContext.PresentationPackages
                .Include(p => p.Metadata)
                .SingleOrDefaultAsync(p => p.Id == id);
            
            if (package == null)
                return NotFound();

            return Ok(package.Metadata.Select((mtd, _) => new MetadataRecord { Key = mtd.Key, Value = mtd.Value }));
        }

        [HttpPost("metadata/{id}")]
        public async Task<ActionResult> SaveMetadataForPackage(int id, [FromBody] IEnumerable<MetadataRecord> metadataRecords)
        {
            var package = await _dbContext.PresentationPackages
                .Include(p => p.Metadata)
                .SingleOrDefaultAsync(p => p.Id == id);
            
            if (package == null)
                return NotFound();

            package.Metadata.Clear();
            foreach (var mtd in metadataRecords)
                package.Metadata.Add(new PackageMetadata { Key = mtd.Key, Value = mtd.Value });
            await _dbContext.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("metapack/{id}/{format}")]
        public async Task<ActionResult> ImportMetadataFile(int id, string format, [FromBody] IFormFile file)
        {
            var package = await _dbContext.PresentationPackages
                .Include(p => p.Metadata)
                .SingleOrDefaultAsync(p => p.Id == id);
            
            if (package == null)
                return NotFound();

            Dictionary<string, string> metadata;
            switch (format)
            {
                default:
                case "mods":
                    metadata = MetadataHelpers.ParseMODSFile(file);
                    break;
                case "muzeion":
                    metadata = MetadataHelpers.ParseMuzeionFile(file);
                    break;
            }

            var newMetadata = metadata.Select(kv => new PackageMetadata { Key = kv.Key, Value = kv.Value }).Union(package.Metadata);
            package.Metadata = newMetadata.ToList();
            await _dbContext.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("properties/{id}")]
        public async Task<ActionResult> SetPackageProperties(int id, [FromBody] PackageProperties properties)
        {
            var package = await _dbContext.PresentationPackages
                .Include(p => p.Metadata)
                .SingleOrDefaultAsync(p => p.Id == id);
            
            if (package == null)
                return NotFound();

            package.Name = properties.Name;
            package.Description = properties.Description;
            await _dbContext.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("parameters/{id}")]
        public async Task<ActionResult> SetPackageParameters(int id, [FromBody] Parameters parameters)
        {
            var package = await _dbContext.PresentationPackages
                .FindAsync(id);
            
            if (package == null)
                return NotFound();

            package.ParametersJson = Newtonsoft.Json.JsonConvert.SerializeObject(parameters, Naki3D.Common.Json.Converter.Settings);
            await _dbContext.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("inputs/{id}")]
        public async Task<ActionResult> SetPackageInputs(int id, [FromBody] Naki3D.Common.Json.Action[] inputs)
        {
            var package = await _dbContext.PresentationPackages
                .FindAsync(id);
            
            if (package == null)
                return NotFound();

            package.InputsJson = Newtonsoft.Json.JsonConvert.SerializeObject(inputs, Naki3D.Common.Json.Converter.Settings);
            await _dbContext.SaveChangesAsync();

            return Ok();
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpGet("download/{id}")]
        public async Task<ActionResult> DownloadPackage(int id)
        {
            var pkg = await _dbContext.PresentationPackages
                .OfOnlyType<PresentationPackage, PresentationPackage>()
                .SingleOrDefaultAsync(p => p.Id == id);
            if (pkg == null)
                return NotFound();

            var zipPath = Path.Combine(_basePackageDir, String.Format("{0}.zip", pkg.Id));
            if (!System.IO.File.Exists(zipPath))
                return NotFound(); // TODO: handle properly as this should not happen...

            var stream = new FileStream(Path.Combine(Directory.GetCurrentDirectory(), zipPath), FileMode.Open);
            return File(stream, "application/zip");
        }
    }
}