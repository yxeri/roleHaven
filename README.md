# roleHaven

RoleHaven is an initiative to create a platform to be used in-game during LARPs. The first field test will be during 
a post-apocalyptic LARP [Blodsband reloaded](http://bbreloaded.se/ooc) played out in Sweden.

Note! This system is meant to be used as a game within a game. Passwords are not stored in a insecure way. This is by design. 

## Instructions for the terminal
* Tab to show all available commands
** Writing two spaces has the same effect and will show all available commands
* Arrow up and down to go through the command history
* Arrow left and right to move the blinking marker
* Tab after writing one or more letters to auto-complete it into a command (if it finds a match)
** Writing two spaces has the same effect and will auto-complete (useful for devices without a tab button)
* -help used after a command will show instructions on how to use it (Example: enterroom -help)

## Commands
* Basic
** clear : Clears the screen of all rows
** enterroom : Enters a chat room and unfollows the previous one
** help : Shows all available commands and helpful tips
** list : Lists users/rooms/devices
** logout
** password : Change password
** time : Show current time
** uploadkey : Blodsband specific
** weather : Shows the weather for the coming days
** whisper : Send a private message to a specifi user
** whoami : Shows the logged in user, access level and device ID
* Advanced
** broadcast : Sends a message to all users, no matter which room they are in
** createroom : Create a chat room
** follow : Follow a chat room and get the messages sent there
** history : Gets previous sent messages in all rooms you are following
** locate : Shows coordinates of users
** mode : Changes between chat mode (everything is interpreted as chat messages and - (dash) before commands is 
needed) or cmd mode
** msg : Send a message to your current room
** myrooms : Shows all the rooms you are following
** switchroom : Change your current room. Doesn't unfollow the previous one
** unfollow : Unfollows a room
* Hacking
** chipper : Blodsband specific
** hackroom : Blodsband specific
* Admin
** addencryptionkeys : Blodsband specific
** addentities : Blodsband specific
** banuser : Ban a user
** importantmsg : Send an important message (more visible than others and sent to everyone)
** moduleraid : Blodsband specific
** morse : Send morse code (sound and visual)
** removeroom : Remove room
** unbanuser : Unban user
** updatecommand
** updatedevice
** updateroom
** updateuser
** verifyuser

## Development contributors
* Aleksandar Jankovic - [Github](https://github.com/yxeri) [Twitter](https://twitter.com/yxeri)
* Stanislav B - [Github](https://github.com/stanislavb)

## To Do
* Separate all LARP-specific (Blodsband) code and put it in separate project