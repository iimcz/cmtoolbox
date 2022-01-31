namespace backend.ViewModels
{
    public class EventMessage
    {
        public EventType Type;
    }

    public enum EventType
    {
        ConnectionsUpdated
    }
}