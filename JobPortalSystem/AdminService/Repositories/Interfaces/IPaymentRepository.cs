using AdminService.Data;
using AdminService.Models;

namespace AdminService.Repositories.Interfaces;

public interface IPaymentRepository
{
    Task<(List<TransactionReadModel> Transactions, int Total)> GetTransactionsAsync(int page, int limit);
    Task<List<RevenueReportItem>> GetRevenueAsync(string period);
}
