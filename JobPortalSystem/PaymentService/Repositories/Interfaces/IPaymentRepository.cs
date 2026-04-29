using PaymentService.Data.Entities;
using PaymentService.Models.DTOs;

namespace PaymentService.Repositories.Interfaces;

public interface IPaymentRepository
{
    Task<RecruiterWallet?> GetWalletAsync(Guid recruiterId);
    Task EnsureWalletExistsAsync(Guid recruiterId);
    Task UpdateWalletAsync(RecruiterWallet wallet);
    Task AddTransactionAsync(Transaction transaction);
    Task<bool> TransactionIdempotencyExistsAsync(string idempotencyKey);
    Task<PointsDeductionRule?> GetDeductionRuleAsync(string action);
    Task<(List<TransactionResponseDto> Transactions, int TotalCount)> GetTransactionsAsync(Guid? recruiterId, int page, int limit);
    Task<List<RevenueReportDto>> GetRevenueReportAsync();
    Task SaveChangesAsync();

    // Unlock tracking
    Task<bool> IsUnlockedAsync(Guid recruiterId, Guid resourceId, string unlockType);
    Task RecordUnlockAsync(Guid recruiterId, Guid resourceId, string unlockType);
    Task<List<string>> GetUnlockedTypesAsync(Guid recruiterId, Guid resourceId);
}
