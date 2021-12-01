using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using backend.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

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
            _dbContext.PresentationPackages.ToList();

        [HttpGet("unfinished")]
        public IEnumerable<UnfinishedPackage> GetUnfinishedPackages() =>
            _dbContext.UnfinishedPackages.ToList();
        
        [HttpPost("new")]
        public async Task<IActionResult> CreateNewPackage()
        {
            UnfinishedPackage newPkg = new UnfinishedPackage();
            _dbContext.Add(newPkg);
            await _dbContext.SaveChangesAsync();

            newPkg.WorkDir = Path.Combine(_baseWorkDir, newPkg.Id.ToString());
            await _dbContext.SaveChangesAsync();

            Directory.CreateDirectory(newPkg.WorkDir);

            return Ok(new CreatedUnfinishedPackage(newPkg.Id));
        }

        [HttpPost("finish/{id}")]
        public async Task<IActionResult> FinishPackage(int id)
        {
            var unfinished = await _dbContext.UnfinishedPackages.FindAsync(id);
            if (unfinished == null)
            {
                return NotFound();
            }

            var finished = unfinished.GenerateFinished();
            _dbContext.PresentationPackages.Add(finished);
            await _dbContext.SaveChangesAsync();
            return Ok(finished.Id);
        }
    }
}