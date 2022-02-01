using System;
using System.Net.WebSockets;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using backend.Communication;
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

        public EventSocketController(ILogger<EventSocketController> logger, ExhibitConnectionManager exhibitConnectionManager)
        {
            _logger = logger;
            _exhibitionConnectionManager = exhibitConnectionManager;
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
            Action incomingConnectionHandler = async () => {
                var data = JsonSerializer.SerializeToUtf8Bytes(new EventMessage { Type = EventType.ConnectionsUpdated } );
                await webSocket.SendAsync(data, WebSocketMessageType.Text, true, CancellationToken.None); 
            };
            _exhibitionConnectionManager.OnIncomingConnectionEvent += incomingConnectionHandler;

            var buffer = new byte[4];
            var result = await webSocket.ReceiveAsync(buffer, CancellationToken.None);
            while (!result.CloseStatus.HasValue)
            {
                // Ignore all incoming messages.
                _logger.LogInformation("Received a message on EventSocket, ignoring...");
                result = await webSocket.ReceiveAsync(buffer, CancellationToken.None);
            }

            await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
            
            // Unregister forwarded events
            _exhibitionConnectionManager.OnIncomingConnectionEvent -= incomingConnectionHandler;
        }
    }
}