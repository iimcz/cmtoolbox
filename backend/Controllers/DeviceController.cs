using System.Collections.Generic;
using System.Linq;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DeviceController : ControllerBase
    {

        ILogger<DeviceController> _logger;
        CMTContext _dbContext;
        public DeviceController(ILogger<DeviceController> logger, CMTContext dbContext)
        {
            _logger = logger;
            _dbContext = dbContext;
        }

        [HttpGet("all")]
        public IEnumerable<PresentationDevice> GetDevices() =>
            _dbContext.PresentationDevices.ToList();

        [HttpGet("sensors/{id}")]
        public IEnumerable<DeviceSensor> GetDeviceSensors(int id) =>
            _dbContext.PresentationDevices.Find(id)?.Sensors.ToList();


    }
}