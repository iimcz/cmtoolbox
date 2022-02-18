using System;
using System.IO;

namespace Guidepipe.Steps
{
    public interface IPipelineStep
    {
        /// <summary>
        /// Whether the step needs guiding. Guided steps must be repeatable.
        /// They will pause the pipeline before and after their execution to let the user determine
        /// if the step's results are satisfactory and change parameters accordingly.
        /// </summary>
        bool IsGuided { get; }
    }

    public interface IPipelineConfigurableStep<TConf>
    {
        void Configure(Action<TConf> configure);
    }

    public interface PipelineGuidedStep
    {
        void SaveConfig(Stream stream);
        void LoadConfig(Stream stream);
    }

    public interface IPipelineOutputStep<TOut> : IPipelineStep
    {
        void SetSink(Action<TOut> sink);
    }

    public interface IPipelineGuidedOutputStep<TOut> : IPipelineOutputStep<TOut>
    {
        bool SinkToPreview { get; set; }
        void SetPreviewSink(Action<TOut> sink);
    }

    public interface IPipelineInputStep<TIn> : IPipelineStep
    {
        void Execute(TIn input);
    }

    public interface IPipelineGuidedInputStep : IPipelineStep
    {
        void Execute();
    }

    public interface IPipelineStep<TIn, TOut> : IPipelineStep, IPipelineInputStep<TIn>, IPipelineOutputStep<TOut>
    {
    }

    public interface IPipelineGuidedStep<TIn, TOut> : IPipelineStep<TIn, TOut>, PipelineGuidedStep, IPipelineGuidedOutputStep<TOut>, IPipelineGuidedInputStep
    {
    }
}