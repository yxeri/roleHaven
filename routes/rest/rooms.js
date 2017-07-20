/*
 Copyright 2015 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const express = require('express');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const manager = require('../../helpers/manager');
const objectValidator = require('../../utils/objectValidator');
const errorCreator = require('../../objects/error/errorCreator');
const authenticator = require('../../helpers/authenticator');

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /rooms Retrieve all rooms
   * @apiVersion 6.0.0
   * @apiName GetRooms
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve all rooms available to your user
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rooms Found rooms
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rooms": [
   *        "public",
   *        "bb1"
   *      ]
   *    }
   *  }
   */
  router.get('/', (req, res) => {
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetRoom.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
              },
            });

            return;
          }

          res.status(500).json({
            error: {
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            },
          });

          return;
        }

        manager.listRooms({
          user: data.user,
          callback: ({ error: roomsError, data: roomsData }) => {
            if (roomsError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: roomsData });
          },
        });
      },
    });
  });

  /**
   * @api {get} /rooms/:id Retrieve specific room
   * @apiVersion 6.0.0
   * @apiName GetRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a specific room, based on sent room name
   *
   * @apiParam {String} id Name of the room to retrieve
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Found room. Empty if no room was found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "owner": "rez",
   *        "bannedUsers": [
   *          "a1",
   *        ],
   *        "admins": [
   *          "rez2"
   *        ],
   *        "commands": [],
   *        "visibility": 1,
   *        "accessLevel": 1
   *      }
   *    }
   *  }
   */
  router.get('/:id', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetRoom.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
              },
            });

            return;
          }

          res.status(500).json({
            error: {
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            },
          });

          return;
        }

        manager.getRoom({
          roomName: req.params.id,
          user: data.user,
          callback: ({ error: roomError, data: roomData }) => {
            if (roomError) {
              if (roomError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Room does not exist',
                    detail: 'Room does not exist',
                  },
                });

                return;
              } else if (roomError.type === errorCreator.ErrorTypes.NOTALLOWED) {
                res.status(401).json({
                  error: {
                    status: 401,
                    title: 'Unauthorized',
                    detail: 'Not allowed to retrieve room',
                  },
                });

                return;
              }

              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: roomData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /rooms Create a room
   * @apiVersion 6.0.0
   * @apiName CreateRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a room
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.room Room
   * @apiParam {String} data.room.roomName Name of the room to create
   * @apiParam {String} [data.room.password] Password for the room. Leave unset if you don't want to password-protect the room
   * @apiParam {Number} [data.room.visibility] Minimum access level required to see the room. 0 = ANONYMOUS. 1 = registered user. Default is 1.
   * @apiParam {Number} [data.room.accessLevel] Minimum access level required to follow the room. 0 = ANONYMOUS. 1 = registered user. Default is 1.
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "accessLevel": 0
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1",
   *        "owner": "rez",
   *        "bannedUsers": [],
   *        "admins": [],
   *        "commands": [],
   *        "visibility": 1,
   *        "accessLevel": 0,
   *        password: false
   *      }
   *    }
   *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { room: { roomName: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.CreateRoom.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
              },
            });

            return;
          }

          res.status(500).json({
            error: {
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            },
          });

          return;
        }

        manager.createRoom({
          room: req.body.data.room,
          user: data.user,
          callback: ({ error: roomError, data: roomData }) => {
            if (roomError) {
              if (roomError.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
                res.status(403).json({
                  error: {
                    status: 403,
                    title: 'Room already exists',
                    detail: 'Room already exists',
                  },
                });

                return;
              }

              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: roomData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /rooms/follow Follow a room
   * @apiVersion 6.0.0
   * @apiName FollowRoom
   * @apiGroup Rooms
   *
   * @apiHeader {string} Authorization Your JSON Web Token
   *
   * @apiDescription Follow a room
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.room Room
   * @apiParam {string} data.room.roomName Name of the room
   * @apiParam {string} [data.room.password] Password for the room
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "room": {
   *        "room": "broom",
   *        "password": "password"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room
   * @apiSuccess {String} data.room.roomName Name of the room that is followed
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "broom"
   *      }
   *    }
   *  }
   */
  router.post('/follow', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { room: { roomName: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.FollowRoom.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
              },
            });

            return;
          }

          res.status(500).json({
            error: {
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            },
          });

          return;
        }

        manager.followRoom({
          io,
          room: req.body.data.room,
          user: data.user,
          callback: ({ error: roomError, data: roomData }) => {
            if (roomError) {
              if (roomError.type === errorCreator.ErrorTypes.NOTALLOWED) {
                res.status(401).json({
                  error: {
                    status: 401,
                    title: 'Not authorized to follow room',
                    detail: 'Your user is not allowed to follow the room',
                  },
                });

                return;
              }

              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: roomData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /rooms/unfollow Unfollow a room
   * @apiVersion 6.0.0
   * @apiName UnfollowRoom
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Unfollow a room
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.room Room
   * @apiParam {String} data.room.roomName Name of the room to unfollow
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Room
   * @apiSuccess {String} data.room.roomName Name of the room that was unfollowed
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "room": {
   *        "roomName": "bb1"
   *      }
   *    }
   *  }
   */
  router.post('/unfollow', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { room: { roomName: true } } })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.UnfollowRoom.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
              },
            });

            return;
          }

          res.status(500).json({
            error: {
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            },
          });

          return;
        }

        manager.unfollowRoom({
          io,
          user: data.user,
          room: req.body.data.room,
          callback: ({ error: unfollowError, data: unfollowData }) => {
            if (unfollowError) {
              if (unfollowError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Room does not exist',
                    detail: 'User is not following room',
                  },
                });

                return;
              }

              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: unfollowData });
          },
        });
      },
    });
  });

  /**
   * @api {get} /rooms/:id/match Match rooms with sent partial room name
   * @apiVersion 6.0.0
   * @apiName MatchRoomName
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a collection of rooms, based on the sent partial name. The match is done from index 0
   *
   * @apiParam {String} id Partial room name
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rooms Found rooms. Empty array if no rooms were found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rooms": [
   *        "bb1",
   *        "bb2",
   *        "roomSec",
   *      ]
   *    }
   *  }
   */
  router.get('/:id/match', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetRoom.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
              },
            });

            return;
          }

          res.status(500).json({
            error: {
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            },
          });

          return;
        }

        manager.matchPartialRoomName({
          partialName: req.params.id,
          user: data.user,
          callback: ({ error: matchError, data: matchData }) => {
            if (matchError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: matchData });
          },
        });
      },
    });
  });

  /**
   * @api {get} /rooms/:id/match Match followed rooms with sent partial room name
   * @apiVersion 6.0.0
   * @apiName MatchRoomName
   * @apiGroup Rooms
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve a collection of followed rooms, based on the sent partial name. The match is done from index 0
   *
   * @apiParam {String} id Partial room name
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.rooms Found rooms. Empty array if no rooms were found
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "rooms": [
   *        "bb1",
   *        "bb2",
   *        "roomSec",
   *      ]
   *    }
   *  }
   */
  router.get('/:id/match/followed', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    }

    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetRoom.name,
      token: req.headers.authorization,
      callback: ({ error, data }) => {
        if (error) {
          if (error.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
            res.status(404).json({
              error: {
                status: 404,
                title: 'Command does not exist',
                detail: 'Command does not exist',
              },
            });

            return;
          } else if (error.type === errorCreator.ErrorTypes.NOTALLOWED) {
            res.status(401).json({
              error: {
                status: 401,
                title: 'Unauthorized',
                detail: 'Invalid token',
              },
            });

            return;
          }

          res.status(500).json({
            error: {
              status: 500,
              title: 'Internal Server Error',
              detail: 'Internal Server Error',
            },
          });

          return;
        }

        manager.matchMyPartialRoomName({
          partialName: req.params.id,
          user: data.user,
          callback: ({ error: matchError, data: matchData }) => {
            if (matchError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: matchData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
