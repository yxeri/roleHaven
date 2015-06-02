// Access levels: Lowest / Lower / Middle / Higher / Highest / God
// 1 / 3 / 5 / 7 / 9 / 11

var users = {
    god : {
        userName : 'god',
        socketId : 0,
        accessLevel : 11,
        password: '0000',
        visibility : 11
    }
};

var rooms = {
    public : {
        roomName : 'public',
        accessLevel : 1,
        visibility : 1,
        commands : { msg : { accessLevel : 11 } },
        isDefault : true
    },
    arrhome : {
        roomName : 'arrhome',
        accessLevel : 11,
        visibility : 11
    }
};

function getUserById(socketId) {
    for(var user in users) {
        if(socketId === users[user].socketId) {
            return users[user]; 
        }
    }

    return null;
}

function getUserByName(userName) {
	return users[userName];
}

function addUser(user) {
	users[user.userName] = user;
}

function updateUser(userName, property, value) {
	users[userName].property = value;
}

function getRoom(roomName) {
	return rooms[roomName];
}

function addRoom(room) {
	rooms[room.roomName] = room;
}

function getAllUserNames(sentUser) {
	var filteredUsers = [];

	for(var user in users) {
		if(sentUser.accessLevel >= users[user].visibility) {
			filteredUsers.push(user);
		}
	}

	return filteredUsers;
}

function getAllRoomNames(user) {
	var filteredRooms = [];

	for(var room in rooms) {
		if(user.accessLevel >= rooms[room].visibility) {
			filteredRooms.push(room);
		}
	}

	return filteredRooms;
}

exports.getUserById = getUserById;
exports.getUserByName = getUserByName;
exports.addUser = addUser;
exports.updateUser = updateUser;
exports.getRoom = getRoom;
exports.addRoom = addRoom;
exports.getAllUserNames = getAllUserNames;
exports.getAllRoomNames = getAllRoomNames;