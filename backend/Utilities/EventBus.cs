using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.Utilities
{
    public class EventBus : IHostedService
    {
        private readonly ILogger<EventBus> _logger;

        public event Action<BusEventType> OnEvent;

        public EventBus(ILogger<EventBus> logger)
        {
            _logger = logger;
        }

        public void PushEvent(BusEventType type)
        {
            OnEvent?.Invoke(type);
        }


        public Task StartAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }

    public enum BusEventType
    {
        PackageProcessed,
        PackagePreviewUpdated,
    }
}