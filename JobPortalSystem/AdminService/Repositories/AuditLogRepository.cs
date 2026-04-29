using AdminService.Data;
using AdminService.Data.Entities;
using AdminService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AdminService.Repositories;

public class AuditLogRepository(AdminDbContext adminDb) : IAuditLogRepository
{
    public Task AddAuditLogAsync(AuditLog log)
    {
        adminDb.AuditLogs.Add(log);
        return adminDb.SaveChangesAsync();
    }

    public async Task<(List<AuditLog> Logs, int Total)> GetAuditLogsAsync(Guid? adminId, string? action, DateTime? from, DateTime? to, int page, int limit)
    {
        var query = adminDb.AuditLogs.AsQueryable();
        
        if (adminId.HasValue) query = query.Where(a => a.AdminId == adminId.Value);
        if (!string.IsNullOrEmpty(action)) query = query.Where(a => a.Action == action);
        if (from.HasValue) query = query.Where(a => a.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(a => a.CreatedAt <= to.Value);

        var total = await query.CountAsync();
        var logs = await query.OrderByDescending(a => a.CreatedAt)
                             .Skip((page - 1) * limit)
                             .Take(limit)
                             .ToListAsync();
                             
        return (logs, total);
    }
}
