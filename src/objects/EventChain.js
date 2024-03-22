import GameEvent from './GameEvent';
function unlockItem({ unlock, io, }) {
    switch (unlock.unlockType) {
        case GameEvent.UnlockTypes.DOCFILE: {
            break;
        }
        case GameEvent.UnlockTypes.COMMAND: {
            break;
        }
        default: {
            break;
        }
    }
    io.emit('');
}
function unlockAllItems({ unlocks, io, }) {
    unlocks.forEach((unlock) => {
        unlockItem({
            unlock,
            io,
        });
    });
}
class EventChain {
    constructor({ owner, io, eventSteps = [], }) {
        this.eventSteps = eventSteps;
        this.owner = owner;
        this.io = io;
        this.timeoutInProgress = null;
    }
    triggerStep() {
        if (this.eventSteps.length > 0) {
            const nextGameEvent = this.eventSteps.shift();
            if (nextGameEvent.timer) {
                const now = new Date();
                const future = new Date(nextGameEvent.timer.triggerTime);
                future.setMinutes(future.getMinutes() + nextGameEvent.duration);
                this.timeoutInProgress = setTimeout(() => {
                    unlockAllItems({ unlocks: nextGameEvent.unlocks });
                    this.triggerStep();
                }, future - now);
            }
            else {
                unlockAllItems({ unlocks: nextGameEvent.unlocks });
                this.triggerStep();
            }
        }
        else {
        }
    }
}
export default EventChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRDaGFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkV2ZW50Q2hhaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTLE1BQU0sYUFBYSxDQUFDO0FBT3BDLFNBQVMsVUFBVSxDQUFDLEVBQ2xCLE1BQU0sRUFDTixFQUFFLEdBQ0g7SUFDQyxRQUFRLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUM1QixLQUFLLFNBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNO1FBQ1IsQ0FBQztRQUNELEtBQUssU0FBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU07UUFDUixDQUFDO1FBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNSLE1BQU07UUFDUixDQUFDO0lBQ0QsQ0FBQztJQUNELEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDZCxDQUFDO0FBT0QsU0FBUyxjQUFjLENBQUMsRUFDdEIsT0FBTyxFQUNQLEVBQUUsR0FDSDtJQUNDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUN6QixVQUFVLENBQUM7WUFDVCxNQUFNO1lBQ04sRUFBRTtTQUNILENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELE1BQU0sVUFBVTtJQUNkLFlBQVksRUFDVixLQUFLLEVBQ0wsRUFBRSxFQUNGLFVBQVUsR0FBRyxFQUFFLEdBQ2hCO1FBQ0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMvQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRTlDLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN4QixNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRWhFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUN2QyxjQUFjLENBQUMsRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBQ25ELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDckIsQ0FBQyxFQUFFLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNuQixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sY0FBYyxDQUFDLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckIsQ0FBQztRQUNILENBQUM7YUFBTSxDQUFDO1FBRVIsQ0FBQztJQUNILENBQUM7Q0FDRjtBQUVELGVBQWUsVUFBVSxDQUFDIn0=