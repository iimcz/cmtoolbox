

using Microsoft.AspNetCore.Identity;

namespace backend.Models
{
    public class ToolboxUser : IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
}