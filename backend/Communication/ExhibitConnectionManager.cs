using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace backend.Communication
{
    public class ExhibitConnectionManager : IHostedService
    {
        public event System.Action OnIncomingConnectionEvent;

        // TODO: Configurable port
        private const int ServerListenPort = 3917;
        private ILogger<ExhibitConnectionManager> logger;

        private TcpListener incomingListener;
        private IAsyncResult incomingAsyncAccept;

        private ConcurrentDictionary<string, ExhibitConnection> pendingConnections;
        private ConcurrentDictionary<string, ExhibitConnection> establishedConnections;

        private ExhibitConnection _dummy;

        public ExhibitConnectionManager(ILogger<ExhibitConnectionManager> logger)
        {
            this.logger = logger;

            pendingConnections = new ConcurrentDictionary<string, ExhibitConnection>();
            establishedConnections = new ConcurrentDictionary<string, ExhibitConnection>();
        }

        public List<string> GetPendingConnections()
        {
            cleanupConnections();
            return new List<string>(pendingConnections.Keys);
        }

        public List<string> GetEstablishedConnections()
        {
            cleanupConnections();
            return new List<string>(establishedConnections.Keys);
        }

        public void AcceptPendingConnection(string connId)
        {
            ExhibitConnection conn;
            if (pendingConnections.TryGetValue(connId, out conn))
            {
                // TODO: thread safety
                conn.AcceptConnection();
                establishedConnections.TryAdd(connId, conn);
                pendingConnections.TryRemove(connId, out _dummy);
            }
        }

        public void ClearPackage(string connId)
        {
            ExhibitConnection conn;
            if (establishedConnections.TryGetValue(connId, out conn))
            {
                // TODO: for now always purge.
                conn.ClearPackage(true);
            }
        }

        public void LoadPackage(string connId, string packageDescriptor)
        {
            ExhibitConnection conn;
            if (establishedConnections.TryGetValue(connId, out conn))
            {
                conn.LoadPackage(false, packageDescriptor);
            }
        }

        public void IncomingConnectionCallback(IAsyncResult ar)
        {
            cleanupConnections();
            // FIXME: possible race condition between IsBound and EndAcceptTcpClient
            if (incomingListener.Server.IsBound)
            {
                var client = incomingListener.EndAcceptTcpClient(ar);

                logger.LogInformation("Processing new incoming connection from {}", client.Client.RemoteEndPoint);
                var excon = new ExhibitConnection(client);
                subscribeToEvents(excon);
                excon.ReceiveConnectionRequest();

                if (excon.IsConnected)
                {
                    if (pendingConnections.ContainsKey(excon.ConnectionId))
                    {
                        logger.LogWarning("Received pending connection with duplicate ID ({}). Removing the old one.", excon.ConnectionId);
                        pendingConnections.TryRemove(excon.ConnectionId, out _dummy);
                    }
                    if (establishedConnections.ContainsKey(excon.ConnectionId))
                    {
                        logger.LogWarning("Received pending connection which is already connected ID: {}", excon.ConnectionId);
                    }
                    pendingConnections.TryAdd(excon.ConnectionId, excon);
                    
                    OnIncomingConnectionEvent?.Invoke();

                    logger.LogInformation("Received connection ID: {}", excon.ConnectionId);
                }
                else
                {
                    logger.LogWarning("Received connection was invalid.");
                }

                incomingListener.BeginAcceptTcpClient(IncomingConnectionCallback, null);
            }
        }

        private void subscribeToEvents(ExhibitConnection excon)
        {
            excon.DescriptorChanged += (object obj, EventArgs e) => {
                ExhibitConnection sender = (ExhibitConnection) obj;
                sender.SendEncryptionInfo();
            };

            excon.ExhibitTimedOut += (object obj, EventArgs e) => {
                ExhibitConnection sender = (ExhibitConnection) obj;
                ExhibitConnection _dummy;
                establishedConnections.TryRemove(sender.ConnectionId, out _dummy);
                pendingConnections.TryRemove(sender.ConnectionId, out _dummy);

                logger.LogWarning("Exhibit (ID: {0}) timed out.", sender.ConnectionId);
            };
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            return Task.Run(() =>
            {
                incomingListener = new TcpListener(IPAddress.Any, ServerListenPort);
                incomingListener.Start();

                logger.LogInformation("Starting to listen for incoming TCP connections on port {}", ServerListenPort);
                incomingAsyncAccept = incomingListener.BeginAcceptTcpClient(IncomingConnectionCallback, null);
            });
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.Run(() =>
            {
                foreach (var conn in pendingConnections)
                {
                    conn.Value.Dispose();
                }

                foreach (var conn in establishedConnections)
                {
                    conn.Value.Dispose();
                }


                incomingListener.Stop();
            });
        }

        private void cleanupConnections()
        {
            // TODO: implement this properly - this code doesn't work correctly (breaks the dictionary)
            // Func<ExhibitConnection, bool> selector = (conn) => conn.IsConnected;
            // establishedConnections.RemoveByValue(selector);
            // pendingConnections.RemoveByValue(selector);
        }
    }
}