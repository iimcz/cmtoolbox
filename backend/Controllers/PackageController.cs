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

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PackagesController : ControllerBase
    {
        ILogger<PackagesController> _logger;
        CMTContext _dbContext;
        string _baseWorkDir;
        string _basePackageDir;

        public PackagesController(ILogger<PackagesController> logger, CMTContext dbContext, IConfiguration config)
        {
            _logger = logger;
            _dbContext = dbContext;

            _baseWorkDir = config.GetSection("UnfinishedPackages").GetValue<string>("BaseWorkDir");
            _basePackageDir = config.GetSection("Packages").GetValue<string>("BaseStorageDir");
        }

        [HttpGet("all")]
        public IEnumerable<PresentationPackage> GetPackages() =>
            _dbContext.PresentationPackages.OfOnlyType<PresentationPackage, PresentationPackage>().ToList();

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
        public IEnumerable<UnfinishedPackage> GetUnfinishedPackages() =>
            _dbContext.UnfinishedPackages.ToList();

        [HttpGet("unfinished/{id}")]
        public async Task<ActionResult<UnfinishedPackage>> GetUnfinishedPackage(int id)
        {
            var package = await _dbContext.UnfinishedPackages
                .Include(p => p.Metadata)
                .Include(p => p.DataFiles)
                .AsSplitQuery()
                .SingleOrDefaultAsync(p => p.Id == id);
            
            if (package == null)
                return NotFound();
            return Ok(package);
        }
        
        [HttpPost("new/{type}")]
        public async Task<ActionResult<CreatedUnfinishedPackage>> CreateNewPackage(PackageType type)
        {
            UnfinishedPackage newPkg = new UnfinishedPackage
            {
                Type = type,
                Name = "Novy balicek",
                Description = "Bez popisu",
                IntendedDevices = new List<PresentationDevice>()
            };
            newPkg.IntendedDevices.Add(await _dbContext.PresentationDevices.FindAsync(1));
            _dbContext.UnfinishedPackages.Add(newPkg);
            await _dbContext.SaveChangesAsync();

            newPkg.WorkDir = Path.Combine(_baseWorkDir, newPkg.Id.ToString());
            await _dbContext.SaveChangesAsync();

            Directory.CreateDirectory(newPkg.WorkDir);

            return Ok(new CreatedUnfinishedPackage(newPkg.Id));
        }

        [HttpPost("finish/{id}")]
        public async Task<ActionResult<FinishedPackage>> FinishPackage(int id)
        {
            var unfinished = await _dbContext.UnfinishedPackages
                .Include(p => p.DataFiles)
                .Include(p => p.Metadata)
                .AsSplitQuery()
                .SingleOrDefaultAsync(p => p.Id == id);
            if (unfinished == null)
            {
                return NotFound();
            }

            var finished = unfinished.GenerateFinished();
            _dbContext.PresentationPackages.Add(finished);
            await _dbContext.SaveChangesAsync();

            FinalizePackageData(unfinished, finished);

            // TODO: improve performance
            foreach (var file in unfinished.DataFiles)
                _dbContext.DataFiles.Remove(file);
            unfinished.Metadata.Clear();
            unfinished.DataFiles.Clear();
            await _dbContext.SaveChangesAsync();

            _dbContext.UnfinishedPackages.Remove(unfinished);
            await _dbContext.SaveChangesAsync();

            return Ok(new FinishedPackage(finished.Id));
        }

        private void FinalizePackageData(UnfinishedPackage unfinished, PresentationPackage finished)
        {
            // TODO: launch final data processing

            string pkgDir = Path.Combine(_basePackageDir, finished.Id.ToString());
            Directory.CreateDirectory(pkgDir);

            string pkgDataRoot = Path.Combine(pkgDir, "dataroot");
            Directory.CreateDirectory(pkgDataRoot);
            foreach (var file in unfinished.DataFiles)
            {
                System.IO.File.Move(file.Path, Path.Combine(pkgDataRoot, Path.GetFileName(file.Path)));

                if (file.ThumbnailPath != null)
                    System.IO.File.Delete(file.ThumbnailPath);
                if (file.PreviewPath != null)
                    System.IO.File.Delete(file.PreviewPath);
            }

            // Final zip
            ZipFile.CreateFromDirectory(pkgDir, Path.Combine(_basePackageDir, String.Format("{0}.zip", finished.Id)));
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
            var stream = new FileStream(Path.Combine(Directory.GetCurrentDirectory(), zipPath), FileMode.Open);
            return File(stream, "application/zip");
        }
    }
}