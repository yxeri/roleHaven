import GameEvent from './GameEvent';

/**
 * Unlock item
 * @param {Object} params.unlock Unlock
 * @param {Object} params.io socket io
 */
function unlockItem({
  unlock,
  io,
}) {
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

/**
 * Unlocks all items
 * @param {Object[]} params.unlocks Unlocks
 * @param {Object} params.io Socket io
 */
function unlockAllItems({
  unlocks,
  io,
}) {
  unlocks.forEach((unlock) => {
    unlockItem({
      unlock,
      io,
    });
  });
}

class EventChain {
  constructor({
    owner,
    io,
    eventSteps = [],
  }) {
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
      } else {
        unlockAllItems({ unlocks: nextGameEvent.unlocks });
        this.triggerStep();
      }
    } else {
      // TODO Chain completion
    }
  }
}

export default EventChain;
