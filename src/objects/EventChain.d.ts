declare class EventChain {
    constructor({ owner, io, eventSteps, }: {
        owner: any;
        io: any;
        eventSteps?: never[] | undefined;
    });
    triggerStep(): void;
}
export default EventChain;
