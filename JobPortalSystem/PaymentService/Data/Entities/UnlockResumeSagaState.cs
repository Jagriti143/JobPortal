using MassTransit;

namespace PaymentService.Data.Entities;

public class UnlockResumeSagaState : SagaStateMachineInstance
{
    public Guid CorrelationId { get; set; }
    public string CurrentState { get; set; } = null!;
    
    public Guid RecruiterId { get; set; }
    public Guid ResumeId { get; set; }
    public int PointsToDeduct { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
