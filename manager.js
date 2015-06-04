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
    position : {}
});
var roomSchema = new mongoose.Schema({
    roomName : { type : String, unique : true },
    password : { type : String, default : '' },
    accessLevel : { type : Number, default : 1 },
    visibility : { type : Number, default : 1 },
    commands : [{
        commandName : String,
        accessLevel : Number
    }],
    isDefault : Boolean
});
// Should be moved
var commandSchema = new mongoose.Schema({
    commandName : String,
    func : {},
    help : [String],
    instructions : [String],
    clearAfterUse : Boolean,
    usageTime : Boolean
});

var User = mongoose.model('User', userSchema);
var Room = mongoose.model('Room', roomSchema);
// Should be moved
var Command = mongoose.model('Command', commandSchema);

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

    newUser.save(function(err, newUser) {
        if(err) {
            console.log('Failed to save user', err);
        }

        callback(err, newUser);
    });
}

function updateUserSocketId(sentUserName, value, callback) {
    User.findOneAndUpdate({ userName : sentUserName }, { socketId : value }).lean().exec(function(err, user) {
        if(err) {
            console.log('Failed to update user', err);
        }

        callback(err);
    });
}

function updateUserLocation(sentUserName, sentPosition, callback) {
    User.findOneAndUpdate({ userName : sentUserName }, { position : sentPosition }).lean().exec(function(err, user) {
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

function createRoom(room, callback) {
    var newRoom = new Room(room);

    newRoom.save(function(err, newRoom) {
        if(err) {
            console.log('Failed to save room', err);
        }

        callback(err, newRoom);
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