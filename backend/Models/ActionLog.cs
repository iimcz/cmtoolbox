namespace backend.Models
{
    public class ActionLog
    {
        public int Id { get; set; }
        public ToolboxUser User { get; set; }
        public string Action { get; set; }
    }

}