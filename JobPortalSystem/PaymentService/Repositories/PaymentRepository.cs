using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Data.Entities;
using PaymentService.Models.DTOs;
using PaymentService.Repositories.Interfaces;

namespace PaymentService.Repositories;

public class PaymentRepository(PaymentDbContext db) : IPaymentRepository
{
    public Task<RecruiterWallet?> GetWalletAsync(Guid recruiterId)
    {
        return db.RecruiterWallets.FirstOrDefaultAsync(w => w.RecruiterId == recruiterId);
    }

    public async Task EnsureWalletExistsAsync(Guid recruiterId)
    {
        if (!await db.RecruiterWallets.AnyAsync(w => w.RecruiterId == recruiterId))
        {
            db.RecruiterWallets.Add(new RecruiterWallet { RecruiterId = recruiterId });
            await db.SaveChangesAsync();
        }
    }

    public Task UpdateWalletAsync(RecruiterWallet wallet)
    {
        db.RecruiterWallets.Update(wallet);
        return Task.CompletedTask;
    }

    public Task AddTransactionAsync(Transaction transaction)
    {
        db.Transactions.Add(transaction);
        return Task.CompletedTask;
    }

    public Task<bool> TransactionIdempotencyExistsAsync(string idempotencyKey)
    {
        return db.Transactions.AnyAsync(t => t.IdempotencyKey == idempotencyKey);
    }

    public Task<PointsDeductionRule?> GetDeductionRuleAsync(string action)
    {
        return db.PointsDeductionRules.FirstOrDefaultAsync(r => r.Action == action && r.IsActive);
    }

    public async Task<(List<TransactionResponseDto> Transactions, int TotalCount)> GetTransactionsAsync(Guid? recruiterId, int page, int limit)
    {
        var query = db.Transactions.AsQueryable();
        
        if (recruiterId.HasValue)
        {
            var wallet = await db.RecruiterWallets.FirstOrDefaultAsync(w => w.RecruiterId == recruiterId.Value);
            if (wallet == null) return (new List<TransactionResponseDto>(), 0);
            query = query.Where(t => t.WalletId == wallet.Id);
        }

        var total = await query.CountAsync();
        var txns = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return (txns.Select(TransactionResponseDto.FromEntity).ToList(), total);
    }

    public async Task<List<RevenueReportDto>> GetRevenueReportAsync()
    {
        return await db.Transactions
            .Where(t => t.Type == TransactionType.Credit && t.AmountPaid.HasValue)
            .GroupBy(t => t.CreatedAt.Date)
            .Select(g => new RevenueReportDto
            {
                Date = g.Key,
                TotalAmount = g.Sum(t => t.AmountPaid ?? 0),
                Count = g.Count()
            })
            .OrderByDescending(r => r.Date)
            .ToListAsync();
    }

    public Task SaveChangesAsync()
    {
        return db.SaveChangesAsync();
    }

    public Task<bool> IsUnlockedAsync(Guid recruiterId, Guid resourceId, string unlockType)
    {
        return db.RecruiterUnlocks.AnyAsync(u =>
            u.RecruiterId == recruiterId &&
            u.ResourceId == resourceId &&
            u.UnlockType == unlockType);
    }

    public async Task RecordUnlockAsync(Guid recruiterId, Guid resourceId, string unlockType)
    {
        var exists = await IsUnlockedAsync(recruiterId, resourceId, unlockType);
        if (!exists)
        {
            db.RecruiterUnlocks.Add(new RecruiterUnlock
            {
                RecruiterId = recruiterId,
                ResourceId = resourceId,
                UnlockType = unlockType
            });
            await db.SaveChangesAsync();
        }
    }

    public async Task<List<string>> GetUnlockedTypesAsync(Guid recruiterId, Guid resourceId)
    {
        return await db.RecruiterUnlocks
            .Where(u => u.RecruiterId == recruiterId && u.ResourceId == resourceId)
            .Select(u => u.UnlockType)
            .ToListAsync();
    }
}
