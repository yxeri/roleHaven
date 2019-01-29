/*
 Copyright 2019 Carmilla Mina Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const managerHelper = require('../helpers/manager');
const { dbConfig } = require('../config/defaults/config');
const dbTriggerEvent = require('../db/connectors/triggerEvent');
const authenticator = require('../helpers/authenticator');
const messageManager = require('./messages');
const dbUser = require('../db/connectors/user');
const docFileManager = require('./docFiles');
const errorCreator = require('../error/errorCreator');
const positionManager = require('./positions');

const timedTriggers = new Map();
let baseIo;

/**
 * Update a trigger event.
 * @param {Object} params - Parameters.
 * @param {string} params.eventId - Id of the event to update.
 * @param {Object} params.triggerEvent - Event parameters.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket io.
 * @param {Function} params.callback - Callback.
 * @param {Object} [params.options] - Update options.
 */
function updateTriggerEvent({
  eventId,
  triggerEvent,
  token,
  io,
  callback,
  socket,
  internalCallUser,
  options = {},
}) {
  managerHelper.updateObject({
    options,
    token,
    io,
    socket,
    internalCallUser,
    objectId: eventId,
    object: triggerEvent,
    commandName: dbConfig.apiCommands.UpdateTriggerEvent.name,
    objectType: 'triggerEvent',
    dbCallFunc: dbTriggerEvent.updateTriggerEvent,
    emitType: dbConfig.EmitTypes.TRIGGEREVENT,
    objectIdType: 'eventId',
    getDbCallFunc: dbTriggerEvent.getTriggerEventById,
    getCommandName: dbConfig.apiCommands.GetTriggerEvents.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { triggerEvent: updatedTriggerEvent } = data;

      if (!triggerEvent.isRecurring && !triggerEvent.endTime && !triggerEvent.startTime) {
        timedTriggers.delete(eventId);
      } else if (triggerEvent.startTime || triggerEvent.endTime || triggerEvent.isRecurring) {
        updatedTriggerEvent.updating = false;

        timedTriggers.set(eventId, updatedTriggerEvent);
      }

      callback({ data });
    },
  });
}

/**
 * Get positions.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 */
function getTriggerEventsByOwner({
  token,
  callback,
}) {
  managerHelper.getObjects({
    callback,
    token,
    commandName: dbConfig.apiCommands.GetTriggerEvents.name,
    objectsType: 'triggerEvents',
    dbCallFunc: dbTriggerEvent.getTriggerEventsByOwner,
  });
}

/**
 * Remove a trigger event.
 * @param {Object} params - Parameters.
 * @param {string} params.eventId - Id of the event to remove.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback
 * @param {Object} params.io - Socket io.
 */
function removeTriggerEvent({
  eventId,
  token,
  callback,
  io,
  socket,
  internalCallUser,
}) {
  timedTriggers.delete(eventId);
  managerHelper.removeObject({
    callback,
    token,
    io,
    socket,
    internalCallUser,
    getDbCallFunc: dbTriggerEvent.getTriggerEventById,
    getCommandName: dbConfig.apiCommands.GetTriggerEvents.name,
    objectId: eventId,
    commandName: dbConfig.apiCommands.RemoveTriggerEvent.name,
    objectType: 'triggerEvent',
    dbCallFunc: dbTriggerEvent.removeTriggerEvent,
    emitType: dbConfig.EmitTypes.TRIGGEREVENT,
    objectIdType: 'eventId',
  });
}

/**
 * Create a trigger event.
 * @param {Object} params - Parameters.
 * @param {Object} params.triggerEvent - The trigger event to create.
 * @param {string} params.token - jwt.
 * @param {Object} params.io - Socket.io.
 * @param {Function} params.callback - Callback.
 */
function createTriggerEvent({
  triggerEvent,
  token,
  io,
  internalCallUser,
  callback,
  socket,
}) {
  authenticator.isUserAllowed({
    token,
    internalCallUser,
    commandName: dbConfig.apiCommands.CreateTriggerEvent.name,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      if (!Object.values(dbConfig.TriggerEventTypes).includes(triggerEvent.eventType)) {
        callback({ error: new errorCreator.InvalidData({ expected: `Event type ${Object.values(dbConfig.TriggerEventTypes).toString()}` }) });

        return;
      }

      if (!Object.values(dbConfig.TriggerChangeTypes).includes(triggerEvent.changeType)) {
        callback({ error: new errorCreator.InvalidData({ expected: `Change type ${Object.values(dbConfig.TriggerChangeTypes).toString()}` }) });

        return;
      }

      const { user: authUser } = data;
      const newTriggerEvent = triggerEvent;
      newTriggerEvent.ownerId = authUser.objectId;

      if (!newTriggerEvent.startTime && (newTriggerEvent.terminationTime || newTriggerEvent.isRecurring)) {
        newTriggerEvent.startTime = new Date();
      }

      if (newTriggerEvent.isRecurring) {
        newTriggerEvent.singleUse = false;

        if (!newTriggerEvent.iterations) {
          newTriggerEvent.iterations = 2;
        }
      }

      dbTriggerEvent.createTriggerEvent({
        triggerEvent: newTriggerEvent,
        callback: ({ error: updateError, data: eventData }) => {
          if (updateError) {
            callback({ error: updateError });

            return;
          }

          const { triggerEvent: createdEvent } = eventData;
          const dataToSend = {
            data: {
              triggerEvent: managerHelper.stripObject({ object: Object.assign({}, createdEvent) }),
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          };
          const ioRoom = Number.parseInt(dbConfig.apiCommands.CreateTriggerEvent.accessLevel, 10);

          if (createdEvent.isRecurring || createdEvent.startTime || createdEvent.terminationTime) {
            timedTriggers.set(createdEvent.objectId, createdEvent);
          }

          if (socket) {
            socket.to(ioRoom).broadcast.emit(dbConfig.EmitTypes.TRIGGEREVENT, dataToSend);
          } else {
            io.to(ioRoom).emit(dbConfig.EmitTypes.TRIGGEREVENT, dataToSend);
          }

          callback({
            data: {
              position: createdEvent,
              changeType: dbConfig.ChangeTypes.CREATE,
            },
          });
        },
      });
    },
  });
}

/**
 * Get a trigger event by its Id.
 * @param {Object} params - Parameters.
 * @param {string} params.token - jwt.
 * @param {Function} params.callback - Callback.
 * @param {string} params.eventId - Id of event to retrieve.
 * @param {Object} [params.internalCallUser] - User to use on authentication. It will bypass token authentication.
 */
function getTriggerEventById({
  eventId,
  token,
  callback,
  internalCallUser,
}) {
  managerHelper.getObjectById({
    token,
    internalCallUser,
    callback,
    objectId: eventId,
    objectType: 'triggerEvent',
    objectIdType: 'eventId',
    dbCallFunc: dbTriggerEvent.getTriggerEventById,
    commandName: dbConfig.apiCommands.GetTriggerEvents.name,
  });
}

/**
 * Trigger an event.
 * @param {Object} params - Parameters.
 * @param {string} params.eventId - Id of the event.
 * @param {Function} params.callback - Callback.
 */
function runEvent({
  eventId,
  callback,
}) {
  dbTriggerEvent.getTriggerEventById({
    eventId,
    callback: ({ error, data }) => {
      if (error) {
        callback({ error });

        return;
      }

      const { triggerEvent } = data;

      dbUser.getUserById({
        userId: triggerEvent.ownerId,
        callback: ({ error: userError, data: userData }) => {
          if (userError) {
            callback({ error: userError });

            return;
          }

          const { user } = userData;
          const io = baseIo;

          if (triggerEvent.changeType === dbConfig.TriggerChangeTypes.CREATE) {
            if (triggerEvent.eventType === dbConfig.TriggerEventTypes.CHATMSG) {
              const {
                image,
                message,
              } = triggerEvent.content;

              messageManager.sendChatMsg({
                callback: () => {},
                io,
                message,
                image,
                internalCallUser: user,
              });
            } else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.DOCFILE) {
              docFileManager.createDocFile({
                io,
                callback: () => {},
                internalCallUser: user,
                docFile: triggerEvent.content.docFile,
              });
            } else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.POSITION) {
              positionManager.createPosition({
                io,
                callback: () => {},
                internalCallUser: user,
                position: triggerEvent.content.position,
              });
            }
          } else if (triggerEvent.changeType === dbConfig.TriggerChangeTypes.UPDATE) {
            if (triggerEvent.eventType === dbConfig.TriggerEventTypes.CHATMSG) {
              const {
                messageId,
                message,
              } = triggerEvent.content;

              messageManager.updateMessage({
                io,
                message,
                messageId,
                callback: () => {},
                internalCallUser: user,
              });
            } else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.DOCFILE) {
              const {
                docFileId,
                docFile,
              } = triggerEvent.content;

              docFileManager.updateDocFile({
                docFile,
                docFileId,
                callback: () => {},
                io,
                internalCallUser: user,
              });
            } else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.POSITION) {
              const {
                positionId,
                position,
              } = triggerEvent.content;

              positionManager.updatePosition({
                position,
                positionId,
                io,
                callback: () => {},
                internalCallUser: user,
              });
            }
          } else if (triggerEvent.changeType === dbConfig.TriggerChangeTypes.REMOVE) {
            if (triggerEvent.eventType === dbConfig.TriggerEventTypes.CHATMSG) {
              const {
                messageId,
              } = triggerEvent.content;

              messageManager.removeMesssage({
                io,
                messageId,
                callback: () => {},
                internalCallUser: user,
              });
            } else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.DOCFILE) {
              const {
                docFileId,
              } = triggerEvent.content;

              docFileManager.removeDocFile({
                docFileId,
                callback: () => {},
                io,
                internalCallUser: user,
              });
            } else if (triggerEvent.eventType === dbConfig.TriggerEventTypes.POSITION) {
              const {
                positionId,
              } = triggerEvent.content;

              positionManager.removePosition({
                positionId,
                io,
                callback: () => {},
                internalCallUser: user,
              });
            }
          }

          if ((triggerEvent.isRecurring || triggerEvent.iterations) && triggerEvent.iterations > 0) {
            updateTriggerEvent({
              eventId,
              io,
              triggerEvent: {
                iterations: triggerEvent.iterations - 1,
                startTime: triggerEvent.isRecurring
                  ? new Date()
                  : undefined,
              },
              internalCallUser: user,
              callback: ({ error: updateError, data: updateData }) => {
                if (updateError) {
                  callback({ error: updateError });

                  return;
                }

                timedTriggers.get(triggerEvent.objectId).updating = false;

                callback({ data: updateData });
              },
            });
          } else if (triggerEvent.singleUse || triggerEvent.iterations <= 0) {
            removeTriggerEvent({
              eventId,
              io,
              callback,
              internalCallUser: user,
            });
          }
        },
      });
    },
  });
}

/**
 * Set socket.io
 * @param {Object} io - Socket.io.
 */
function startTriggers(io) {
  baseIo = io;

  dbTriggerEvent.getTimedTriggerEvents({
    callback: ({ error, data }) => {
      if (error) {
        return;
      }

      const { triggerEvents } = data;

      triggerEvents.forEach((triggerEvent) => {
        timedTriggers.set(triggerEvent.objectId, triggerEvent);
      });

      setInterval(() => {
        timedTriggers.forEach((triggerEvent) => {
          if (!triggerEvent.updating) {
            const {
              objectId: eventId,
            } = triggerEvent;
            const now = new Date();
            const startTime = new Date(triggerEvent.startTime);

            if (now > startTime) {
              const future = new Date(startTime);
              future.setSeconds(future.getSeconds() + (triggerEvent.duration || 0));

              if (triggerEvent.terminationTime && now > triggerEvent.terminationTime) {
                dbUser.getUserById({
                  userId: triggerEvent.ownerId,
                  callback: ({ error: userError, data: userData }) => {
                    if (userError) {
                      return;
                    }

                    const { user } = userData;

                    removeTriggerEvent({
                      eventId,
                      io,
                      internalCallUser: user,
                      callback: ({ error: runError }) => {
                        if (runError) {
                          timedTriggers.delete(eventId);
                        }
                      },
                    });
                  },
                });
              } else if (triggerEvent.singleUse || (triggerEvent.isRecurring && now > future)) {
                timedTriggers.get(eventId).updating = true;

                runEvent({
                  eventId,
                  callback: ({ error: runError }) => {
                    if (runError) {
                      timedTriggers.delete(eventId);
                    }
                  },
                });
              }
            }
          }
        });
      }, 100);
    },
  });
}

exports.updateTriggerEvent = updateTriggerEvent;
exports.getTriggerEventsByOwner = getTriggerEventsByOwner;
exports.removeTriggerEvent = removeTriggerEvent;
exports.createTriggerEvent = createTriggerEvent;
exports.getTriggerEventById = getTriggerEventById;
exports.runEvent = runEvent;
exports.startTriggers = startTriggers;
