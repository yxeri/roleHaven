declare const EventTypes: {};
declare const UnlockTypes: {
    DOCFILE: string;
    COMMAND: string;
};
declare class GameEvent {
    constructor({ eventType, timer, message, coordinates, unlocks, }: {
        eventType: any;
        timer: any;
        message: any;
        coordinates: any;
        unlocks?: never[] | undefined;
    });
    setIsDone(isDone: any): void;
}
export default GameEvent;
export { EventTypes };
export { UnlockTypes };
