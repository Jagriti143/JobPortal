using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ResumeService.Data;
using ResumeService.Data.Entities;

namespace TestApp
{
    public class Program
    {
        public static async Task Main()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ResumeDbContext>(options =>
                options.UseSqlServer("Server=SYSTUMM\\SQLEXPRESS;Initial Catalog=ApplicationDb;Integrated Security=True;Connect Timeout=30;Encrypt=True;TrustServerCertificate=True;"));
            var provider = services.BuildServiceProvider();
            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ResumeDbContext>();
            
            // just a dummy script to check if we can connect
            var canConnect = await db.Database.CanConnectAsync();
            Console.WriteLine($"Can connect: {canConnect}");
        }
    }
}
