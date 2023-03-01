using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Linq;
using Naki3D.Common.Protocol;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Communication
{
    public class ExhibitConnectionManager : IHostedService
    {
        public event System.Action OnIncomingConnectionEvent;

        // TODO: Configurable port
        private const int ServerListenPort = 37514;
        private ILogger<ExhibitConnectionManager> _logger;
        private ILogger<ExhibitConnection> _connectionLogger;
        private readonly IServiceScopeFactory _scopeFactory;

        private UdpClient _beaconListener;

        private ConcurrentDictionary<string, ExhibitConnection> _connections;

        public ExhibitConnectionManager(ILogger<ExhibitConnectionManager> logger, ILogger<ExhibitConnection> connectionLogger, IServiceScopeFactory scopeFactory)
        {
            this._logger = logger;
            this._connectionLogger = connectionLogger;
            this._scopeFactory = scopeFactory;

            _connections = new ConcurrentDictionary<string, ExhibitConnection>();
        }

        public List<string> GetPendingConnections() => _connections.Where(con => !con.Value.IsConnected).Select(con => con.Key).ToList();

        public List<string> GetEstablishedConnections() => _connections.Where(con => con.Value.IsConnected).Select(con => con.Key).ToList();

        public async Task AcceptPendingConnection(string connId)
        {
            if (_connections.TryGetValue(connId, out var conn))
            {
                if (conn.IsConnected)
                {
                    _logger.LogWarning("Tried to accept already connected device: {0}", conn.ConnectionId);
                    return;
                }

                await conn.Connect();
            }
        }

        public async Task CloseConnection(string connId)
        {
            if (_connections.TryRemove(connId, out var conn))
            {
                await conn.Disconnect();
            }
        }

        public async Task<bool> LoadPackage(string connId, string packageDescriptor)
        {
            if (_connections.TryGetValue(connId, out var conn))
            {
                return await conn.LoadPackage(false, packageDescriptor);
            }
            return false;
        }

        public async Task<bool> StartPackage(string connId, string packageId)
        {
            if (_connections.TryGetValue(connId, out var conn))
            {
                return await conn.StartPackage(packageId);
            }
            return false;
        }

        public async Task<bool> SetStartupPackage(string connId, string packageId)
        {
            if (_connections.TryGetValue(connId, out var conn))
            {
                return await conn.SetStartupPackage(packageId);
            }
            return false;
        }

        public async Task<string> GetStartupPackage(string connId)
        {
            if (_connections.TryGetValue(connId, out var conn))
            {
                return await conn.GetStartupPackage();
            }
            return null;
        }

        public async Task<bool> ClearStartupPackage(string connId, bool purge)
        {
            if (_connections.TryGetValue(connId, out var conn))
            {
                return await conn.ClearStartupPackage(purge);
            }
            return false;
        }

        public async Task PurgeCachedPackages(string connId)
        {
            if (_connections.TryGetValue(connId, out var conn))
            {
                await conn.PurgeCachedPackages();
            }
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            await Task.Run(() =>
            {
                _beaconListener = new UdpClient();
                _beaconListener.Client.Bind(new IPEndPoint(IPAddress.Any, ServerListenPort));
                _beaconListener.BeginReceive(BeaconListenerCallback, null);

                _logger.LogInformation("Now listening for EMT beacon packets from devices on port {0}", ServerListenPort);
            });
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            await Task.WhenAll(_connections.Select(conn => conn.Value.Disconnect()));
            _beaconListener.Dispose();
        }

        public async void BeaconListenerCallback(IAsyncResult ar)
        {
            IPEndPoint remote = null;
            byte[] packet = null;

            try
            {
                packet = _beaconListener.EndReceive(ar, ref remote);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Error when receiving data.");
                return;
            }

            var device = ExhibitConnection.FromBeacon(packet, remote, false, _connectionLogger);

            if (_connections.ContainsKey(device.ConnectionId))
            {
                _logger.LogWarning("Received beacon identified as already connected device. Ignoring...");
            }
            else
            {
                _logger.LogInformation("New device beacon reveiced: {0}", device.ConnectionId);
                _connections.TryAdd(device.ConnectionId, device);
            }

            OnIncomingConnectionEvent?.Invoke();

            _beaconListener.BeginReceive(BeaconListenerCallback, null);
        }

        public string GetInterfaceAddressFor(string connId)
        {
            _connections.TryGetValue(connId, out var connection);

            if (connection != null)
            {
                return connection.GetSocketAddress().ToString();
            }
            else
            {
                return null;
            }
        }
    }
}