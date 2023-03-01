using System;
using System.Net;

public static class IPEndPointExtensions
{
    public static Uri ToUri(this IPEndPoint endPoint, string schema, int port) => new Uri($"{schema}://{endPoint.Address}:{port}");
}