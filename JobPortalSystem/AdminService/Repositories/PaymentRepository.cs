using AdminService.Data;
using AdminService.Models;
using AdminService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AdminService.Repositories;

public class PaymentRepository(PaymentReadDbContext paymentDb) : IPaymentRepository
{
    public async Task<(List<TransactionReadModel> Transactions, int Total)> GetTransactionsAsync(int page, int limit)
    {
        var total = await paymentDb.Transactions.CountAsync();
        var txns = await paymentDb.Transactions
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();
            
        return (txns, total);
    }

    public async Task<List<RevenueReportItem>> GetRevenueAsync(string period)
    {
        return await paymentDb.Transactions
            .Where(t => t.Type == "Credit" && t.AmountPaid.HasValue)
            .GroupBy(t => t.CreatedAt.Date)
            .Select(g => new RevenueReportItem 
            { 
                Date = g.Key, 
                TotalAmount = g.Sum(t => t.AmountPaid ?? 0), 
                Count = g.Count() 
            })
            .OrderByDescending(r => r.Date)
            .ToListAsync();
    }
}
