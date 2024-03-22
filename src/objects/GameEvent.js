const EventTypes = {};
const UnlockTypes = {
    DOCFILE: 'docFile',
    COMMAND: 'command',
};
class GameEvent {
    constructor({ eventType, timer, message, coordinates, unlocks = [], }) {
        this.eventType = eventType;
        this.timer = timer;
        this.message = message;
        this.coordinates = coordinates;
        this.unlocks = unlocks;
        this.isDone = false;
    }
    setIsDone(isDone) {
        this.isDone = isDone;
    }
}
export default GameEvent;
export { EventTypes };
export { UnlockTypes };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2FtZUV2ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiR2FtZUV2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUN0QixNQUFNLFdBQVcsR0FBRztJQUNsQixPQUFPLEVBQUUsU0FBUztJQUNsQixPQUFPLEVBQUUsU0FBUztDQUNuQixDQUFDO0FBRUYsTUFBTSxTQUFTO0lBbUJiLFlBQVksRUFDVixTQUFTLEVBQ1QsS0FBSyxFQUNMLE9BQU8sRUFDUCxXQUFXLEVBQ1gsT0FBTyxHQUFHLEVBQUUsR0FDYjtRQUNDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQy9CLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxTQUFTLENBQUMsTUFBTTtRQUNkLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7Q0FDRjtBQUVELGVBQWUsU0FBUyxDQUFDO0FBQ3pCLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQztBQUN0QixPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUMifQ==