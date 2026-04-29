using AdminService.Common;
using AdminService.Data.Entities;
using AdminService.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AdminService.Controllers;

[ApiController]
[Route("admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController(
    IUserRepository userRepository,
    IAuditLogRepository auditLogRepository,
    ILogger<AdminUsersController> logger) : ControllerBase
{
    private Guid GetAdminId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

    /// <summary>List all users (paginated).</summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? role, [FromQuery] string? search,
        [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var (users, total) = await userRepository.GetUsersAsync(role, search, page, limit);
        return Ok(ResponseEnvelope<object>.Ok(users, new { page, limit, total }, HttpContext.TraceIdentifier));
    }

    /// <summary>Update user role.</summary>
    [HttpPut("{userId:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid userId, [FromBody] UpdateRoleRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var validRoles = new[] { "JobSeeker", "Recruiter", "Admin" };
        if (!validRoles.Contains(req.Role))
            return BadRequest(ResponseEnvelope<object>.Fail($"Invalid role. Must be one of: {string.Join(", ", validRoles)}", traceId));

        var user = await userRepository.GetUserByIdAsync(userId);
        if (user == null) return NotFound(ResponseEnvelope<object>.Fail("User not found.", traceId));

        var oldRole = user.Role;
        user.Role = req.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await userRepository.UpdateUserAsync(user);

        await auditLogRepository.AddAuditLogAsync(new AuditLog
        {
            AdminId = GetAdminId(),
            Action = "UpdateUserRole",
            TargetType = "User",
            TargetId = userId,
            Details = $"{{\"oldRole\":\"{oldRole}\",\"newRole\":\"{req.Role}\"}}"
        });

        return Ok(ResponseEnvelope<object>.Ok(new { userId, role = req.Role }, traceId: traceId));
    }

    /// <summary>Soft-delete a user.</summary>
    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        var traceId = HttpContext.TraceIdentifier;
        var user = await userRepository.GetUserByIdAsync(userId);
        if (user == null) return NotFound(ResponseEnvelope<object>.Fail("User not found.", traceId));

        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        await userRepository.UpdateUserAsync(user);

        await auditLogRepository.AddAuditLogAsync(new AuditLog
        {
            AdminId = GetAdminId(),
            Action = "DeleteUser",
            TargetType = "User",
            TargetId = userId,
            Details = $"{{\"email\":\"{user.Email}\"}}"
        });

        return Ok(ResponseEnvelope<object>.Ok(new { userId, deleted = true }, traceId: traceId));
    }
}

public class UpdateRoleRequest { public string Role { get; set; } = string.Empty; }
