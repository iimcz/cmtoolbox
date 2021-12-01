using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
    public class CMTContext : DbContext
    {
        public DbSet<ToolboxUser> ToolboxUsers { get; set; }
        public DbSet<PresentationDevice> PresentationDevices { get; set; }
        public DbSet<DeviceSensor> DeviceSensors { get; set; }
        public DbSet<PresentationPackage> PresentationPackages { get; set; }
        public DbSet<UnfinishedPackage> UnfinishedPackages { get; set; }
        public DbSet<DataFile> DataFiles { get; set; }

        public CMTContext(DbContextOptions<CMTContext> options) : base(options)
        {
            Database.EnsureDeleted();
            Database.EnsureCreated();
            Database.Migrate();
            // TODO: switch to migrations and a different provider
        }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // dummy data
            // TODO: proper init
            var IPW = new PresentationDevice()
            {
                Id = 1,
                DeviceName = "Interaktivni Stena",
                DeviceShort = "IPW"
            };
            modelBuilder.Entity<PresentationDevice>().HasData(IPW);

            // sensors
            var sensors = new DeviceSensor[] {
                new DeviceSensor
                {
                    Id = 1,
                    DeviceId = IPW.Id,
                    Type = SensorType.Skeletal
                },
                new DeviceSensor
                {
                    Id = 2,
                    DeviceId = IPW.Id,
                    Type = SensorType.Pir
                },
                new DeviceSensor
                {
                    Id = 3,
                    DeviceId = IPW.Id,
                    Type = SensorType.Light
                }
            };

            modelBuilder.Entity<DeviceSensor>().HasData(sensors);
        }
    }
}