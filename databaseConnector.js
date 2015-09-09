'use strict';

const mongoose = require('mongoose');
const config = require('./config/config');
const logger = require('./logger');
const dbPath = 'mongodb://' +
               config.dbHost + ':' +
               config.dbPort + '/' +
               config.dbName;
mongoose.connect(dbPath, function(err) {
  if (err) {
    logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to connect to database', err);
  } else {
    logger.sendInfoMsg('Connection established to database');
  }
});

// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

const userSchema = new mongoose.Schema({
  userName : { type : String, unique : true },
  password : String,
  socketId : String,
  accessLevel : { type : Number, default : 1 },
  visibility : { type : Number, default : 1 },
  rooms : [{ type : String, unique : true }],
  position : {},
  lastOnline : Date,
  verified : { type : Boolean, default : false },
  banned : { type : Boolean, default : false },
  online : { type : Boolean, default : false },
  registerDevice : String,
  authGroups : [{ type : String, unique : true }]
}, { collection : 'users' });
const roomSchema = new mongoose.Schema({
  roomName : { type : String, unique : true },
  password : { type : String, default : '' },
  accessLevel : { type : Number, default : 1 },
  visibility : { type : Number, default : 1 },
  commands : [{
    commandName : String,
    accessLevel : Number,
    requireAdmin : Boolean
  }],
  admins : [{ type : String, unique : true }],
  bannedUsers : [{ type : String, unique : true }],
  owner : String
}, { collection : 'rooms' });
const historySchema = new mongoose.Schema({
  roomName : { type : String, unique : true },
  messages : [{
    text : [String],
    time : Date,
    user : String
  }]
}, { collection : 'histories' });
const commandSchema = new mongoose.Schema({
  commandName : String,
  accessLevel : Number,
  visibility : Number,
  authGroup : String,
  category : String
}, { collection : 'commands' });
const schedEventSchema = new mongoose.Schema({
  receiverName : String,
  func : {},
  createdAt : Date,
  endAt : Date
}, { collection : 'events' });
const deviceSchema = new mongoose.Schema({
  deviceId : { type : String, unique : true },
  socketId : String,
  alias : { type : String, unique : true },
  lastUser : String
}, { collection : 'devices' });

// Blodsband specific schemas
const entitySchema = new mongoose.Schema({
  entityName : { type : String, unique : true },
  keys : [String],
  verified : [Boolean]
}, { collection : 'entities' });
const encryptionKeySchema = new mongoose.Schema({
  key : { type : String, unique : true },
  used : Boolean,
  usedBy : String,
  reusable : Boolean
}, { collection : 'encryptionKeys' });

const User = mongoose.model('User', userSchema);
const Room = mongoose.model('Room', roomSchema);
const History = mongoose.model('History', historySchema);
const Command = mongoose.model('Command', commandSchema);
const SchedEvent = mongoose.model('SchedEvent', schedEventSchema);
const Device = mongoose.model('Device', deviceSchema);

// Blodsband specific
const Entity = mongoose.model('Entity', entitySchema);
const EncryptionKey = mongoose.model('EncryptionKey', encryptionKeySchema);

function addEncryptionKeys(keys, callback) {
  const findCallback = function(err, foundKey, newKey) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to find an encryption key', err);
    } else if (foundKey === null) {
      newKey.save(function(err, newKey) {
        if (err) {
          logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to save encryption key', err);
        }

        callback(err, newKey);
      });
    } else {
      callback(err, null);
    }
  };

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const newKey = new EncryptionKey(key);
    const query = { key : key.key };

    EncryptionKey.findOne(query).lean().exec(function(err, foundKey) {
      findCallback(err, foundKey, newKey);
    });
  }
}

function updateDeviceAlias(deviceId, value, callback) {
  const query = { deviceId : deviceId };
  const update = { $set : { alias : value } };
  const options = { new : true };

  Device.findOneAndUpdate(query, update, options).lean().exec(
    function (err, device) {
      if (err) {
        logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update device Id', err);
      }

      callback(err, device);
    }
  );
}

function updateDeviceSocketId(deviceId, socketId, user, callback) {
  const query = { deviceId : deviceId };
  const update = { $set : {
    socketId : socketId,
    lastUser : user
  } };
  const options = { new : true };

  Device.findOneAndUpdate(query, update, options).lean().exec(
    function (err, device) {
      if (err) {
        logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update device socket Id', err);
        callback(err, null);
      } else if (device === null) {
        const newDevice = new Device({
          deviceId : deviceId,
          socketId : socketId,
          lastUser : user,
          alias : deviceId
        });

        newDevice.save(function(err, newDevice) {
          if (err) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to save device', err);
          }

          callback(err, newDevice);
        });
      } else {
        callback(err, device);
      }
    }
  );
}

function updateCommandVisibility(cmdName, value, callback) {
  const query = { commandName : cmdName };
  const update = { $set : { visibility : value } };
  const options = { new : true };

  Command.findOneAndUpdate(query, update, options).lean().exec(
    function(err, cmd) {
      if (err) {
        logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update command visibility', err);
      }

      callback(err, cmd);
    }
  );
}

function updateCommandAccessLevel(cmdName, value, callback) {
  const query = { commandName : cmdName };
  const update = { $set : { accessLevel : value } };
  const options = { new : true };

  Command.findOneAndUpdate(query, update, options).lean().exec(
    function(err, cmd) {
      if (err) {
        logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update command access level', err);
      }

      callback(err, cmd);
    }
  );
}

function addGroupToUser(userName, group, callback) {
  const query = { userName : userName };
  const update = { $push : { group : group } };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update user', err);
    }

    callback(err, user);
  });
}

function addEntities(entities, callback) {
  const findCallback = function(err, foundEntity, newEntity) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to find an entity', err);
    } else if (foundEntity === null) {
      newEntity.save(function(err, newEntity) {
        if (err) {
          logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to save entity', err);
        }

        callback(err, newEntity);
      });
    } else {
      callback(err, null);
    }
  };

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const query = { entityName : entity.entityName };
    const newEntity = new Entity(entity);

    Entity.findOne(query).lean().exec(function(err, foundEntity) {
      findCallback(err, foundEntity, newEntity);
    });
  }
}

function unlockEntity(sentKey, sentEntityName, sentUserName, callback) {
  const keyQuery = { key : sentKey};
  const keyUpdate = { used : true, usedBy : sentUserName };

  EncryptionKey.findOneAndUpdate(keyQuery, keyUpdate).lean().
    exec(function(err, key) {
      if (err || key === null) {
        logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update key', sentKey, err);
        callback(err, null);
      } else if (key.reusable || !key.used) {
        const entityQuery = { entityName : sentEntityName };
        const entityUpdate = { $push : { keys : key.key } };

        Entity.findOneAndUpdate(
          entityQuery, entityUpdate
        ).lean().exec(function(err, entity) {
            if (err || entity === null) {
              const rollbackQuery = { key : sentKey };
              const rollbackUpdate = { used : false, usedBy : '' };

              logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to find and update entity', err);

              // Rollback
              EncryptionKey.findOneAndUpdate(
                rollbackQuery, rollbackUpdate
              ).lean().exec(function(err) {
                  if (err) {
                    logger.sendErrorMsg(logger.ErrorCodes.db,
                      'Failed to do a rollback on key',
                      sentKey
                    );
                  }
                });
            }

            callback(err, entity);
          });
      } else {
        callback(err, null);
      }
    });
}

function getAllEntities(callback) {
  const sort = { entityName : 1 };
  const filter = { _id : 0 };

  Entity.find({}, filter).sort(sort).lean().exec(function(err, entities) {
    if (err || entities === null) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get all entities', err);
    }

    callback(err, entities);
  });
}

function getAllCommands(callback) {
  const filter = { _id : 0 };

  Command.find({}, filter).lean().exec(function(err, commands) {
    if (err || commands === null) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get all command', err);
    }

    callback(err, commands);
  });
}

function getEncryptionKey(sentKey, callback) {
  const query = { key : sentKey };
  const filter = { _id : 0 };

  EncryptionKey.findOne(query, filter).lean().exec(function(err, key) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get encryption key', err);
    }

    callback(err, key);
  });
}

function getUserByDevice(deviceCode, callback) {
  const query = { $or : [{ deviceId : deviceCode }, { alias : deviceCode }] };

  Device.findOne(query).lean().exec(function(err, device) {
    if (err || device === null) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get device', err);
      callback(err, null);
    } else {
      const userQuery = { socketId : device.socketId };

      User.findOne(userQuery).lean().exec(function(err, user) {
        if (err || user === null) {
          logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get user by device', err);
        }

        callback(err, user);
      });
    }
  });
}

function getDevice(deviceCode, callback) {
  const query = { $or : [{ deviceId : deviceCode }, { alias : deviceCode }] };

  Device.findOne(query).lean().exec(function(err, device) {
    if (err || device === null) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get device', err);
    }

    callback(err, device);
  });
}

function getUserById(sentSocketId, callback) {
  const query = { socketId : sentSocketId };
  const filter = { _id : 0 };

  User.findOne(query, filter).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get user', err);
    }

    callback(err, user);
  });
}

function authUser(sentUserName, sentPassword, callback) {
  const query = {
    $and : [{ userName : sentUserName }, { password : sentPassword }]
  };

  User.findOne(query).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to login', err);
    }

    callback(err, user);
  });
}

function addUser(user, callback) {
  const newUser = new User(user);
  const query = { userName : user.userName };

  User.findOne(query).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to find user');
    } else if (user === null) {
      newUser.save(function(err, newUser) {
        if (err) {
          logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to save user', err);
        }

        callback(err, newUser);
      });
    } else {
      callback(err, null);
    }
  });
}

function addMsgToHistory(sentRoomName, sentMessage, callback) {
  const query = { roomName : sentRoomName };
  const update = { $push : { messages : sentMessage } };
  const options = { upsert : true, new : true };

  History.findOneAndUpdate(query, update, options).lean().exec(
    function(err, history) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to add message to history', err);
    }

    callback(err, history);
  });
}

function getHistoryFromRoom(roomName, callback) {
  const query = { roomName : roomName };
  const filter = { 'messages._id' : 0, _id : 0 };

  History.find(query, filter).lean().exec(function(err, history) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get history', err);
    }

    callback(err, history);
  });
}

function getHistoryFromRooms(rooms, callback) {
  const query = { roomName : { $in : rooms } };
  const filter = { 'messages._id' : 0, _id : 0 };

  History.find(query, filter).lean().exec(function(err, history) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to retrieve all history from', rooms);
    }

    callback(err, history);
  });
}

function updateUserSocketId(userName, value, callback) {
  const query = { userName : userName };
  const update = { socketId : value, online : true };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update user', err);
    }

    callback(err, user);
  });
}

function updateUserOnline(userName, value, callback) {
  const query = { userName : userName };
  const update = { online : value };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update user', err);
    }

    callback(err, user);
  });
}

function updateUserLocation(sentUserName, sentPosition, callback) {
  const query = { userName : sentUserName };
  const update = { position : sentPosition };

  User.findOneAndUpdate(query, update).lean().exec(function(err) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update user', err);
    }

    callback(err);
  });
}

function verifyUser(sentUserName, callback) {
  const query = { userName : sentUserName };
  const newVarupdate = { verified : true };

  User.findOneAndUpdate(query, newVarupdate).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to verify user', err);
    }

    callback(err, user);
  });
}

function verifyAllUsers(callback) {
  const query = { verified : false };
  const update = { $set : { verified : true } };
  const options = { multi : true };

  User.update(query, update, options).lean().exec(function(err) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to verify all user', err);
    }

    callback(err);
  });
}

function getAllDevices(callback) {
  const query = {};
  const filter = { _id : 0 };

  Device.find(query, filter).lean().exec(function(err, devices) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get all devices', err);
    }

    callback(err, devices);
  });
}

function authUserToRoom(sentUser, sentRoomName, sentPassword, callback) {
  const query = {
    $and : [
      { accessLevel : { $lte : sentUser.accessLevel } },
      { roomName : sentRoomName },
      { password : sentPassword }
    ]
  };

  Room.findOne(query).lean().exec(function(err, room) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to check auth against room', err);
    }

    callback(err, room);
  });
}

// TODO Move findOne for user to outside of the database function
function createRoom(sentRoom, sentUser, callback) {
  const newRoom = new Room(sentRoom);
  const newHistory = new History({ roomName : sentRoom.roomName });
  let query;

  if (sentUser && sentUser.accessLevel < 11) {
    query = {
      $or : [
        { roomName : sentRoom.roomName },
        { owner : sentRoom.owner }
      ]
    };
  } else {
    query = { roomName : sentRoom.roomName };
  }

  // Checks if room already exists
  Room.findOne(query).lean().exec(function(err, room) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to find if room already exists', err);
      // Room doesn't exist in the collection, so let's add it!
    } else if (room === null) {
      // Checks if history for room already exists
      History.findOne(query).lean().exec(function(err, history) {
        if (err) {
          logger.sendErrorMsg(logger.ErrorCodes.db,
            'Failed to find if history already exists', err
          );
          // History doesn't exist in the collection, so let's
          // add it and the room!
        } else if (history === null) {
          newHistory.save(function(err, newHistory) {
            if (err || newHistory === null) {
              logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to save history', err);
            } else {
              newRoom.save(function(err, newRoom) {
                if (err) {
                  logger.sendErrorMsg(logger.ErrorCodes.db,
                    'Failed to save room', err);
                }

                callback(err, newRoom);
              });
            }
          });
        }
      });
    } else {
      callback(err, null);
    }
  });
}

function getAllUsers(sentUser, callback) {
  const query = { visibility : { $lte : sentUser.accessLevel } };
  const sort = { userName : 1 };
  const filter = { _id : 0 };

  User.find(query, filter).sort(sort).lean().exec(function(err, users) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to list users', err);
    }

    callback(err, users);
  });
}

function getRoom(sentRoomName, callback) {
  const query = { roomName : sentRoomName };
  const filter = { _id : 0 };

  Room.findOne(query, filter).lean().exec(function(err, room) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get room ', sentRoomName, err);
    }

    callback(err, room);
  });
}

function getOwnedRooms(sentUser, callback) {
  const query = { owner : sentUser.userName };
  const sort = { roomName : 1 };
  const filter = { _id : 0 };

  Room.find(query, filter).sort(sort).lean().exec(function(err, rooms) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get owned rooms', err);
    }

    callback(err, rooms);
  });
}

function getAllRooms(sentUser, callback) {
  const query = { visibility : { $lte : sentUser.accessLevel } };
  const sort = { roomName : 1 };
  const filter = { _id : 0 };

  Room.find(query, filter).sort(sort).lean().exec(function(err, rooms) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to list rooms', err);
    }

    callback(err, rooms);
  });
}

function getAllUserLocations(sentUser, callback) {
  const query = { visibility : { $lte : sentUser.accessLevel } };
  const sort = { userName : 1 };
  const filter = { _id : 0 };

  User.find(query, filter).sort(sort).lean().exec(function(err, users) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get all user locations', err);
    }

    callback(err, users);
  });
}

function getUserLocation(sentUser, sentUserName, callback) {
  const query = {
    $and : [
      { visibility : { $lte : sentUser.accessLevel } },
      { userName : sentUserName }
    ]
  };
  const filter = { _id : 0 };

  User.findOne(query, filter).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get all user locations', err);
    }

    callback(err, user);
  });
}

function addRoomToUser(sentUserName, sentRoomName, callback) {
  const query = { userName : sentUserName };
  const update = { $addToSet : { rooms : sentRoomName } };

  User.findOneAndUpdate(query, update).lean().exec(function(err) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to add room to user', err);
    }

    callback(err);
  });
}

function removeRoomFromUser(sentUserName, sentRoomName, callback) {
  const query = { userName : sentUserName };
  const update = { $pull : { rooms : sentRoomName } };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to remove room from user', err);
    }

    callback(err, user);
  });
}

function setUserLastOnline(sentUserName, sentDate, callback) {
  const query = { userName : sentUserName };
  const update = { lastOnline : sentDate };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update last online on', sentUserName, err);
    }

    logger.sendErrorMsg(logger.ErrorCodes.db, 'Updated', sentUserName, 'with', sentDate);

    callback(err, user);
  });
}

function getUnverifiedUsers(callback) {
  const query = { verified : false };
  const filter = { _id : 0 };
  const sort = { userName : 1 };

  User.find(query, filter).sort(sort).lean().exec(function(err, users) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get unverified users', err);
    }

    callback(err, users);
  });
}

function banUser(sentUserName, callback) {
  const query = { userName : sentUserName };
  const update = { banned : true, socketId : '' };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to ban user', err);
    }

    callback(err, user);
  });
}

function banUserFromRoom(sentUserName, sentRoomName, callback) {
  const query = { roomName : sentRoomName };
  const update = { $addToSet : { bannedUsers : sentUserName } };

  Room.findOneAndUpdate(query, update).lean().exec(function(err, room) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db,
        'Failed to ban user', sentUserName,
        ' from room ', sentRoomName, err
      );
    }

    callback(err, room);
  });
}

function unbanUserFromRoom(sentUserName, sentRoomName, callback) {
  const query = { roomName : sentRoomName };
  const update = { $pull : { bannedUsers : sentUserName } };

  Room.findOneAndUpdate(query, update).lean().exec(function(err, room) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db,
        'Failed to unban user', sentUserName,
        ' from room ', sentRoomName, err
      );
    }

    callback(err, room);
  });
}

function unbanUser(sentUserName, callback) {
  const query = { userName : sentUserName };
  const update = { banned : false };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to unban user', err);
    }

    callback(err, user);
  });
}

function getBannedUsers(callback) {
  const query = { banned : true };
  const filter = { userName : 1, _id : 0 };
  const sort = { userName : 1 };

  User.find(query, filter).sort(sort).lean().exec(function(err, users) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get banned users', err);
    }

    callback(err, users);
  });
}

function addEvent(sentReceiverName, sentEndAt, callback) {
  const now = new Date();
  const query = {
    receiverName : sentReceiverName,
    createdAt : now,
    endAt : sentEndAt
  };
  const newEvent = new SchedEvent(query);

  newEvent.save(function(err, newEvent) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to save event', err);
    }

    callback(err, newEvent);
  });
}

function getPassedEvents(callback) {
  const now = new Date();
  const query = { endAt : { $lte : now } };
  const filter = { _id : 0 };

  SchedEvent.find(query, filter).lean().exec(function(err, events) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to trigger events', err);
    }

    callback(err, events);
  });
}

function removeRoom(sentRoomName, sentUser, callback) {
  let query;

  if (sentUser.accessLevel >= 11) {
    query = { roomName : sentRoomName };
  } else {
    query = {
      $and : [
        { owner : sentUser.userName },
        { roomName : sentRoomName }
      ]
    };
  }

  Room.findOneAndRemove(query).lean().exec(function(err, room) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to remove room', err);
    } else if (room !== null) {
      History.findOneAndRemove({ roomName : sentRoomName }).lean().exec(
        function(err, history) {
          if (err) {
            logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to remove history', err);
          } else if (history !== null) {
            callback(err, history);
          } else {
            callback(err, null);
          }
        });
    } else {
      callback(err, null);
    }
  });
}

function populateDbRooms(sentRooms, user) {
  const roomCallback = function(err, room) {
    if (err || room === null) {
      logger.sendErrorMsg(logger.ErrorCodes.db,
        'PopulateDb: [failure] Failed to create room', err);
    } else {
      logger.sendInfoMsg('PopulateDb: [success] Created room');
    }
  };

  Room.find().lean().exec(function(err, rooms) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'PopulateDb: [failure] Failed to find rooms', err);
    } else if (rooms === null || rooms.length < 3) {
      const roomKeys = Object.keys(sentRooms);

      logger.sendErrorMsg(logger.ErrorCodes.db, 'PopulateDb: [failure] One of the main rooms are missing');
      logger.sendInfoMsg('PopulateDb: Creating rooms from defaults');

      for (let i = 0; i < roomKeys.length; i++) {
        const room = sentRooms[roomKeys[i]];

        createRoom(room, user, roomCallback);
      }
    } else {
      logger.sendInfoMsg('PopulateDb: [success] DB has all the main rooms');
    }
  });
}

function populateDbUsers(sentUsers) {
  User.count({}).exec(function(err, userCount) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'PopulateDb: [failure] Failed to count users', err);
    } else if (userCount < 1) {
      const userKeys = Object.keys(sentUsers);
      const callback = function(err, user) {
        if (err || user === null) {
          logger.sendErrorMsg(logger.ErrorCodes.db,
            'PopulateDb: [failure] Failed to create user', err);
        } else {
          logger.sendInfoMsg('PopulateDb: [success] Created user', user.userName, user.password);
        }
      };

      logger.sendErrorMsg(logger.ErrorCodes.db, 'PopulateDb: [failure] There are no users');
      logger.sendInfoMsg('PopulateDb: Creating users from defaults');

      for (let i = 0; i < userKeys.length; i++) {
        const user = sentUsers[userKeys[i]];

        addUser(user, callback);
      }
    } else {
      logger.sendInfoMsg('PopulateDb: [success] DB has at least one user');
    }
  });
}

function populateDbCommands(sentCommands) {
  const cmdKeys = Object.keys(sentCommands);
  const callback = function(err) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db,
        'PopulateDb: [failure] Failed to update command',
        err
      );
    }
  };

  for (let i = 0; i < cmdKeys.length; i++) {
    const command = sentCommands[cmdKeys[i]];
    const query = { commandName : command.commandName };
    const options = { upsert : true };

    Command.findOneAndUpdate(query, command, options).lean().exec(callback);
  }
}

function updateUserVisibility(userName, value, callback) {
  const query = { userName : userName };
  const update = { visibility : value };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update user', err);
    }

    callback(err, user);
  });
}

function updateUserAccessLevel(userName, value, callback) {
  const query = { userName : userName };
  const update = { accessLevel : value };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update user', err);
    }

    callback(err, user);
  });
}

function updateRoomVisibility(roomName, value, callback) {
  const query = { roomName : roomName };
  const update = { visibility : value };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update room', err);
    }

    callback(err, user);
  });
}

function updateRoomAccessLevel(roomName, value, callback) {
  const query = { roomName : roomName };
  const update = { accessLevel : value };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update room', err);
    }

    callback(err, user);
  });
}

function updateUserPassword(userName, value, callback) {
  const query = { userName : userName };
  const update = { password : value };

  User.findOneAndUpdate(query, update).lean().exec(function(err, user) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to update password', err);
    }

    callback(err, user);
  });
}

function getCommand(commandName, callback) {
  const query = { commandName : commandName };

  Command.findOne(query).lean().exec(function(err, command) {
    if (err) {
      logger.sendErrorMsg(logger.ErrorCodes.db, 'Failed to get command', err);
    }

    callback(err, command);
  });
}

exports.getCommand = getCommand;
exports.getUserById = getUserById;
exports.authUser = authUser;
exports.addUser = addUser;
exports.updateUserSocketId = updateUserSocketId;
exports.updateUserLocation = updateUserLocation;
exports.authUserToRoom = authUserToRoom;
exports.createRoom = createRoom;
exports.getAllUsers = getAllUsers;
exports.getAllRooms = getAllRooms;
exports.getAllUserLocations = getAllUserLocations;
exports.getUserLocation = getUserLocation;
exports.addRoomToUser = addRoomToUser;
exports.removeRoomFromUser = removeRoomFromUser;
exports.addMsgToHistory = addMsgToHistory;
exports.getHistoryFromRoom = getHistoryFromRoom;
exports.setUserLastOnline = setUserLastOnline;
exports.getHistoryFromRooms = getHistoryFromRooms;
exports.updateUserPassword = updateUserPassword;
exports.verifyUser = verifyUser;
exports.getUnverifiedUsers = getUnverifiedUsers;
exports.verifyAllUsers = verifyAllUsers;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.getBannedUsers = getBannedUsers;
exports.addEvent = addEvent;
exports.getPassedEvents = getPassedEvents;
exports.getRoom = getRoom;
exports.banUserFromRoom = banUserFromRoom;
exports.unbanUserFromRoom = unbanUserFromRoom;
exports.getOwnedRooms = getOwnedRooms;
exports.removeRoom = removeRoom;
exports.populateDbUsers = populateDbUsers;
exports.populateDbRooms = populateDbRooms;
exports.updateUserVisibility = updateUserVisibility;
exports.updateUserAccessLevel = updateUserAccessLevel;
exports.updateRoomVisibility = updateRoomVisibility;
exports.updateRoomAccessLevel = updateRoomAccessLevel;
exports.updateCommandVisibility = updateCommandVisibility;
exports.updateCommandAccessLevel = updateCommandAccessLevel;
exports.addGroupToUser = addGroupToUser;
exports.getAllCommands = getAllCommands;
exports.populateDbCommands = populateDbCommands;
exports.updateDeviceAlias = updateDeviceAlias;
exports.updateDeviceSocketId = updateDeviceSocketId;
exports.updateUserOnline = updateUserOnline;
exports.getUserByDevice = getUserByDevice;
exports.getDevice = getDevice;
exports.getAllDevices = getAllDevices;

//Blodsband specific
exports.addEncryptionKeys = addEncryptionKeys;
exports.addEntities = addEntities;
exports.unlockEntity = unlockEntity;
exports.getAllEntities = getAllEntities;
exports.getEncryptionKey = getEncryptionKey;
