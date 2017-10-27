# roleHaven

roleHaven is part of an initiative to create a platform to be used in-game during LARPs.

## Configuration

The default configuration files are in /config/defaults/ (appConfig and databasePopulation). You can override the defaults by either adding appConfig and/or databasePopulation in /config/modified or set envar CONFIGPATH with an URL to a repo withappConfig and/or databasePopulation.

## Deployment

Envar JSONKEY has to be set. It is used for the generation of JSON Web Tokens.

It is recommended to use Docker to deploy and run roleHaven.

## First run

A user named * is automatically created when the app is first deployed. Its password is printed to the logs. This user will be removed as soon as another user exists in the system.

## API

The documentation for the REST API can be found at https://thethirdgift.com/roleHaven/rest/.

## Project owner

* Aleksandar Jankovic - [Github](https://github.com/yxeri)

## Development contributors

* Aleksandar Jankovic - [Github](https://github.com/yxeri)
* Stanislav B - [Github](https://github.com/stanislavb)
* Sebastian Streiffert
* Johnathan Browall
* Thomas Erdelyi

## Contributors/Supporters

* Varg Johan
* Mathias Abrahamsson
* Jenny L.
* Stefan Scott
* Tveskägg
* H. Merkelbach
* Tobias W.
* 55463
* Joakim Sandström
* William Von Hofsten
* Kenny Svensson
* Maria Rodén
* Niklas Sandström
* Joachim
* Erik Jonsson
* tz
* Karl Dahlgren

* [Blodsband Reloaded](https://www.bbreloaded.se)
* [Sommarland](http://beratta.org/sommarland/)
* [Vinterland](http://beratta.org/vinterland/)
* [Ockulta Medborgarbyrån](http://www.ockultamedborgarbyran.com)
