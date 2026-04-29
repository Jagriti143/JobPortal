using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Data.Entities;

namespace PaymentService.Services;

public class DeductionRuleSeedService(IServiceProvider services, ILogger<DeductionRuleSeedService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();

        if (!await db.PointsDeductionRules.AnyAsync(cancellationToken))
        {
            db.PointsDeductionRules.AddRange(
                new PointsDeductionRule { Action = "ResumeView",        Points = 5  },
                new PointsDeductionRule { Action = "ResumePdfDownload", Points = 15 },
                new PointsDeductionRule { Action = "ContactUnlock",     Points = 10 }
            );
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Seeded PointsDeductionRules: ResumeView=5, ResumePdfDownload=15, ContactUnlock=10");
        }
        else
        {
            // Update existing rules to new values and add ResumePdfDownload if missing
            var rules = await db.PointsDeductionRules.ToListAsync(cancellationToken);
            foreach (var rule in rules)
            {
                if (rule.Action == "ResumeView")    rule.Points = 5;
                if (rule.Action == "ContactUnlock") rule.Points = 10;
            }
            if (!rules.Any(r => r.Action == "ResumePdfDownload"))
                db.PointsDeductionRules.Add(new PointsDeductionRule { Action = "ResumePdfDownload", Points = 15 });
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
