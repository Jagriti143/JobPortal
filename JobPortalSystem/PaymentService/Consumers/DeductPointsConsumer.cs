using JobPortalSystem.Messages;
using MassTransit;
using PaymentService.Data;
using Microsoft.EntityFrameworkCore;

namespace PaymentService.Consumers;

public class DeductPointsConsumer(PaymentDbContext db, ILogger<DeductPointsConsumer> logger) : IConsumer<DeductPointsCommand>
{
    public async Task Consume(ConsumeContext<DeductPointsCommand> context)
    {
        var msg = context.Message;
        
        // Optimistic concurrency retry logic
        for (int i = 0; i < 3; i++)
        {
            var wallet = await db.RecruiterWallets.FirstOrDefaultAsync(w => w.RecruiterId == msg.RecruiterId);
            if (wallet == null)
            {
                logger.LogWarning("Wallet not found for recruiter {RecruiterId}", msg.RecruiterId);
                await context.Publish(new PointsDeductionFailed(msg.CorrelationId, "WALLET_NOT_FOUND"));
                return;
            }

            if (wallet.PointsBalance < msg.PointsToDeduct)
            {
                logger.LogWarning("Insufficient points for {RecruiterId}", msg.RecruiterId);
                await context.Publish(new PointsDeductionFailed(msg.CorrelationId, "INSUFFICIENT_POINTS"));
                return;
            }

            wallet.PointsBalance -= msg.PointsToDeduct;
            wallet.UpdatedAt = DateTime.UtcNow;

            db.Transactions.Add(new PaymentService.Data.Entities.Transaction
            {
                WalletId = wallet.Id,
                Type = PaymentService.Data.Entities.TransactionType.Debit,
                Points = msg.PointsToDeduct,
                IdempotencyKey = $"SAGA-DEDUCT-{msg.CorrelationId}",
                CreatedAt = DateTime.UtcNow
            });

            try
            {
                await db.SaveChangesAsync();
                logger.LogInformation("Successfully deducted {Points} from {RecruiterId} for Saga {CorrelationId}", msg.PointsToDeduct, msg.RecruiterId, msg.CorrelationId);
                await context.Publish(new PointsDeducted(msg.CorrelationId));
                return;
            }
            catch (DbUpdateConcurrencyException)
            {
                logger.LogWarning("Concurrency exception deduct points for saga {CorrelationId}, retry {Retry}", msg.CorrelationId, i);
                // Reload entity explicitly for retry
                db.ChangeTracker.Clear();
            }
        }

        // Only reach here if all 3 retries failed due to highly concurrent wallet changes
        await context.Publish(new PointsDeductionFailed(msg.CorrelationId, "CONCURRENCY_ERROR"));
    }
}
