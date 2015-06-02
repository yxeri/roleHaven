var manager = require('../manager');

function handle(socket) {
    socket.on('register', function(user) {
        if(user && manager.getUserByName(user.userName) === undefined) {
            var userObj = {
                userName : user.userName, 
                socketId : socket.id,
                accessLevel : user.accessLevel ? user.accessLevel : 1,
                password : user.password ? user.password : '0000',
                visibility : user.visibility ? user.visibility : 1
            }

            manager.addUser(userObj);

            socket.emit('login', user.userName);
            socket.emit('message', { text : [user.userName + ' has been registered!'] });
        // This might not be needed
        } else if(user === null) {
            console.log('Error. User was empty during register');
        } else {
            socket.emit('message', { text : [user.userName + ' already exists. Failed to register'] });
        }
    });

    socket.on('updateId', function(userName) {
        if(manager.getUserByName(userName)) {
            manager.updateUser(userName, 'socketId', socket.id);
        }
    });

    socket.on('login', function(sentUser) {
        if(sentUser.userName && sentUser.password) {
            var user = manager.getUserByName(sentUser.userName);
            var correctPassword = user ? (sentUser.password === user.password) : false;

            if(user && correctPassword) {
                socket.emit('login', user.userName);
            } else {
                if(user === null) {
                    socket.emit('message', { text : ['User doesn\'t exist. Failed to login'] });
                } else if(!correctPassword) {
                    socket.emit('message', { text : ['Password is incorrect. Failed to login'] });
                }
            }
        } else {
            socket.emit('message', { text : ['User name and password needed to login. Failed to login'] });
        }
    });
}

exports.handle = handle;