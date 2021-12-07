using System;
using System.Diagnostics;
using System.IO;
using System.Xml.Serialization;
using guidepipe.IO;

namespace guidepipe.Steps
{
    [Serializable]
    public class ImageMagickProcessConfig
    {
        public string OutputDir { get; set; } = "";
        public string OutputPattern { get; set; } = "{0}.png";
        public string ImageMagickPath { get; set; } = null;
    }

    public class ImageMagickProcess : IPipelineGuidedStep<FilePath, FilePath>
    {
        public bool IsGuided => true;

        public bool SinkToPreview { get; set; } = false;

        Action<FilePath> _sink;
        Action<FilePath> _previewSink;
        ImageMagickProcessConfig _config = new ImageMagickProcessConfig();
        FilePath _cachedInput;

        public ImageMagickProcess(Action<ImageMagickProcessConfig> configure)
        {
            configure(_config);
        }

        public void Execute(FilePath input)
        {
            _cachedInput = input;

            FilePath output = new FilePath();
            output.Path = Path.Combine(
                _config.OutputDir,
                String.Format(_config.OutputPattern, Path.GetFileName(input.Path))
            );

            ProcessStartInfo imStartInfo = new ProcessStartInfo();
            // TODO: multiplatform support?
            imStartInfo.FileName = _config.ImageMagickPath ?? "convert";
            imStartInfo.ArgumentList.Add(input.Path);
            imStartInfo.ArgumentList.Add(output.Path);

            Process imProcess = Process.Start(imStartInfo);
            imProcess.WaitForExit();

            if (SinkToPreview)
                _previewSink(output);
            else
                _sink(output);
        }

        public void Execute()
        {
            Execute(_cachedInput);
        }

        public void SetSink(Action<FilePath> sink)
        {
            _sink = sink;
        }

        public void SaveConfig(Stream stream)
        {
            var serializer = new XmlSerializer(typeof(ImageMagickProcessConfig));
            serializer.Serialize(stream, _config);
        }

        public void LoadConfig(Stream stream)
        {
            var serializer = new XmlSerializer(typeof(ImageMagickProcessConfig));
            _config = serializer.Deserialize(stream) as ImageMagickProcessConfig;
        }

        public void SetPreviewSink(Action<FilePath> sink)
        {
            _previewSink = sink;
        }
    }
}