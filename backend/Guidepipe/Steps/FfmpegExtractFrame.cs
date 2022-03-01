using System;
using System.Diagnostics;
using System.IO;
using Guidepipe.IO;

namespace Guidepipe.Steps
{
    public class FfmpegExtractFrameConfig
    {
        public string OutputDir { get; set; } = Path.GetTempPath();
        public string OutputPattern { get; set; } = Path.GetFileName(Path.GetTempFileName()) + ".png";
        public string FfmpegPath { get; set; } = null;
    }

    public class FfmpegExtractFrame : IPipelineStep<FilePath, FilePath>
    {

        public bool IsGuided => false;
        private Action<FilePath> _sink;
        private FfmpegExtractFrameConfig _config = new FfmpegExtractFrameConfig();

        public FfmpegExtractFrame(Action<FfmpegExtractFrameConfig> configure)
        {
            if (configure != null)
                configure(_config);
        }

        public void Execute(FilePath input)
        {
            FilePath output = new FilePath();
            output.Path = Path.Combine(
                _config.OutputDir,
                String.Format(_config.OutputPattern, Path.GetFileNameWithoutExtension(input.Path))
            );

            ProcessStartInfo ffmpegStartInfo = new ProcessStartInfo();
            ffmpegStartInfo.FileName = _config.FfmpegPath ?? "ffmpeg";
            ffmpegStartInfo.ArgumentList.Add("-ss");
            ffmpegStartInfo.ArgumentList.Add("00:00:01.000");
            ffmpegStartInfo.ArgumentList.Add("-i");
            ffmpegStartInfo.ArgumentList.Add(input.Path);

            // Codec setup
            ffmpegStartInfo.ArgumentList.Add("-frames:v");
            ffmpegStartInfo.ArgumentList.Add("1");

            ffmpegStartInfo.ArgumentList.Add(output.Path);

            Process ffmpegProcess = Process.Start(ffmpegStartInfo);
            ffmpegProcess.WaitForExit();

            _sink(output);
        }

        public void SetSink(System.Action<FilePath> sink)
        {
            _sink = sink;
        }
    }
}