using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    public class ConversionController : ControllerBase
    {

        ILogger<ConversionController> _logger;
        CMTContext _dbContext;

        public ConversionController(ILogger<ConversionController> logger, CMTContext dbContext)
        {
            _logger = logger;
            _dbContext = dbContext;
        }

        
    }
}