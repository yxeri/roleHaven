# roleHaven

roleTerminal is part of an initiative to create a platform to be used in-game during LARPs. roleHaven serves as the backend and should be combined with a frontend project, such as roleTerminal.

## Configuration

Default configuration can be overriden by creating the files /config/modified/appConfig.js or /config/modified/databasePopulation.js and adding values with the same name as in config/defaults.
Most of the configuration can also be changed through environmental variables. Environmental variables have higher priority than changes made in /config/modified.
You should set these environmental variable before deploying the app:
* JSONKEY is used for JSON Web Tokens. Remember to set it when deploying the app!
* GMAPSKEY is used for the Google Maps API

## Deployment

## Project owner

* Aleksandar Jankovic - [Github](https://github.com/yxeri) [Twitter](https://twitter.com/yxeri)

## Development contributors

* Aleksandar Jankovic - [Github](https://github.com/yxeri) [Twitter](https://twitter.com/yxeri)
* Stanislav B - [Github](https://github.com/stanislavb)

## Other contributions

* A big thanks to all of those who are supporting this project through [Patreon](http://patreon.com/yxeri)
