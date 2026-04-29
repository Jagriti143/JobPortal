using AdminService.Data.Entities;

namespace AdminService.Repositories.Interfaces;

public interface IAuditLogRepository
{
    Task AddAuditLogAsync(AuditLog log);
    Task<(List<AuditLog> Logs, int Total)> GetAuditLogsAsync(Guid? adminId, string? action, DateTime? from, DateTime? to, int page, int limit);
}
