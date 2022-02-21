using System.Threading.Tasks;
using backend.Models;
using backend.ViewModels;
using Guidepipe.IO;
using Guidepipe.Steps;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.IO;
using Microsoft.Extensions.Configuration;
using backend.Utilities;
using System.Collections.Generic;
using System;

namespace backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ConversionController : ControllerBase
    {

        private ILogger<ConversionController> _logger;
        private CMTContext _dbContext;
        private IConfiguration _configuration;
        private EventBus _eventBus;

        public ConversionController(ILogger<ConversionController> logger, CMTContext dbContext, IConfiguration configuration, EventBus eventBus)
        {
            _logger = logger;
            _dbContext = dbContext;
            _configuration = configuration;
            _eventBus = eventBus;
        }

        [HttpPost("params/video/{fileId}")]
        public async Task<ActionResult> ApplyVideoConversionParams(int fileId , [FromBody] VideoConversionParams param)
        {
            var file = await _dbContext.DataFiles.Include(f => f.Package).SingleAsync(f => f.Id == fileId);
            if (file == null)
                return NotFound();

            Response.OnCompleted(async () =>
            {
                var package = file.Package;

                var pipeline = ConversionPipelines.ConstructVideoProcessPipeline(file.Path, null, _configuration);

                var conversionStep = pipeline.GetCurrentGuidedStep() as FfmpegProcess;
                if (param.UsePreset)
                {
                    var configSection = _configuration.GetSection("ConversionDefaults").GetSection("Video");
                    var args = new List<string>();
                    switch (param.QualityPreset)
                    {
                        case VideoConversionParams.Preset.High:
                            args.AddRange(configSection.GetSection("HighPreset").GetSection("Args").Get<string[]>());
                            break;
                        case VideoConversionParams.Preset.Medium:
                            args.AddRange(configSection.GetSection("MediumPreset").GetSection("Args").Get<string[]>());
                            break;
                        case VideoConversionParams.Preset.Low:
                            args.AddRange(configSection.GetSection("LowPreset").GetSection("Args").Get<string[]>());
                            break;
                    }

                    conversionStep.Configure((config) =>
                    {
                        config.AdditionalArgs = args;
                    });
                }
                else
                {
                    conversionStep.Configure((config) =>
                    {
                        config.AdditionalArgs.AddRange(new string[]
                        {
                            "-vf", $"fps=fps={param.Fps}",
                            "-vf", $"eq={param.Contrast}:{param.Brightness}:{param.Saturation}:{param.Gamma}",
                            "-b:v", $"{param.VideoBitrate}k",
                            "-b:a", $"{param.AudioBitrate}k"
                        });
                        config.AdditionalArgs.AddRange(param.CustomParams.Split());
                    });
                }

                var preview = await pipeline.ExecuteUntilPreviewAsync(new FilePath(file.Path));

                using (var stream = new MemoryStream())
                {
                    pipeline.SaveState(stream);
                    package.PipelineState = stream.ToArray();
                }

                var previewFilename = String.Format("{0}.webm", Path.GetFileNameWithoutExtension(file.PreviewPath));
                var previewPath = Path.Combine(Path.GetDirectoryName(file.PreviewPath), previewFilename);
                if (file.PreviewPath != previewPath)
                {
                    file.PreviewPath = previewPath;
                }

                await _dbContext.SaveChangesAsync();

                System.IO.File.Move(preview.Path, file.PreviewPath, true);

                _eventBus.PushEvent(BusEventType.PackagePreviewUpdated);
            });

            return Ok();
        }
    }
}