using JobPortalSystem.Messages;
using MassTransit;
using PaymentService.Data.Entities;

namespace PaymentService.Sagas;

public class UnlockResumeSaga : MassTransitStateMachine<UnlockResumeSagaState>
{
    public State DeductingPoints { get; private set; } = null!;
    public State GrantingAccess { get; private set; } = null!;
    public State Compensating { get; private set; } = null!;

    public Event<UnlockResumeRequested> UnlockResumeRequestedEvent { get; private set; } = null!;
    public Event<PointsDeducted> PointsDeductedEvent { get; private set; } = null!;
    public Event<PointsDeductionFailed> PointsDeductionFailedEvent { get; private set; } = null!;
    public Event<ResumeAccessGranted> ResumeAccessGrantedEvent { get; private set; } = null!;
    // Adding optional failure event for granting access if needed
    public Event<PointsRefunded> PointsRefundedEvent { get; private set; } = null!;

    public UnlockResumeSaga()
    {
        InstanceState(x => x.CurrentState);

        Event(() => UnlockResumeRequestedEvent, x => x.CorrelateById(context => context.Message.CorrelationId));
        Event(() => PointsDeductedEvent, x => x.CorrelateById(context => context.Message.CorrelationId));
        Event(() => PointsDeductionFailedEvent, x => x.CorrelateById(context => context.Message.CorrelationId));
        Event(() => ResumeAccessGrantedEvent, x => x.CorrelateById(context => context.Message.CorrelationId));
        Event(() => PointsRefundedEvent, x => x.CorrelateById(context => context.Message.CorrelationId));

        Initially(
            When(UnlockResumeRequestedEvent)
                .Then(context =>
                {
                    context.Saga.CreatedAt = DateTime.UtcNow;
                    context.Saga.RecruiterId = context.Message.RecruiterId;
                    context.Saga.ResumeId = context.Message.ResumeId;
                    context.Saga.PointsToDeduct = 10; // Hardcoded or fetch from rules
                })
                .TransitionTo(DeductingPoints)
                .Send(new Uri("queue:deduct-points"), context => new DeductPointsCommand(
                    context.Saga.CorrelationId,
                    context.Saga.RecruiterId,
                    context.Saga.PointsToDeduct
                ))
        );

        During(DeductingPoints,
            When(PointsDeductedEvent)
                .Then(context => context.Saga.UpdatedAt = DateTime.UtcNow)
                .TransitionTo(GrantingAccess)
                .Send(new Uri("queue:grant-resume-access"), context => new GrantResumeAccessCommand(
                    context.Saga.CorrelationId,
                    context.Saga.RecruiterId,
                    context.Saga.ResumeId
                )),
            When(PointsDeductionFailedEvent)
                .Then(context => context.Saga.UpdatedAt = DateTime.UtcNow)
                .Finalize() // Stop saga if no funds
        );

        // Ideally, if ResumeService errors out or times out, we trigger compensation
        // We will mock this directly for now: if we magically get a failure event, transition to Compensating
        During(GrantingAccess,
            When(ResumeAccessGrantedEvent)
                .Then(context => context.Saga.UpdatedAt = DateTime.UtcNow)
                .Finalize()
            // We would catch a Fault<GrantResumeAccessCommand> here in production to trigger RefundPoints.
        );

        SetCompletedWhenFinalized();
    }
}
