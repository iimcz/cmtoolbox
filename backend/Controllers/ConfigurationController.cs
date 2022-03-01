using System.Threading.Tasks;
using backend.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ConfigurationController : ControllerBase
    {
        private readonly ILogger<ConfigurationController> _logger;
        private readonly IConfiguration _config;

        public ConfigurationController(ILogger<ConfigurationController> logger, IConfiguration config)
        {
            _logger = logger;
            _config = config;
        }

        [HttpGet("current")]
        public ActionResult<BackendConfiguration> GetConfiguration()
        {
            return Ok(new BackendConfiguration
            {
                FfmpegPath = _config.GetSection("ExternalUtilities").GetValue<string>("FfmpegPath") ?? null,
                ImageMagickPath = _config.GetSection("ExternalUtilities").GetValue<string>("ImagemagickPath") ?? null
            });
        }
    }
}