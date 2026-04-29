namespace JobPortalSystem.Messages;

// Events (Past tense)
public record UnlockResumeRequested(Guid CorrelationId, Guid RecruiterId, Guid ResumeId);
public record PointsDeducted(Guid CorrelationId);
public record PointsDeductionFailed(Guid CorrelationId, string Reason);
public record ResumeAccessGranted(Guid CorrelationId);
public record PointsRefunded(Guid CorrelationId);

// Commands (Imperative)
public record DeductPointsCommand(Guid CorrelationId, Guid RecruiterId, int PointsToDeduct);
public record GrantResumeAccessCommand(Guid CorrelationId, Guid RecruiterId, Guid ResumeId);
public record RefundPointsCommand(Guid CorrelationId, Guid RecruiterId, int PointsToRefund);
