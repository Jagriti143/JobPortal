using Microsoft.EntityFrameworkCore;
using PaymentService.Data.Entities;
using PaymentService.Repositories.Interfaces;

namespace PaymentService.Services;

public class WalletService(IPaymentRepository paymentRepository, ILogger<WalletService> logger) : IWalletService
{
    public Task EnsureWalletExistsAsync(Guid recruiterId)
    {
        return paymentRepository.EnsureWalletExistsAsync(recruiterId);
    }

    public async Task<int> GetBalanceAsync(Guid recruiterId)
    {
        var wallet = await paymentRepository.GetWalletAsync(recruiterId);
        return wallet?.PointsBalance ?? 0;
    }

    public async Task<(bool success, string error)> DeductAsync(Guid recruiterId, string action)
    {
        var rule = await paymentRepository.GetDeductionRuleAsync(action);
        if (rule == null) return (false, $"No deduction rule found for action '{action}'.");

        const int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                var wallet = await paymentRepository.GetWalletAsync(recruiterId);
                if (wallet == null) return (false, "Wallet not found.");
                if (wallet.PointsBalance < rule.Points)
                    return (false, $"Insufficient points. Required: {rule.Points}, Available: {wallet.PointsBalance}.");

                wallet.PointsBalance -= rule.Points;
                wallet.UpdatedAt = DateTime.UtcNow;

                await paymentRepository.UpdateWalletAsync(wallet);

                await paymentRepository.AddTransactionAsync(new Transaction
                {
                    WalletId = wallet.Id,
                    Type = TransactionType.Debit,
                    Points = rule.Points,
                    Description = action
                });

                await paymentRepository.SaveChangesAsync();
                return (true, string.Empty);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                logger.LogWarning(ex, "Concurrency conflict on deduction attempt {Attempt} for recruiter {RecruiterId}", attempt + 1, recruiterId);
                foreach (var entry in ex.Entries) await entry.ReloadAsync();
                if (attempt == maxRetries - 1)
                    return (false, "Concurrent modification conflict. Please retry.");
            }
        }

        return (false, "Deduction failed after retries.");
    }

    public async Task<bool> CreditAsync(Guid recruiterId, int points, string idempotencyKey,
        string? razorpayPaymentId = null, decimal? amountPaid = null)
    {
        if (await paymentRepository.TransactionIdempotencyExistsAsync(idempotencyKey))
        {
            logger.LogInformation("Duplicate webhook idempotency key {Key} — skipping credit", idempotencyKey);
            return false;
        }

        await paymentRepository.EnsureWalletExistsAsync(recruiterId);
        var wallet = await paymentRepository.GetWalletAsync(recruiterId);

        if (wallet == null)
            return false;

        wallet.PointsBalance += points;
        wallet.UpdatedAt = DateTime.UtcNow;

        await paymentRepository.UpdateWalletAsync(wallet);

        await paymentRepository.AddTransactionAsync(new Transaction
        {
            WalletId = wallet.Id,
            Type = TransactionType.Credit,
            Points = points,
            IdempotencyKey = idempotencyKey,
            RazorpayPaymentId = razorpayPaymentId,
            AmountPaid = amountPaid,
            Currency = "INR",
            Description = "Points purchase"
        });

        await paymentRepository.SaveChangesAsync();
        return true;
    }
}
