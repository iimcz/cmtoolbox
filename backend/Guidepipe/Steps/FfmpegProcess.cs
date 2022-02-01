using System;
using System.Diagnostics;
using System.IO;
using System.Xml.Serialization;
using Guidepipe.IO;

namespace Guidepipe.Steps
{
    public class FfmpegProcessConfig
    {
        public string OutputDir { get; set; } = "";
        public string OutputPattern { get; set; } = "{0}.webm";
        public string VideoCodec { get; set; } = "vp8";
        public string AudioCodec { get; set; } = "libopus";
        public string FfmpegPath { get; set; } = null;
    }

    public class FfmpegProcess : IPipelineGuidedStep<FilePath, FilePath>
    {
        public bool SinkToPreview { get; set; } = false;

        public bool IsGuided => true;

        Action<FilePath> _sink;
        Action<FilePath> _previewSink;
        FfmpegProcessConfig _config = new FfmpegProcessConfig();
        FilePath _cachedInput;

        public FfmpegProcess(Action<FfmpegProcessConfig> configure)
        {
            configure(_config);
        }

        public void Execute(FilePath input)
        {
            _cachedInput = input;

            FilePath output = new FilePath();
            output.Path = Path.Combine(
                _config.OutputDir,
                String.Format(_config.OutputPattern, Path.GetFileNameWithoutExtension(input.Path))
            );

            ProcessStartInfo ffmpegStartInfo = new ProcessStartInfo();
            // TODO: multiplatform support?
            ffmpegStartInfo.FileName = _config.FfmpegPath ?? "ffmpeg";
            ffmpegStartInfo.ArgumentList.Add("-y");
            ffmpegStartInfo.ArgumentList.Add("-i");
            ffmpegStartInfo.ArgumentList.Add(input.Path);
            if (SinkToPreview)
            {
                ffmpegStartInfo.ArgumentList.Add("-t");
                ffmpegStartInfo.ArgumentList.Add("10");
            }

            // Codec setup
            ffmpegStartInfo.ArgumentList.Add("-c:v");
            ffmpegStartInfo.ArgumentList.Add(_config.VideoCodec);
            ffmpegStartInfo.ArgumentList.Add("-c:a");
            ffmpegStartInfo.ArgumentList.Add(_config.AudioCodec);

            ffmpegStartInfo.ArgumentList.Add(output.Path);

            Process ffmpegProcess = Process.Start(ffmpegStartInfo);
            ffmpegProcess.WaitForExit();

            if (SinkToPreview)
                _previewSink(output);
            else
                _sink(output);
        }

        public void Execute()
        {
            Execute(_cachedInput);
        }

        public void LoadConfig(Stream stream)
        {
            var serializer = new XmlSerializer(typeof(FfmpegProcessConfig));
            _config = serializer.Deserialize(stream) as FfmpegProcessConfig;
        }

        public void SaveConfig(Stream stream)
        {
            var serializer = new XmlSerializer(typeof(FfmpegProcessConfig));
            serializer.Serialize(stream, _config);
        }

        public void SetPreviewSink(Action<FilePath> sink)
        {
            _previewSink = sink;
        }

        public void SetSink(Action<FilePath> sink)
        {
            _sink = sink;
        }
    }
}