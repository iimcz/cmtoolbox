namespace backend.ViewModels
{
    public class ConversionParams
    {
    }

    public class VideoConversionParams : ConversionParams
    {
        public enum Preset
        {
            High,
            Medium,
            Low
        }

        public bool UsePreset { get; set; }
        public Preset? QualityPreset { get; set; }
        public int? VideoBitrate { get; set; }
        public int? AudioBitrate { get; set; }
        public int? Fps { get; set; }
        public float? Brightness { get; set; }
        public float? Contrast { get; set; }
        public float? Saturation { get; set; }
        public float? Gamma { get; set; }
        public string CustomParams { get; set; }
    }
}