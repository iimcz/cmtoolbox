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
        private readonly double TIMEOUT_INTERVAL = 30_000;

        TcpClient connectionClient;
        Stream connectionStream;
        JsonObjectStringReader jsonReader;
        Timer timeoutTimer;
        Task receiveLoopTask;
        bool accepted = false;

        DeviceDescriptor descriptor = null;

        public string ConnectionId { get; private set; }
        public string PublicKey { get; private set; }


        public bool IsConnected { get { return connectionClient.Connected; } }

        // Events
        public event EventHandler ExhibitTimedOut;
        public event EventHandler DescriptorChanged;

        public ExhibitConnection(TcpClient client)
        {
            connectionClient = client;
            connectionStream = client.GetStream();
            jsonReader = new JsonObjectStringReader(connectionStream);
            timeoutTimer = new Timer(TIMEOUT_INTERVAL);
            timeoutTimer.AutoReset = false;
            timeoutTimer.Elapsed += (object sender, ElapsedEventArgs e) => {
                ExhibitTimedOut?.Invoke(this, new EventArgs());
                Dispose();
            };
        }

        private void ResetTimeout()
        {
            timeoutTimer.Interval = TIMEOUT_INTERVAL;
        }

        private void MessageReceiveLoop()
        {
            while (true)
            {
                DeviceMessage message = null;
                try 
                {
                    message = DeviceMessage.Parser.ParseJson(jsonReader.NextJsonObject());
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
                        if (!accepted)
                            continue; // Ignore if coming from an unaccepted client
                        descriptor = message.DeviceDescriptor;
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
                var request = ConnectionRequest.Parser.ParseJson(jsonReader.NextJsonObject());
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
            ack.WriteJsonTo(connectionStream);

            timeoutTimer.Start();

            receiveLoopTask = Task.Run(MessageReceiveLoop);
        }

        private bool IsVersionCompatible(object verInfo)
        {
            if (verInfo == null)
                return false;
            return true;
        }

        private object PerformVersionExchange()
        {
            var clientInfo = VersionInfo.Parser.ParseJson(jsonReader.NextJsonObject());

            // TODO: make these build-time constants
            var serverInfo = new VersionInfo();
            serverInfo.Major = 0;
            serverInfo.Minor = 0;
            serverInfo.Patch = 0;
            serverInfo.Build = "";

            serverInfo.WriteJsonTo(connectionStream);

            return clientInfo;
        }

        public void Dispose()
        {
            connectionClient.Dispose();
            if (receiveLoopTask != null && !receiveLoopTask.IsCompleted)
                receiveLoopTask.RunSynchronously();
        }

        public void AcceptConnection()
        {
            ConnectionAcknowledgement ack = new ConnectionAcknowledgement();
            ack.ConnectionId = ConnectionId;
            ack.Verified = true;

            try
            {
                ack.WriteJsonTo(connectionStream);
            }
            catch (Exception)
            {
                Dispose();
                throw;
            }

            accepted = true;
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

            message.WriteJsonTo(connectionStream);
        }

        public void ClearPackage(bool purge)
        {
            ServerMessage message = new ServerMessage();
            message.ClearPackage = new ClearPackage();
            message.ClearPackage.PurgeData = purge;

            message.WriteJsonTo(connectionStream);
        }
    }
}