using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Communication;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
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

        public ExhibitController(ILogger<ExhibitController> logger, ExhibitConnectionManager connectionManager, CMTContext dbContext)
        {
            _logger = logger;
            _connectionManager = connectionManager;
            _dbContext = dbContext;
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
            PresentationPackage package = await _dbContext.PresentationPackages.FindAsync(package_id);
            if (package == null)
                return NotFound();
            
            if (package.State != PackageState.Finished)
                return BadRequest();

            var inputs = Newtonsoft.Json.JsonConvert.DeserializeObject<List<N3DAction>>(package.InputsJson, Naki3D.Common.Json.Converter.Settings);
            var parameters = Newtonsoft.Json.JsonConvert.DeserializeObject<Parameters>(package.ParametersJson, Naki3D.Common.Json.Converter.Settings);

            var descriptor = new PackageDescriptor
            {
                Schema = "", // TODO: proper schema
                Metadata = new Metadata {}, // TODO: fill metadata
                Package = new Package { // TODO: fill
                    Checksum = "",
                    Url = new Uri("")
                },
                Sync = new Sync(), // NOTE: sync will be implemented in EMT
                Parameters = parameters,
                Inputs = inputs,
            };

            // First clear, then load the new package.
            _connectionManager.ClearPackage(exhibit_id);
            _connectionManager.LoadPackage(exhibit_id, descriptor);

            return Ok();
        }
    }
}