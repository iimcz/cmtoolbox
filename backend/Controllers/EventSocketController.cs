using System;
using System.Net.WebSockets;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using backend.Communication;
using backend.Utilities;
using backend.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    public class EventSocketController : ControllerBase
    {
        private readonly ILogger<EventSocketController> _logger;
        private ExhibitConnectionManager _exhibitionConnectionManager;
        private readonly EventBus _eventBus;

        public EventSocketController(ILogger<EventSocketController> logger, ExhibitConnectionManager exhibitConnectionManager, EventBus eventBus)
        {
            _logger = logger;
            _exhibitionConnectionManager = exhibitConnectionManager;
            _eventBus = eventBus;
        }

        [HttpGet("/events")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task Get()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
                _logger.LogInformation("Received new WebSocket connection for server events.");
                await SendEvents(webSocket);
            }
            else
            {
                _logger.LogWarning("Received non-WebSocket connection on a WebSocket path.");
                HttpContext.Response.StatusCode = 400;
            }
        }

        private async Task SendEvents(WebSocket webSocket)
        {
            // 1. register callbacks in appropriate places (so far con manager)
            // 2. forward events as messages through the websocket
            // 3. close when send fails / on disconnect
            Action incomingConnectionHandler = async () =>
            {
                var data = JsonSerializer.SerializeToUtf8Bytes(new EventMessage { Type = EventType.ConnectionsUpdated });
                await webSocket.SendAsync(data, WebSocketMessageType.Text, true, CancellationToken.None);
            };
            _exhibitionConnectionManager.OnIncomingConnectionEvent += incomingConnectionHandler;

            Action<BusEventType> incomingEvent = async (ev) =>
            {
                var msg = new EventMessage();
                switch (ev)
                {
                    case BusEventType.PackagePreviewUpdated:
                        msg.Type = EventType.PackagePreviewUpdated;
                        break;
                    case BusEventType.PackageProcessed:
                        msg.Type = EventType.PackageProcessed;
                        break;
                }
                var data = JsonSerializer.SerializeToUtf8Bytes(msg);
                await webSocket.SendAsync(data, WebSocketMessageType.Text, true, CancellationToken.None);
            };
            _eventBus.OnEvent += incomingEvent;

            var buffer = new byte[4];
            do
            {
                try
                {
                    var result = await webSocket.ReceiveAsync(buffer, CancellationToken.None);
                }
                catch (WebSocketException e)
                {
                    _logger.LogWarning($"Websocket error: {e.ToString()}");
                    break;
                }

                // Ignore all incoming messages.
                _logger.LogInformation("Received a message on EventSocket, ignoring...");
            } while (!webSocket.CloseStatus.HasValue);

            if (webSocket.CloseStatus.HasValue)
            {
                await webSocket.CloseAsync(webSocket.CloseStatus.Value, webSocket.CloseStatusDescription, CancellationToken.None);
            }

            // Unregister forwarded events
            _exhibitionConnectionManager.OnIncomingConnectionEvent -= incomingConnectionHandler;
            _eventBus.OnEvent -= incomingEvent;
        }
    }
}