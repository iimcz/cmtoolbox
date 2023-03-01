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
using Grpc.Net.Client;
using Grpc.Core;
using System.Net.NetworkInformation;
using System.Linq;
using Microsoft.Extensions.Logging;
using Google.Protobuf.WellKnownTypes;
using System.Collections.Generic;

namespace backend.Communication
{
    public class ExhibitConnection
    {
        private static readonly double PING_INTERVAL = 10_000;
        private static readonly int CURRENT_PROTOCOL_VERSION = 2;

        ILogger<ExhibitConnection> _logger;

        GrpcChannel _exhibitChannel;
        ConnectionService.ConnectionServiceClient _connectionServiceClient;
        DeviceService.DeviceServiceClient _deviceServiceClient;
        PackageService.PackageServiceClient _packageServiceClient;
        Timer _pingTimer;

        private IPEndPoint _beaconSource;


        public DeviceDescriptorResponse Descriptor { get; private set; }

        public string ConnectionId { get; private set; }
        public string ExhibitType { get; private set; }


        public bool IsCompatible { get; private set; }
        public bool IsConnected { get; private set; }

        // Events
        public event EventHandler<bool> ConnectedChanged;
        public event EventHandler<DeviceDescriptorResponse> DescriptorChanged;

        private ExhibitConnection(BeaconMessage beacon, IPEndPoint beaconSource, bool useSSL, ILogger<ExhibitConnection> logger = null)
        {
            _logger = logger;
            _beaconSource = beaconSource;
            var channelAddress = beaconSource.ToUri(useSSL ? "https" : "http", 3917);
            _exhibitChannel = GrpcChannel.ForAddress(channelAddress, new GrpcChannelOptions
            {
                // TODO: proper settings
            });
            _connectionServiceClient = new ConnectionService.ConnectionServiceClient(_exhibitChannel);
            _deviceServiceClient = new DeviceService.DeviceServiceClient(_exhibitChannel);
            _packageServiceClient = new PackageService.PackageServiceClient(_exhibitChannel);

            _pingTimer = new Timer();
            _pingTimer.AutoReset = true;
            _pingTimer.Elapsed += doPingExhibit;

            ConnectionId = beacon.Hostname;
        }

        private async void doPingExhibit(object sender, ElapsedEventArgs e)
        {
            PingRequest request = new PingRequest() { Msg = System.DateTime.UtcNow.Ticks.ToString() };
            PingResponse response;

            try
            {
                response = await _connectionServiceClient.PingAsync(request);
            }
            catch (RpcException ex)
            {
                _logger?.LogWarning(ex, "[{0}] Device timed out. Disconnecting.", ConnectionId);
                await Disconnect();
                return;
            }

            if (request.Msg != response.Echo)
            {
                _logger?.LogWarning("[{0}] Device timed out. Disconnecting.", ConnectionId);
                await Disconnect();
                return;
            }

            _pingTimer.Interval = PING_INTERVAL;
        }

        public static ExhibitConnection FromBeacon(byte[] beaconPacket, IPEndPoint beaconSource, bool useSSL = false, ILogger<ExhibitConnection> logger = null)
        {
            var message = BeaconMessage.Parser.ParseFrom(beaconPacket);
            if (!isVersionCompatible(message.ProtocolVersion))
            {
                logger?.LogError("[{0}] Device of type {1} uses incompatible protocol version: {2}!", message.Hostname, message.DeviceType, message.ProtocolVersion);
                return null;
            }

            var connection = new ExhibitConnection(message, beaconSource, useSSL, logger);

            return connection;
        }

        public async Task Disconnect()
        {
            _pingTimer.Stop();
            await _exhibitChannel.ShutdownAsync();

            _logger?.LogInformation("[{0}] Device disconnected.", ConnectionId);
            IsConnected = false;
            ConnectedChanged?.Invoke(this, IsConnected);
        }

        public async Task Connect()
        {
            try
            {
                Descriptor = await _deviceServiceClient.GetDeviceDescriptorAsync(new Google.Protobuf.WellKnownTypes.Empty());
                DescriptorChanged?.Invoke(this, Descriptor);
            }
            catch (RpcException e)
            {
                _logger?.LogError(e, "[{0}] Failed to get device descriptor! Disconnecting device.", ConnectionId);
                await _exhibitChannel.ShutdownAsync();
            }

            _pingTimer.Interval = PING_INTERVAL;
            _pingTimer.Start();
            _logger?.LogInformation("[{0}] Device descriptor received, device successfully connected.", ConnectionId);

            IsConnected = true;
            ConnectedChanged?.Invoke(this, IsConnected);
        }

        private static bool isVersionCompatible(int version)
        {
            return version == CURRENT_PROTOCOL_VERSION;
        }


        public async Task<bool> LoadPackage(bool isPreview, string descriptor)
        {
            var response = await _packageServiceClient.LoadPackageAsync(new LoadPackageRequest
            {
                IsPreview = isPreview,
                DescriptorJson = descriptor
            });
            return response.Value;
        }

        public async Task<bool> StartPackage(string packageId)
        {
            var response = await _packageServiceClient.StartPackageAsync(new StartPackageRequest
            {
                PackageId = packageId
            });
            return response.Value;
        }

        public async Task<bool> SetStartupPackage(string packageId)
        {
            var response = await _packageServiceClient.SetStartupPackageAsync(new SetStartupPackageRequest
            {
                PackageId = packageId
            });
            return response.Value;
        }

        public async Task<string> GetStartupPackage()
        {
            var response = await _packageServiceClient.GetStartupPackageAsync(new Empty());
            return response.PackageId;
        }

        public async Task<bool> ClearStartupPackage(bool purge)
        {
            var response = await _packageServiceClient.ClearStartupPackageAsync(new ClearStartupPackageRequest
            {
                PurgeData = purge
            });
            return response.Value;
        }

        public async Task PurgeCachedPackages()
        {
            await _packageServiceClient.PurgeCachedPackagesAsync(new Empty());
        }

        public IPAddress GetSocketAddress()
        {
            // Use an UDP socket "connected" to our destination address
            // to figure out the source address. System assigns an address to the socket with the connect syscall.
            // Source: https://stackoverflow.com/a/54156187
            using (Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp))
            {
                socket.Bind(new IPEndPoint(IPAddress.Any, 0));
                socket.Connect(_beaconSource);

                return ((IPEndPoint)socket.LocalEndPoint).Address;
            }
        }
    }
}