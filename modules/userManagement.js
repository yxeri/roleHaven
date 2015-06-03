var manager = require('../manager');

function handle(socket) {
    socket.on('register', function(sentUser) {
        if(sentUser) {
            var userObj = {
                userName : sentUser.userName, 
                socketId : socket.id,
                password : sentUser.password
            }

            manager.addUser(userObj, function(err, user) {
                if(err) {
                    socket.emit('message', { text : ['Failed to register user'] });
                } else {
                    socket.emit('login', user.userName);
                    socket.emit('message', { text : [user.userName + ' has been registered!'] });
                }
            });
        }
    });

    socket.on('updateId', function(userName) {
        manager.updateUserSocketId(userName, socket.id, function(err) {
            if(err) {
                console.log('Failed to update Id', err);
            } else {
                socket.emit('importantMsg', { text : ['Re-established connection'] });
            }
        });
    });

    socket.on('login', function(sentUser) {
        if(sentUser.userName && sentUser.password) {
            manager.authUser(sentUser.userName, sentUser.password, function(err, user) {
                if(err) {
                    socket.emit('message', { text : ['Failed to login'] });
                } else {
                   socket.emit('login', user.userName); 
                }
            });
        } else {
            socket.emit('message', { text : ['User name and password needed to login. Failed to login'] });
        }
    });
}

exports.handle = handle;