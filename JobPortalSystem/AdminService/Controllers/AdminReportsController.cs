using AdminService.Common;
using AdminService.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminService.Controllers;

[ApiController]
[Route("admin")]
[Authorize(Roles = "Admin")]
public class AdminReportsController(
    IAuditLogRepository auditLogRepository,
    IPaymentRepository paymentRepository) : ControllerBase
{
    /// <summary>Get paginated audit logs.</summary>
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] Guid? adminId, [FromQuery] string? action,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var (logs, total) = await auditLogRepository.GetAuditLogsAsync(adminId, action, from, to, page, limit);
        return Ok(ResponseEnvelope<object>.Ok(logs, new { page, limit, total }, HttpContext.TraceIdentifier));
    }

    /// <summary>Get all platform transactions.</summary>
    [HttpGet("reports/transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var (txns, total) = await paymentRepository.GetTransactionsAsync(page, limit);
        return Ok(ResponseEnvelope<object>.Ok(txns, new { page, limit, total }, HttpContext.TraceIdentifier));
    }

    /// <summary>Get revenue report grouped by time period.</summary>
    [HttpGet("reports/revenue")]
    public async Task<IActionResult> GetRevenue([FromQuery] string period = "day")
    {
        var revenue = await paymentRepository.GetRevenueAsync(period);
        return Ok(ResponseEnvelope<object>.Ok(revenue, traceId: HttpContext.TraceIdentifier));
    }
}
