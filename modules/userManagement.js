var manager = require('../manager');

function handle(socket) {
    socket.on('register', function(user) {
        if(user && manager.getUserByName(user.userName) === undefined) {
            var userObj = {
                userName : user.userName, 
                socketId : socket.id,
                accessLevel : 1,
                password : user.password ? user.password : '0000'
            }

            manager.addUser(userObj);

            socket.emit('register', user.userName);
            socket.emit('message', { text : [user.userName + ' has been registered!'] });
        // This might not be needed
        } else if(user === null) {
            console.log('Error. User was empty during register');
        } else {
            socket.emit('message', { text : [user.userName + ' already exists. Failed to register'] });
        }
    });

    socket.on('updateUser', function(userName) {
        if(manager.getUserByName(userName)) {
            manager.updateUser(userName, 'socketId', socket.id);
        }
    });
}

exports.handle = handle;