using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using backend.ViewModels;
using backend.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

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
            var unfinished = await _dbContext.UnfinishedPackages.FindAsync(id);
            if (unfinished == null)
            {
                return NotFound();
            }

            var finished = unfinished.GenerateFinished();
            _dbContext.PresentationPackages.Add(finished);
            _dbContext.UnfinishedPackages.Remove(unfinished);
            await _dbContext.SaveChangesAsync();
            return Ok(new FinishedPackage(finished.Id));
        }
    }
}