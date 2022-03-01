using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using Guidepipe.IO;

namespace Guidepipe.Steps
{
    public class FfprobeCodecCheckConfig
    {
        public string VideoCodec { get; set; } = "";
        public string AudioCodec { get; set; } = "";
        public string FfmpegPath { get; set; } = "";
    }

    public class FfprobeCodecCheck : IPipelineStep<FilePath, bool>
    {
        private FfprobeCodecCheckConfig _config = new FfprobeCodecCheckConfig();
        private Action<bool> _sink;

        public FfprobeCodecCheck(Action<FfprobeCodecCheckConfig> configure)
        {
            if (configure != null)
                configure(_config);
        }

        public bool IsGuided => false;

        public void Execute(FilePath input)
        {
            ProcessStartInfo ffprobeStartInfo = new ProcessStartInfo();
            ffprobeStartInfo.FileName =
                Path.Combine(_config.FfmpegPath.Substring(0, _config.FfmpegPath.Length - Path.GetFileName(_config.FfmpegPath).Length), "ffprobe") ?? "ffprobe";
            ffprobeStartInfo.ArgumentList.Add("-show_streams");
            ffprobeStartInfo.ArgumentList.Add("-of");
            ffprobeStartInfo.ArgumentList.Add("json");
            ffprobeStartInfo.ArgumentList.Add(input.Path);
            ffprobeStartInfo.RedirectStandardOutput = true;

            Process ffprobeProcess = Process.Start(ffprobeStartInfo);
            ffprobeProcess.WaitForExit();


            var result = JsonSerializer.Deserialize<FfprobeResult>(ffprobeProcess.StandardOutput.ReadToEnd());

            bool audio_correct = false;
            bool video_correct = false;
            foreach (var stream in result.Streams)
            {
                if (stream.CodecType == "video" && stream.CodecName == _config.VideoCodec)
                    video_correct = true;
                if (stream.CodecType == "audio" && stream.CodecName == _config.AudioCodec)
                    audio_correct = true;
            }

            _sink(audio_correct && video_correct);
        }

        public void SetSink(Action<bool> sink)
        {
            _sink = sink;
        }

        private class FfprobeStream
        {
            [JsonPropertyName("codec_name")]
            public string CodecName { get; set; }
            [JsonPropertyName("codec_type")]
            public string CodecType { get; set; }
        }

        private class FfprobeResult
        {
            [JsonPropertyName("streams")]
            public List<FfprobeStream> Streams { get; set; }
        }
    }
}