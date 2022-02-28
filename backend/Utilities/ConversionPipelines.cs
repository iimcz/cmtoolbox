using System.IO;
using Guidepipe.IO;
using Guidepipe.Pipelines;
using Guidepipe.Steps;
using Microsoft.Extensions.Configuration;

namespace backend.Utilities
{
    public static class ConversionPipelines
    {
        public static Pipeline<FilePath, FilePath> ConstructVideoProcessPipeline(string inPath, string outPath, IConfiguration gConfig)
        {
            var pipeline = new Pipeline<FilePath, FilePath>();
            var input = new FilePath(inPath);

            var tmpFile = Path.GetTempFileName();
            var configSection = gConfig.GetSection("ConversionDefaults").GetSection("Video");

            input.AddStep(pipeline, new FfmpegProcess((config) =>
            {
                config.OutputDir = Path.GetTempPath();
                config.OutputPattern = "{0}.webm";
                config.AudioCodec = configSection.GetValue<string>("AudioCodec");
                config.VideoCodec = configSection.GetValue<string>("VideoCodec");
                config.FfmpegPath = configSection.GetValue<string>("FfmpegPath") ?? "ffmpeg";
            })).AddStep(pipeline, new MoveFile((config) => {
                config.DestinationDir = Directory.Exists(outPath) ? outPath : Path.GetDirectoryName(Path.GetFullPath(outPath));
            }));

            return pipeline;
        }

        public static Pipeline<FilePath, bool> ConstructVideoCheckPipeline(string inPath, IConfiguration gConfig)
        {
            var pipeline = new Pipeline<FilePath, bool>();
            var input = new FilePath(inPath);

            var configSection = gConfig.GetSection("ConversionDefaults").GetSection("Video");

            var cleanAudioCodec = configSection.GetValue<string>("AudioCodec").Replace("lib", "");
            var cleanVideoCodec = configSection.GetValue<string>("VideoCodec").Replace("lib", "");

            input.AddStep(pipeline, new FfprobeCodecCheck((config) =>
            {
                config.FfmpegPath = configSection.GetValue<string>("FfmpegPath") ?? "ffmpeg";
                config.AudioCodec = cleanAudioCodec;
                config.VideoCodec = cleanVideoCodec;
            }));

            return pipeline;
        }
    }
}