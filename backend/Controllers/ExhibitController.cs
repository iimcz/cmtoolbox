using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using backend.Communication;
using backend.Middleware;
using backend.Models;
using backend.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Naki3D.Common.Json;

using N3DAction = Naki3D.Common.Json.Action;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ExhibitController : ControllerBase
    {
        private ILogger<ExhibitController> _logger;
        private ExhibitConnectionManager _connectionManager;
        private CMTContext _dbContext;
        private string _basePackageDir;

        public ExhibitController(IConfiguration config, ILogger<ExhibitController> logger, ExhibitConnectionManager connectionManager, CMTContext dbContext)
        {
            _logger = logger;
            _connectionManager = connectionManager;
            _dbContext = dbContext;

            _basePackageDir = config.GetSection("Packages").GetValue<string>("BaseStorageDir");
        }

        [HttpGet("/pending")]
        public IEnumerable<string> GetPendingConnections() =>
            _connectionManager.GetPendingConnections();

        [HttpGet("/established")]
        public IEnumerable<string> GetEstablishedConnections() =>
            _connectionManager.GetEstablishedConnections();
        
        [HttpPost("/accept/{id}")]
        public ActionResult AcceptConnection(string id)
        {
            _connectionManager.AcceptPendingConnection(id);
            return Ok();
        }

        [HttpPost("/send/{exhibit_id}/{package_id}")]
        public async Task<ActionResult> SendPackage(string exhibit_id, int package_id)
        {
            PresentationPackage package = await _dbContext.PresentationPackages
                .Include(p => p.DataFiles)
                .Include(p => p.Metadata)
                .AsSplitQuery()
                .SingleOrDefaultAsync(p => p.Id == package_id);
            if (package == null)
                return NotFound();

            if (package.State != PackageState.Finished)
                return BadRequest();

            // First clear, then load the new package.
            _connectionManager.ClearPackage(exhibit_id);

            using (var writer = new StringWriter())
            {
                string filepath = Path.Combine(_basePackageDir, String.Format("{0}.zip", package.Id));
                string pkgurl = MyHttpContext.AppBaseUrl + String.Format("/Packages/download/{0}", package.Id);
                await PackageUtils.WritePackageJsonAsync(package, writer, filepath, pkgurl);
                _connectionManager.LoadPackage(exhibit_id, writer.ToString());
            }

            return Ok();
        }
    }
}