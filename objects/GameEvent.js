const EventTypes = {

};
const UnlockTypes = {
  DOCFILE: 'docFile',
  COMMAND: 'command',
};

class GameEvent {
  /**
   *
   * @param {string} params.eventType Type of event
   * @param {Object} [params.timer] Timer
   * @param {Date} [params.timer.triggerDate] Date to trigger the event
   * @param {Date} [params.timer.triggerDate] Date to trigger the event
   * @param {number} params.timer.duration Amount of minutes that the event should last
   * @param {Object} [params.message] Message
   * @param {string[]} params.message.text Array with text to be sent as message
   * @param {string} [params.message.roomName] Name of the room to send a message to
   * @param {boolean} [params.message.shouldBroadcast] Should the message be sent as a broadcast
   * @param {Object} [params.coordinates] GPS coordinates to trigger event on map
   * @param {Object} params.coordinates.latitude Latitude
   * @param {Object} params.coordinates.longitude Longitude
   * @param {Object[]} [params.unlocks] Items that will be sent to public
   * @param {string} params.unlocks[].unlockType Type of item to send to public
   * @param {string} params.unlocks[].unlockValue Value that will be used to send item to public
   */
  constructor({ eventType, timer, message, coordinates, unlocks = [] }) {
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

module.exports = GameEvent;
exports.EventTypes = EventTypes;
exports.UnlockTypes = UnlockTypes;
