# roleTerminal
![Build status](https://api.travis-ci.org/yxeri/roleTerminal.svg)

roleTerminal is part of an initiative to create a platform to be used in-game during LARPs. It has so far been used on several Swedish LARP events:
* [Blodsband reloaded (post-apoc, Mad Max style)](http://bbreloaded.se)
* [Rex (far-future post-apoc)](http://www.rexlajv.se)
* [Ockulta Medborgarbyrån (1984/Brazil inspired)](http://www.ockultamedborgarbyran.com)

## Releases

The master branch contains the latest and the stable releases. Stable releases are marked with the tag stable-*. Every other push to master is latest/unstable.

## Deployment

There's a container available at [Docker hub](https://hub.docker.com/r/yxeri/roleterminal/). Docker is the preferred method of deployment of the app.

## Configuration

Default configuration can be either overriden by adding the new values to a file in /config/modified with the same name as the one in /config/defaults.
Most of the configuration can also be changed through environmental variables. Environmental variables have higher priority than changes made in /config/modified.
You should set these environmental variable before deploying the app:
* JSONKEY is used for JSON Web Tokens. Remember to set it when deploying the app!
* GMAPSKEY is used for the Google Maps API

## User usage

* Tab to show all available commands
* Typing two spaces has the same effect as tab and will show all available commands
* Arrow up and down to go through the command history
* Tab after typing one or more letters to auto-complete it into a command (Example: typing he followed by a tab will output help)
* Typing two spaces has the same effect and will auto-complete (useful for devices without a tab button)
* -help typed after a command will show instructions on how to use it (Example: enterroom -help)
* The menu on the top can be used to use commands with less keyboard input

## Project owner

* Aleksandar Jankovic - [Github](https://github.com/yxeri) [Twitter](https://twitter.com/yxeri)

## Development contributors

* Aleksandar Jankovic - [Github](https://github.com/yxeri) [Twitter](https://twitter.com/yxeri)
* Stanislav B - [Github](https://github.com/stanislavb)

## Other contributions

* A big thanks to all of those who are supporting this project through [Patreon](http://patreon.com/yxeri)
