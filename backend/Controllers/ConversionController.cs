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
using System.Linq;

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
        public async Task<ActionResult> ApplyVideoConversionParams(int fileId, [FromBody] VideoConversionParams param)
        {
            var file = await _dbContext.DataFiles.Include(f => f.Package).SingleAsync(f => f.Id == fileId);
            if (file == null)
                return NotFound();

            var package = file.Package;

            var pipeline = ConversionPipelines.ConstructVideoProcessPipeline(file.Path, file.Path, _configuration);
            var configSection = _configuration.GetSection("ConversionDefaults").GetSection("Video");

            var conversionStep = pipeline.GetCurrentGuidedStep() as FfmpegProcess;
            if (param.UsePreset)
            {
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
                args.Add("-vf");
                args.Add($"fps=fps={param.Fps}");

                conversionStep.Configure((config) =>
                {
                    config.AdditionalArgs = MergeVideoFilterArgs(configSection.GetValue<string>("PreVideoFilter"),  args);
                });
            }
            else
            {
                conversionStep.Configure((config) =>
                {
                    config.AdditionalArgs.AddRange(new string[]
                    {
                            "-b:v", $"{param.VideoBitrate}k",
                            "-b:a", $"{param.AudioBitrate}k",
                            "-vf", $"fps=fps={param.Fps},eq={param.Contrast}:{param.Brightness}:{param.Saturation}:{param.Gamma}"
                    });

                    if (param.CustomParams != null && param.CustomParams.Length > 0)
                    {
                        config.AdditionalArgs = MergeVideoFilterArgs(configSection.GetValue<string>("PreVideoFilter"), param.CustomParams.Split().ToList());
                    }
                });
            }

            using (var stream = new MemoryStream())
            {
                pipeline.SaveState(stream);
                package.PipelineState = stream.ToArray();
            }
            await _dbContext.SaveChangesAsync();

            Response.OnCompleted(async () =>
            {
                var preview = await pipeline.ExecuteUntilPreviewAsync(new FilePath(file.Path));

                if (package.State != PackageState.Unfinished)
                {
                    _logger.LogWarning($"Video preview generated for a finished/processing package ({package.Id}). Deleting the file: {preview.Path}");
                    System.IO.File.Delete(preview.Path);
                }

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

        private List<string> MergeVideoFilterArgs(string prefilter, List<string> args)
        {
            var filterStrings = new List<string>();

            if (prefilter != null && prefilter.Length > 0)
                filterStrings.Add(prefilter);

            var newArgs = new List<string>();

            bool takeFilter = false;
            int firstFilterDef = -1;
            foreach (var arg in args)
            {
                if (arg == "-vf" || arg == "-filter:v")
                {
                    takeFilter = true;

                    if (firstFilterDef < 0)
                    {
                        firstFilterDef = newArgs.Count;
                        newArgs.Add("-vf");
                    }
                }
                else if (takeFilter)
                {
                    filterStrings.Add(arg);
                    takeFilter = false;
                }
                else
                {
                    newArgs.Add(arg);
                }
            }

            newArgs.Insert(firstFilterDef + 1, String.Join(',', filterStrings));

            foreach(var arg in newArgs)
            {
                Console.WriteLine(arg);
            }

            return newArgs;
        }
    }
}