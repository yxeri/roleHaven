# roleHaven

[![Join the chat at https://gitter.im/yxeri/roleHaven](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/yxeri/roleHaven?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
RoleHaven is an initiative to create a platform to be used in-game during LARPs. The first field test will be during a post-apocalyptic LARP played out in Sweden.

Note! This system is meant to be used as a game within a game. Passwords are not stored in a insecure way. This is by design. 

## Instructions for the terminal
* Tab to show all available commands
* Arrow up and down to go through the command history
* Arrow left and right to move the blinking marker
* Tab after writing one or more letters to auto-complete it into a command (if it finds a match)
** Writing two spaces has the same effect and will auto-complete (useful for devices without a tab button)
* -- help used after a command will show instructions on how to use it

## Commands
* help - Shows available commands
* clear - Clears screen of text
* whoami - Shows your user name
* msg - Sends a message to your current room
* enterroom - Enters a room, setting is as default
* exitroom - Exits a room
* follow - Starts following a room without setting is as default
* unfollow - Stops following a room
* listrooms - Lists all available room for your access level
* chatmode - Sets chat mode. Everything written will be sent through the msg command
** Prepend - (dash) before commands for them to be interpreted in chatmode
* normalmode - Sets normal mode. This is the default mode
* register - Registers user on device and server
* login - Login as an existing user
* listusers - Lists all registered users
* createroom - Creates a room
* myrooms - Shows all rooms you are following
* time - Shows current time
* morse - Sends a morse coded message (audio) to everyone in the room
* password - Change current users password
* history - Gets message history from the rooms you are following
* locate - Gets the geoposition of users
* logout - Logs you out of the current user
* reboot - Refreshes the page
* verifyuser - Verifies a user and allows it to log in