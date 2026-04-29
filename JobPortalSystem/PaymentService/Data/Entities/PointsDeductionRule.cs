namespace PaymentService.Data.Entities;

public class PointsDeductionRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Action { get; set; } = string.Empty; // "ResumeView" | "ContactUnlock"
    public int Points { get; set; }
    public bool IsActive { get; set; } = true;
}
