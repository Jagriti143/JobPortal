using JobPortalSystem.Messages;
using MassTransit;
using PaymentService.Data;
using Microsoft.EntityFrameworkCore;

namespace PaymentService.Consumers;

public class RefundPointsConsumer(PaymentDbContext db, ILogger<RefundPointsConsumer> logger) : IConsumer<RefundPointsCommand>
{
    public async Task Consume(ConsumeContext<RefundPointsCommand> context)
    {
        var msg = context.Message;

        for (int i = 0; i < 3; i++)
        {
            var wallet = await db.RecruiterWallets.FirstOrDefaultAsync(w => w.RecruiterId == msg.RecruiterId);
            if (wallet == null) return; // Cannot refund a non-existent wallet

            wallet.PointsBalance += msg.PointsToRefund;
            wallet.UpdatedAt = DateTime.UtcNow;

            db.Transactions.Add(new PaymentService.Data.Entities.Transaction
            {
                WalletId = wallet.Id,
                Type = PaymentService.Data.Entities.TransactionType.Credit,
                Points = msg.PointsToRefund,
                IdempotencyKey = $"SAGA-REFUND-{msg.CorrelationId}",
                CreatedAt = DateTime.UtcNow
            });

            try
            {
                await db.SaveChangesAsync();
                logger.LogInformation("Refunded {Points} back to {RecruiterId} for failed saga {CorrelationId}", msg.PointsToRefund, msg.RecruiterId, msg.CorrelationId);
                await context.Publish(new PointsRefunded(msg.CorrelationId));
                return;
            }
            catch (DbUpdateConcurrencyException)
            {
                db.ChangeTracker.Clear();
            }
        }
    }
}
