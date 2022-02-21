namespace backend.ViewModels
{
    public class EventMessage
    {
        public EventType Type { get; set; }
    }

    public enum EventType
    {
        ConnectionsUpdated,
        PackageProcessed,
        PackagePreviewUpdated
    }
}