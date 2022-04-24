using backend.Models;
using backend.Filters;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using backend.Middleware;
using backend.Communication;
using backend.Utilities;

namespace backend
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddRouting(options =>
            {
                options.LowercaseUrls = true;
            });
            services.AddControllers(options =>
            {
                options.Filters.Add(new DisableFormValueModelBindingAttribute());
            });
            services.AddOpenApiDocument();

            services.AddDbContext<CMTContext>(
                options => options.UseSqlite("Filename=cmt.db")
            );

            services.AddSingleton<ExhibitConnectionManager>();
            services.AddSingleton<EventBus>();
            services.AddHostedService(provider => provider.GetService<ExhibitConnectionManager>());
            services.AddHostedService(provider => provider.GetService<EventBus>());

            services.AddMyHttpContextAccessor();

            services.AddCors();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseOpenApi();
                app.UseSwaggerUi3();
            }

            // HACK: temporarily disable https redirection
            // to get around missing CA issues on presentation
            // devices
            //app.UseHttpsRedirection();

            app.UseRouting();
            app.UseCors(builder =>
                builder.AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod());

            app.UseAuthorization();
            app.UseHttpContext();
            app.UseWebSockets();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
