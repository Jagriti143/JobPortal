using JobPortalSystem.Messages;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using ResumeService.Data;

namespace ResumeService.Consumers;

public class GrantResumeAccessConsumer(ResumeDbContext db, ILogger<GrantResumeAccessConsumer> logger) : IConsumer<GrantResumeAccessCommand>
{
    public async Task Consume(ConsumeContext<GrantResumeAccessCommand> context)
    {
        var msg = context.Message;
        
        var request = await db.ResumeUnlockRequests.FirstOrDefaultAsync(r => 
            r.RecruiterId == msg.RecruiterId && r.ResumeId == msg.ResumeId && r.Status == "Pending");

        if (request != null)
        {
            request.Status = "Granted";
            request.UpdatedAt = DateTime.UtcNow;

            var exists = await db.UnlockedResumes.AnyAsync(u => u.RecruiterId == msg.RecruiterId && u.ResumeId == msg.ResumeId);
            if (!exists)
            {
                db.UnlockedResumes.Add(new ResumeService.Data.Entities.UnlockedResume
                {
                    RecruiterId = msg.RecruiterId,
                    ResumeId = msg.ResumeId,
                    UnlockedAt = DateTime.UtcNow
                });
            }

            try
            {
                await db.SaveChangesAsync();
                logger.LogInformation("Granted resume access to {RecruiterId} for {ResumeId}", msg.RecruiterId, msg.ResumeId);
                await context.Publish(new ResumeAccessGranted(msg.CorrelationId));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to write grant access into DB. Saga will stall or need compensation.");
                // Here we could publish a Fault/Fail event if we added one, causing the Saga to Refund Points.
            }
        }
    }
}
