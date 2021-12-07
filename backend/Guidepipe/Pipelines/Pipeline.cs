using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Guidepipe.Steps;

namespace Guidepipe.Pipelines
{
    public class PipelineStepWrapper<TIn, TOut>
    {
        public IPipelineStep<TIn, TOut> PipelineStep { get; set; }
    }


    public static class PipelineExtensions
    {
        public static TOut AddStep<TIn, TOut, TInOuter, TOutOuter>(
            this TIn input,
            Pipeline<TInOuter, TOutOuter> pipeline,
            IPipelineStep<TIn, TOut> step
        )
        {
            pipeline.InsertStep<TIn, TOut>(step);
            return default(TOut);
        }
    }

    public enum PipelineState : byte
    {
        Ready,
        Paused,
        Finished
    }

    public class Pipeline<TIn, TOut>
    {
        List<IPipelineStep> _pipelineSteps = new List<IPipelineStep>();
        List<int> _pipelineGuidedStepIndices = new List<int>();
        int _pipelineStopStepIndex = 0;
        PipelineState _currentState = PipelineState.Ready;

        public void InsertStep<TStepIn, TStepOut>(IPipelineStep<TStepIn, TStepOut> step)
        {
            if (_currentState != PipelineState.Ready)
                throw new InvalidOperationException();

            var stepIndex = _pipelineSteps.Count;
            
            if (_pipelineSteps.Count > 0)
            {
                var lastStep = _pipelineSteps[_pipelineSteps.Count - 1] as IPipelineOutputStep<TStepIn>;
                lastStep.SetSink(value => step.Execute(value));
            }

            if (step.IsGuided)
            {
                _pipelineGuidedStepIndices.Add(stepIndex);
                _pipelineStopStepIndex = _pipelineGuidedStepIndices[0];
            }

            _pipelineSteps.Add(step);
        }

        public TOut Execute(TIn input)
        {
            if (_currentState != PipelineState.Ready)
                throw new InvalidOperationException();
            
            TOut output = default(TOut);

            var lastStep = _pipelineSteps[_pipelineSteps.Count - 1] as IPipelineOutputStep<TOut>;
            lastStep.SetSink(value => output = value);

            var firstStep = _pipelineSteps[0] as IPipelineInputStep<TIn>;
            firstStep.Execute(input);

            return output;
        }

        public TOut ExecuteUntilPreview(TIn input)
        {
            if (_currentState != PipelineState.Ready)
                throw new InvalidOperationException();

            TOut previewOut = default(TOut);

            var previewStep = _pipelineSteps[_pipelineStopStepIndex] as IPipelineGuidedOutputStep<TOut>;
            previewStep.SetPreviewSink(value => previewOut = value);
            previewStep.SinkToPreview = true;

            var firstStep = _pipelineSteps[0] as IPipelineInputStep<TIn>;
            firstStep.Execute(input);

            return previewOut;
        }

        public TOut RenewPreview()
        {
            if (_currentState != PipelineState.Paused)
                throw new InvalidOperationException();

            TOut previewOut = default(TOut);

            var previewStep = _pipelineSteps[_pipelineStopStepIndex] as IPipelineGuidedOutputStep<TOut>;
            previewStep.SetPreviewSink(value => previewOut = value);
            previewStep.SinkToPreview = true;
            var previewInStep = _pipelineSteps[_pipelineStopStepIndex] as IPipelineGuidedInputStep;
            previewInStep.Execute();

            return previewOut;
        }

        public TOut ContinueUntilPreview()
        {
            if (_currentState != PipelineState.Paused)
                throw new InvalidOperationException();

            TOut previewOut = default(TOut);

            var lastPreviewStep = _pipelineSteps[_pipelineStopStepIndex] as IPipelineGuidedInputStep;
            // TODO: better implementation
            _pipelineStopStepIndex = _pipelineGuidedStepIndices.Find((x) => x > _pipelineStopStepIndex);
            var nextPreviewStep = _pipelineSteps[_pipelineStopStepIndex] as IPipelineGuidedOutputStep<TOut>;
            nextPreviewStep.SetPreviewSink(value => previewOut = value);
            nextPreviewStep.SinkToPreview = true;
            lastPreviewStep.Execute();

            return previewOut;
        }

        public TOut ContinueExecution()
        {
            if (_currentState != PipelineState.Paused)
                throw new InvalidOperationException();

            TOut output = default(TOut);

            var currentStepOut = _pipelineSteps[_pipelineStopStepIndex] as IPipelineGuidedOutputStep<TOut>;
            currentStepOut.SinkToPreview = false;

            var lastStep = _pipelineSteps[_pipelineSteps.Count - 1] as IPipelineOutputStep<TOut>;
            lastStep.SetSink(value => output = value);

            var currentStepIn = _pipelineSteps[_pipelineStopStepIndex] as IPipelineGuidedInputStep;
            currentStepIn.Execute();

            return output;
        }

        public IPipelineStep GetCurrentGuidedStep()
        {
            return _pipelineSteps[_pipelineStopStepIndex];
        }

        public bool ContainsAnotherGuidedStep()
        {
            // TODO: better implementation
            return _pipelineGuidedStepIndices.Exists(x => x > _pipelineStopStepIndex);
        }

        public void SaveState(Stream stream)
        {
            using (var writer = new BinaryWriter(stream))
            {
                writer.Write(((byte)_currentState));
                writer.Write(_pipelineStopStepIndex);
            }
            (_pipelineSteps[_pipelineStopStepIndex] as PipelineGuidedStep).SaveConfig(stream);
        }

        public void LoadState(Stream stream)
        {
            using (var reader = new BinaryReader(stream))
            {
                _currentState = (PipelineState)reader.ReadByte();
                _pipelineStopStepIndex = reader.ReadInt32();
            }
            (_pipelineSteps[_pipelineStopStepIndex] as PipelineGuidedStep).LoadConfig(stream);
        }

#region Async support
        public Task<TOut> ExecuteAsync(TIn input)
        {
            return new Task<TOut>(
                () => Execute(input)
            );
        }

        public Task<TOut> ExecuteUntilPreviewAsync(TIn input)
        {
            return new Task<TOut>(
                () => ExecuteUntilPreview(input)
            );
        }

        public Task<TOut> RenewPreviewAsync()
        {
            return new Task<TOut>(
                () => RenewPreview()
            );
        }

        public Task<TOut> ContinueUntilPreviewAsync()
        {
            return new Task<TOut>(
                () => ContinueUntilPreview()
            );
        }

        public Task<TOut> ContinueExecutionAsync()
        {
            return new Task<TOut>(
                () => ContinueExecution()
            );
        }
#endregion
    }
}