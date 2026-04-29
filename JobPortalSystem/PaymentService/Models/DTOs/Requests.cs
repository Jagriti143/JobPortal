namespace PaymentService.Models.DTOs;

public class PurchaseRequest { public int AmountInPaise { get; set; } }
public class DeductRequest { public Guid RecruiterId { get; set; } public string Action { get; set; } = string.Empty; }
public class UnlockContactRequest { public Guid JobSeekerId { get; set; } }
public class ResourceRequest { public Guid ResourceId { get; set; } }
public class UnlockStatusRequest { public List<Guid> ResourceIds { get; set; } = new(); }
public class VerifyPaymentRequest
{
    public string OrderId { get; set; } = string.Empty;
    public string PaymentId { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public int AmountInPaise { get; set; }
}
public class AddPointsRequest
{
    public Guid RecruiterId { get; set; }
    public int Points { get; set; }
}
