var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/bbr2', function(err) {
    if(err) {
        console.log('Failed to connect to database', err);
    } else {
        console.log('Connection established to database');
    }
});

// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

var userSchema = new mongoose.Schema({
    userName : { type : String, unique : true },
    password : String,
    socketId : String,
    accessLevel : { type : Number, default : 1 },
    visibility : { type : Number, default : 1 },
    rooms : [{ type : String, unique : true }],
    position : {},
    lastOnline : Date
}, { collection : 'users' });
var roomSchema = new mongoose.Schema({
    roomName : { type : String, unique : true },
    password : { type : String, default : '' },
    accessLevel : { type : Number, default : 1 },
    visibility : { type : Number, default : 1 },
    commands : [{
        commandName : String,
        accessLevel : Number
    }]
}, { collection : 'rooms' });
var historySchema = new mongoose.Schema({
    roomName : { type : String, unique : true },
    messages : [{
        text : [String],
        time : Date,
        user : String
    }]
}, { collection : 'histories' });
var commandSchema = new mongoose.Schema({
    commandName : String,
    func : {},
    help : [String],
    instructions : [String],
    clearAfterUse : Boolean
}, { collection : 'commands' });

// Blodsband specific schemas
var entitySchema = new mongoose.Schema({
    entityName : { type : String, unique : true },
    keys : [String],
    verified : [Boolean]
}, { collection : 'entities' });
var encryptionKeySchema = new mongoose.Schema({
    key : { type : String, unique : true },
    used : Boolean,
    usedBy : String
}, { collection : 'encryptionKeys' });

var User = mongoose.model('User', userSchema);
var Room = mongoose.model('Room', roomSchema);
var Command = mongoose.model('Command', commandSchema);
var History = mongoose.model('History', historySchema);
// Blodsband specific
var Entity = mongoose.model('Entity', entitySchema);
var EncryptionKey = mongoose.model('EncryptionKey', encryptionKeySchema);

function addEncryptionKey() {

}

function addEntity(entity, callback) {
    var newEntity = new Entity(entity);

    Entity.findOne({ entityName : sentEntityName }).lean().exec(function(err, entity) {
        if(err) {
            console.log('Failed to find an entity', err);
        } else if(entity === null) {
            newEntity.save(function(err, newEntity) {
                if(err) {
                    console.log('Failed to save entity', err);
                }

                callback(err, newEntity);
            })
        } else {
            callback(err, null);
        }
    });
}

function unlockEntity(sentKey, sentEntityName, callback) {
    EncryptionKey.findOneAndUpdate({ key : sentKey, used : false }, { used : true }).lean().exec(function(err, key) {
        if(err || key === null) {
            console.log('Failed to update key', sentKey, err);
            callback(err, null);
        } else {
            Entity.findOneAndUpdate({ entityName : sentEntityName }, { $addToSet : { keys : key.key }}).lean().exec(function(err, entity) {
                if(err || entity === null) {
                    console.log('Failed to find and update entity', err);

                    // Rollback
                    EncryptionKey.findOneAndUpdate({ key : sentKey }, { used : false }).lean().exec(function(err, key) {
                        if(err) { console.log('Failed to do a rollback on key', sentKey); }
                    });
                }

                callback(err, entity);
            });
        }
    });
}

function getAllEntities(callback) {
    Entity.find().sort({ entityName : 1 }).lean().exec(function(err, entities) {
        if(err || entities === null) {
            console.log('Failed to get all entities', err);
        }

        callback(err, entities);
    });
}

function getEncryptionKey(sentKey, callback) {
    EncryptionKey.findOne({ key : sentKey }).lean().exec(function(err, key) {
        if(err) {
            console.log('Failed to get encryption key', err);
        }

        callback(err, key);
    });
}

function getUserById(sentSocketId, callback) {
    User.findOne({ socketId : sentSocketId }).lean().exec(function(err, user) {
        if(err) {
            console.log('Failed to get user', err);
        }

        callback(err, user)
    });
}

function authUser(sentUserName, sentPassword, callback) {
	User.findOne({ $and : [{ userName : sentUserName }, { password : sentPassword }] }).lean().exec(function(err, user) {
        if(err) {
            console.log('Failed to login', err);
        }

        callback(err, user);
    });
}

function addUser(user, callback) {
    var newUser = new User(user);

    User.findOne({ userName : user.userName }).lean().exec(function(err, user) {
        if(err) {
            console.log('Failed to find user');
        } else if(user === null) {
            newUser.save(function(err, newUser) {
                if(err) {
                    console.log('Failed to save user', err);
                }

                callback(err, newUser);
            });
        } else {
            callback(err, null);
        }
    });
}

function addMsgToHistory(sentRoomName, sentMessage, callback) {
    History.findOneAndUpdate({ roomName : sentRoomName }, { $push : { messages : sentMessage }}).lean().exec(function(err, history) {
        if(err) {
            console.log('Failed to add message to history', err);
        }

        callback(err, history);
    });
}

function getHistoryFromRoom(sentRoomName, length, callback) {
    History.find({ roomName : sentRoomName }).lean().exec(function(err, history) {
        if(err) {
            console.log('Failed to get history', err);
        }

        callback(err, history);
    });
}

function getAllUserHistory(rooms, sentLastOnline, callback) {
    History.find({ roomName : { $in : rooms }}).lean().exec(function(err, history) {
        if(err) {
            console.log('Failed to retrieve all history from', rooms);
        }

        callback(err, history);
    });
}

function updateUserSocketId(sentUserName, value, callback) {
    User.findOneAndUpdate({ userName : sentUserName }, { socketId : value }).lean().exec(function(err, user) {
        if(err) {
            console.log('Failed to update user', err);
        }

        callback(err, user);
    });
}

function updateUserLocation(sentUserName, sentPosition, callback) {
    User.findOneAndUpdate({ userName : sentUserName }, { position : sentPosition }).lean().exec(function(err) {
        if(err) {
            console.log('Failed to update user', err);
        }

        callback(err);
    });
}

function authUserToRoom(sentUser, sentRoomName, sentPassword, callback) {
	Room.findOne({ $and : [{ accessLevel : { $lte : sentUser.accessLevel } }, { roomName : sentRoomName }, { password : sentPassword }] }).lean().exec(function(err, room) {
        if(err) {
            console.log('Failed to check auth against room', err);
        }

        callback(err, room);
    });
}

function createRoom(sentRoom, callback) {
    var newRoom = new Room(sentRoom);
    var newHistory = new History({ roomName : sentRoom.roomName });

    // Checks if room already exists
    Room.findOne({ roomName : sentRoom.roomName }).lean().exec(function(err, room) {
        if(err) {
            console.log('Failed to find if room already exists', err);
        // Room doesn't exist in the collection, so let's add it!
        } else if(room === null) {
            // Checks if history for room already exists
            History.findOne({ roomName : sentRoom.roomName }).lean().exec(function(err, history) {
               if(err) {
                    console.log('Failed to find if history already exists', err);
               // History doesn't exist in the collection, so let's add it and the room!
               } else if(history === null) {
                   newHistory.save(function(err, newHistory) {
                      if(err || newHistory === null) {
                          console.log('Failed to save history', err);
                      } else {
                          newRoom.save(function(err, newRoom) {
                              if(err) {
                                  console.log('Failed to save room', err);
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
    User.find({ accessLevel : { $lte : sentUser.accessLevel } }).sort({ userName : 1 }).lean().exec(function(err, users) {
        if(err) {
            console.log('Failed to list users', err);    
        }

        callback(err, users);
    });
}

function getAllRooms(sentUser, callback) {
    Room.find({ accessLevel : { $lte : sentUser.accessLevel } }).sort({ roomName : 1 }).lean().exec(function(err, rooms) {
        if(err) {
            console.log('Failed to list rooms', err);
        }

        callback(err, rooms);
    });
}

function getAllUserLocations(sentUser, callback) {
    User.find({ accessLevel : { $lte : sentUser.accessLevel } }).sort({ userName : 1 }).lean().exec(function(err, users) {
        if(err) {
            console.log('Failed to get all user locations', err);
        }

        callback(err, users);
    });
}

function getUserLocation(sentUser, sentUserName, callback) {
    User.findOne({ $and : [{ accessLevel : { $lte : sentUser.accessLevel }}, { userName : sentUserName }] }).lean().exec(function(err, user) {
        if(err) {
            console.log('Failed to get all user locations', err);
        }

        callback(err, user);
    });
}

function addRoomToUser(sentUserName, sentRoomName, callback) {
    User.findOneAndUpdate({ userName : sentUserName }, { $addToSet : { rooms : sentRoomName }}).lean().exec(function(err, user) {
        if(err) {
            console.log('Failed to add room to user', err);
        }

        callback(err);
    });
}

function removeRoomFromUser(sentUserName, sentRoomName, callback) {
    User.findOneAndUpdate({ userName : sentUserName }, { $pull : { rooms : sentRoomName } }).lean().exec(function(err, user) {
        if(err) {
            console.log('Failed to remove room from user', err);
        }

        callback(err, user);
    });
}

function setUserLastOnline(sentUserName, sentDate, callback) {
    User.findOneAndUpdate({ userName : sentUserName }, { lastOnline : sentDate }).lean().exec(function(err, user) {
        if(err) {
            console.log('Failed to update last online on', sentUserName, err);
        }

        console.log('Updated', sentUserName, 'with', sentDate);

        callback(err, user);
    });
}

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
exports.getAllUserHistory = getAllUserHistory;

//Blodsband specific
exports.addEncryptionKey = addEncryptionKey;
exports.addEntity = addEntity;
exports.unlockEntity = unlockEntity;
exports.getAllEntities = getAllEntities;
exports.getEncryptionKey = getEncryptionKey;