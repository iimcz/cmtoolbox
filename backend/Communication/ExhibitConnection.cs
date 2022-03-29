using System.Net.Sockets;
using System.Net;
using System.Threading.Tasks;
using System.Timers;

using System;
using Google.Protobuf;
using System.IO;

using Naki3D.Common.Protocol;
using System.Text;
using backend.Extensions;

namespace backend.Communication
{
    public class ExhibitConnection : IDisposable
    {
        private readonly double TIMEOUT_INTERVAL = 10_000;

        TcpClient _connectionClient;
        Stream _connectionStream;
        JsonObjectStringReader _jsonReader;
        Timer _timeoutTimer;
        Task _receiveLoopTask;
        bool _accepted = false;

        DeviceDescriptor _descriptor = null;

        public string ConnectionId { get; private set; }
        public string PublicKey { get; private set; }


        public bool IsConnected { get { return _connectionClient.Connected; } }

        // Events
        public event EventHandler ExhibitTimedOut;
        public event EventHandler DescriptorChanged;

        public ExhibitConnection(TcpClient client)
        {
            _connectionClient = client;
            _connectionStream = client.GetStream();
            _jsonReader = new JsonObjectStringReader(_connectionStream);
            _timeoutTimer = new Timer(TIMEOUT_INTERVAL);
            _timeoutTimer.AutoReset = false;
            _timeoutTimer.Elapsed += (object sender, ElapsedEventArgs e) => {
                ExhibitTimedOut?.Invoke(this, new EventArgs());
                Dispose();
            };
        }

        private void ResetTimeout()
        {
            _timeoutTimer.Interval = TIMEOUT_INTERVAL;
        }

        private void MessageReceiveLoop()
        {
            while (true)
            {
                DeviceMessage message = null;
                try 
                {
                    message = DeviceMessage.Parser.ParseJson(_jsonReader.NextJsonObject());
                }
                catch (InvalidProtocolBufferException)
                {
                    Console.WriteLine("InvalidProtobuf");
                    // TODO: proper loging
                    // Failed either due to message having invalid format
                    // If the stream is still open, it will eventually time out.
                    return;
                }
                catch (InvalidDataException)
                {
                    Console.WriteLine("InvalidData");
                    // TODO: proper loging
                    // Failed either due to the stream closing or because of another error.
                    // If the stream is still open, it will eventually time out.
                    return;
                }
                
                switch (message.MessageCase)
                {
                    case DeviceMessage.MessageOneofCase.DeviceDescriptor:
                        ResetTimeout();
                        if (!_accepted)
                            continue; // Ignore if coming from an unaccepted client
                        _descriptor = message.DeviceDescriptor;
                        DescriptorChanged?.Invoke(this, new EventArgs());
                        break;
                    case DeviceMessage.MessageOneofCase.Ping:
                        ResetTimeout();
                        break;
                }
            }
        }

        public void ReceiveConnectionRequest()
        {
            var verInfo = PerformVersionExchange();
            if (!IsVersionCompatible(verInfo))
            {
                Dispose();
                return;
            }

            try
            {
                var request = ConnectionRequest.Parser.ParseJson(_jsonReader.NextJsonObject());
                ConnectionId = request.ConnectionId;
                PublicKey = request.PublicKey.ToStringUtf8();
            }
            catch (InvalidProtocolBufferException)
            {
                // TODO: logging
                Dispose();
                return;
            }
            catch (InvalidDataException)
            {
                // TODO: logging
                Dispose();
                return;
            }

            var ack = new ConnectionAcknowledgement();
            ack.Verified = false;
            ack.WriteJsonTo(_connectionStream);

            _timeoutTimer.Start();

            _receiveLoopTask = Task.Run(MessageReceiveLoop);
        }

        private bool IsVersionCompatible(object verInfo)
        {
            if (verInfo == null)
                return false;
            return true;
        }

        private object PerformVersionExchange()
        {
            var clientInfo = VersionInfo.Parser.ParseJson(_jsonReader.NextJsonObject());

            // TODO: make these build-time constants
            var serverInfo = new VersionInfo();
            serverInfo.Major = 0;
            serverInfo.Minor = 0;
            serverInfo.Patch = 0;
            serverInfo.Build = "";

            serverInfo.WriteJsonTo(_connectionStream);

            return clientInfo;
        }

        public void Dispose()
        {
            _connectionClient.Dispose();
            if (_receiveLoopTask != null && !_receiveLoopTask.IsCompleted)
                _receiveLoopTask.RunSynchronously();
        }

        public void AcceptConnection()
        {
            ConnectionAcknowledgement ack = new ConnectionAcknowledgement();
            ack.ConnectionId = ConnectionId;
            ack.Verified = true;

            try
            {
                ack.WriteJsonTo(_connectionStream);
            }
            catch (Exception)
            {
                Dispose();
                throw;
            }

            _accepted = true;
        }

        public void SendEncryptionInfo()
        {
            ServerMessage message = new ServerMessage();
            message.EncryptionInfo = new EncryptionInfo();

            // TODO: actual certificate
            message.EncryptionInfo.DeviceCertificate = ByteString.CopyFromUtf8("");
        }

        // TODO: proper signature
        public void LoadPackage(bool isPreview, string descriptor)
        {
            ServerMessage message = new ServerMessage();
            message.LoadPackage = new LoadPackage();
            message.LoadPackage.IsPreview = isPreview;
            message.LoadPackage.DescriptorJson = descriptor;

            message.WriteJsonTo(_connectionStream);
        }

        public void ClearPackage(bool purge)
        {
            ServerMessage message = new ServerMessage();
            message.ClearPackage = new ClearPackage();
            message.ClearPackage.PurgeData = purge;

            message.WriteJsonTo(_connectionStream);
        }

        public string GetSocketAddress()
        {
            var endpoint = _connectionClient.Client.LocalEndPoint as IPEndPoint;
            if (endpoint != null)
            {
                if (endpoint.Address.IsIPv4MappedToIPv6)
                {
                    return endpoint.Address.MapToIPv4().ToString();
                }
                else
                {
                    return $"[{endpoint.Address.MapToIPv6().ToString()}]";
                }
            }
            return null;
        }
    }
}