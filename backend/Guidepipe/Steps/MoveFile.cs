using System;
using System.IO;
using Guidepipe.IO;

namespace Guidepipe.Steps
{
    public class MoveFileConfig
    {
        public string DestinationDir { get; set; } = "";
        public string DestinationFilename { get; set; } = null;
    }
    public class MoveFile : IPipelineStep<FilePath, FilePath>
    {
        public bool IsGuided => false;

        MoveFileConfig _config = new MoveFileConfig();
        Action<FilePath> _sink;

        public MoveFile(Action<MoveFileConfig> configure)
        {
            configure(_config);
        }

        public void Execute(FilePath input)
        {
            string filename = Path.GetFileName(input.Path);
            string dir = Path.GetDirectoryName(input.Path);

            FilePath output = new FilePath();
            output.Path = Path.Combine(_config.DestinationDir, _config.DestinationFilename ?? filename);

            // ensure the directory exists
            Directory.CreateDirectory(_config.DestinationDir);
            File.Move(input.Path, output.Path);

            _sink(output);
        }

        public void SetSink(System.Action<FilePath> sink)
        {
            _sink = sink;
        }
    }
}