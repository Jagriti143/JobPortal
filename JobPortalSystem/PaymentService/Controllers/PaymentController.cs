using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Common;
using PaymentService.Models.DTOs;
using PaymentService.Repositories.Interfaces;
using PaymentService.Services;

namespace PaymentService.Controllers;

[ApiController]
[Route("payments")]
public class PaymentController(
    IWalletService walletService,
    IRazorpayService razorpayService,
    IPaymentRepository paymentRepository,
    ILogger<PaymentController> logger) : ControllerBase
{
    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

    [HttpGet("wallet/balance")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> GetBalance()
    {
        var recruiterId = GetUserId();
        var balance = await walletService.GetBalanceAsync(recruiterId);
        return Ok(ResponseEnvelope<object>.Ok(new { balance }, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Check unlock status for a list of resource IDs in one call.</summary>
    [HttpPost("wallet/unlock-status")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> GetUnlockStatus([FromBody] UnlockStatusRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var recruiterId = GetUserId();
        var result = new Dictionary<string, List<string>>();

        foreach (var resourceId in req.ResourceIds)
        {
            var types = await paymentRepository.GetUnlockedTypesAsync(recruiterId, resourceId);
            result[resourceId.ToString()] = types;
        }

        return Ok(ResponseEnvelope<object>.Ok(result, traceId: traceId));
    }

    /// <summary>Returns the Razorpay public key ID for the frontend checkout.</summary>
    [HttpGet("config")]
    public IActionResult GetConfig([FromServices] IConfiguration config)    {
        var keyId = config["Razorpay:KeyId"] ?? "";
        return Ok(ResponseEnvelope<object>.Ok(new { razorpayKeyId = keyId }, traceId: HttpContext.TraceIdentifier));
    }

    [HttpPost("wallet/purchase")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> Purchase([FromBody] PurchaseRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        try
        {
            var (orderId, amount) = await razorpayService.CreateOrderAsync(req.AmountInPaise);
            return Ok(ResponseEnvelope<object>.Ok(new { orderId, amount, currency = "INR" }, traceId: traceId));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Razorpay order creation failed");
            return StatusCode(502, ResponseEnvelope<object>.Fail("Payment gateway error.", traceId));
        }
    }

    [HttpPost("wallet/verify-payment")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var recruiterId = GetUserId();

        try
        {
            var isValid = razorpayService.VerifyPaymentSignature(req.OrderId, req.PaymentId, req.Signature);
            if (!isValid)
                return BadRequest(ResponseEnvelope<object>.Fail("Invalid payment signature.", traceId));

            var points = req.AmountInPaise / 100;
            var alreadyCredited = await walletService.CreditAsync(
                recruiterId, points, req.PaymentId, req.PaymentId, req.AmountInPaise / 100m);

            if (!alreadyCredited)
                return Ok(ResponseEnvelope<object>.Ok(
                    new { message = "Payment already processed.", points = 0 }, traceId: traceId));

            var newBalance = await walletService.GetBalanceAsync(recruiterId);
            return Ok(ResponseEnvelope<object>.Ok(new
            {
                message = "Payment verified and wallet credited.",
                pointsAdded = points,
                newBalance
            }, traceId: traceId));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Payment verification failed");
            return StatusCode(502, ResponseEnvelope<object>.Fail("Payment verification failed.", traceId));
        }
    }

    [HttpPost("wallet/add-points")]
    [Authorize(Roles = "Recruiter,Admin")]
    public async Task<IActionResult> AddPoints([FromBody] AddPointsRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var recruiterId = req.RecruiterId != Guid.Empty ? req.RecruiterId : GetUserId();

        var idempotencyKey = $"manual_{recruiterId}_{DateTime.UtcNow.Ticks}";
        await walletService.CreditAsync(recruiterId, req.Points, idempotencyKey);
        var balance = await walletService.GetBalanceAsync(recruiterId);

        return Ok(ResponseEnvelope<object>.Ok(new
        {
            message = $"{req.Points} points added.",
            newBalance = balance
        }, traceId: traceId));
    }

    [HttpPost("wallet/webhook")]
    public async Task<IActionResult> Webhook()
    {
        var traceId = HttpContext.TraceIdentifier;
        Request.EnableBuffering();
        var rawBody = await new StreamReader(Request.Body).ReadToEndAsync();

        var signature = Request.Headers["X-Razorpay-Signature"].ToString();
        if (!razorpayService.VerifyWebhookSignature(rawBody, signature))
            return BadRequest(ResponseEnvelope<object>.Fail("Invalid webhook signature.", traceId));

        try
        {
            using var doc = JsonDocument.Parse(rawBody);
            var root = doc.RootElement;
            var eventType = root.GetProperty("event").GetString();

            if (eventType == "payment.captured")
            {
                var payment = root.GetProperty("payload").GetProperty("payment").GetProperty("entity");
                var paymentId = payment.GetProperty("id").GetString()!;
                var amountInPaise = payment.GetProperty("amount").GetInt32();
                var notes = payment.TryGetProperty("notes", out var n) ? n : default;
                var recruiterIdStr = notes.ValueKind != JsonValueKind.Undefined
                    ? notes.TryGetProperty("recruiterId", out var rid) ? rid.GetString() : null
                    : null;

                if (recruiterIdStr == null || !Guid.TryParse(recruiterIdStr, out var recruiterId))
                {
                    logger.LogWarning("Webhook missing recruiterId in notes for payment {PaymentId}", paymentId);
                    return Ok(ResponseEnvelope<object>.Ok(new { message = "Processed" }, traceId: traceId));
                }

                var points = amountInPaise / 100;
                await walletService.CreditAsync(recruiterId, points, paymentId, paymentId, amountInPaise / 100m);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Webhook processing error");
        }

        return Ok(ResponseEnvelope<object>.Ok(new { message = "Processed" }, traceId: traceId));
    }

    [HttpPost("wallet/deduct")]
    public async Task<IActionResult> Deduct([FromBody] DeductRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var (success, error) = await walletService.DeductAsync(req.RecruiterId, req.Action);

        if (!success)
        {
            if (error.Contains("Insufficient"))
                return StatusCode(402, ResponseEnvelope<object>.Fail(error, traceId));
            if (error.Contains("conflict"))
                return Conflict(ResponseEnvelope<object>.Fail(error, traceId));
            return BadRequest(ResponseEnvelope<object>.Fail(error, traceId));
        }

        return Ok(ResponseEnvelope<object>.Ok(new { message = "Points deducted." }, traceId: traceId));
    }

    [HttpPost("wallet/unlock-contact")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> UnlockContact([FromBody] UnlockContactRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var recruiterId = GetUserId();

        // Check if already unlocked — no charge
        if (await paymentRepository.IsUnlockedAsync(recruiterId, req.JobSeekerId, "ContactUnlock"))
        {
            return Ok(ResponseEnvelope<object>.Ok(new
            {
                jobSeekerId = req.JobSeekerId,
                message = "Contact already unlocked.",
                alreadyUnlocked = true
            }, traceId: traceId));
        }

        var (success, error) = await walletService.DeductAsync(recruiterId, "ContactUnlock");
        if (!success)
        {
            if (error.Contains("Insufficient"))
                return StatusCode(402, ResponseEnvelope<object>.Fail(error, traceId));
            return BadRequest(ResponseEnvelope<object>.Fail(error, traceId));
        }

        await paymentRepository.RecordUnlockAsync(recruiterId, req.JobSeekerId, "ContactUnlock");

        return Ok(ResponseEnvelope<object>.Ok(new
        {
            jobSeekerId = req.JobSeekerId,
            message = "Contact unlocked.",
            alreadyUnlocked = false
        }, traceId: traceId));
    }

    [HttpPost("wallet/deduct-resume-view")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> DeductResumeView([FromBody] ResourceRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var recruiterId = GetUserId();

        // View is pay-per-view — always deduct, no unlock tracking
        var (success, error) = await walletService.DeductAsync(recruiterId, "ResumeView");
        if (!success)
            return error.Contains("Insufficient")
                ? StatusCode(402, ResponseEnvelope<object>.Fail(error, traceId))
                : BadRequest(ResponseEnvelope<object>.Fail(error, traceId));

        var balance = await walletService.GetBalanceAsync(recruiterId);
        return Ok(ResponseEnvelope<object>.Ok(new { message = "5 points deducted for resume view.", balance }, traceId: traceId));
    }

    [HttpPost("wallet/deduct-resume-download")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> DeductResumeDownload([FromBody] ResourceRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var recruiterId = GetUserId();

        // Check if already unlocked — no charge
        if (await paymentRepository.IsUnlockedAsync(recruiterId, req.ResourceId, "ResumePdfDownload"))
        {
            var bal = await walletService.GetBalanceAsync(recruiterId);
            return Ok(ResponseEnvelope<object>.Ok(new { message = "Already unlocked.", balance = bal, alreadyUnlocked = true }, traceId: traceId));
        }

        var (success, error) = await walletService.DeductAsync(recruiterId, "ResumePdfDownload");
        if (!success)
            return error.Contains("Insufficient")
                ? StatusCode(402, ResponseEnvelope<object>.Fail(error, traceId))
                : BadRequest(ResponseEnvelope<object>.Fail(error, traceId));

        await paymentRepository.RecordUnlockAsync(recruiterId, req.ResourceId, "ResumePdfDownload");
        var balance = await walletService.GetBalanceAsync(recruiterId);
        return Ok(ResponseEnvelope<object>.Ok(new { message = "15 points deducted for resume download.", balance, alreadyUnlocked = false }, traceId: traceId));
    }

    [HttpGet("wallet/transactions")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var recruiterId = GetUserId();
        var (txns, _) = await paymentRepository.GetTransactionsAsync(recruiterId, page, limit);
        return Ok(ResponseEnvelope<object>.Ok(txns, new { page, limit }, HttpContext.TraceIdentifier));
    }

    [HttpGet("admin/transactions")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllTransactions([FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var (txns, total) = await paymentRepository.GetTransactionsAsync(null, page, limit);
        return Ok(ResponseEnvelope<object>.Ok(txns, new { page, limit, total }, HttpContext.TraceIdentifier));
    }

    [HttpGet("admin/revenue")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetRevenue()
    {
        var revenue = await paymentRepository.GetRevenueReportAsync();
        return Ok(ResponseEnvelope<object>.Ok(revenue, traceId: HttpContext.TraceIdentifier));
    }
}
