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
const dbTeam = require('../../db/connectors/team');
const appConfig = require('../../config/defaults/config').app;

const router = new express.Router();

/**
 * @param {object} io - Socket.IO
 * @returns {Object} Router
 */
function handle(io) {
  /**
   * @api {get} /rooms Retrieve teams
   * @apiVersion 6.0.0
   * @apiName GetTeams
   * @apiGroup Teams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Retrieve teams
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.teams Found teams
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "teams": [
   *        { shortName: "pc", teamName: "private company" },
   *        { shortName: "comp", teamName: "human computers" },
   *      ]
   *    }
   *  }
   */
  router.get('/', (req, res) => {
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetTeams.name,
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

        dbTeam.getTeams({
          user: data.user,
          callback: ({ error: teamError, data: teamsData }) => {
            if (teamError) {
              return;
            }

            res.json({ data: teamsData });
          },
        });
      },
    });
  });

  /**
   * @api {get} /teams/:id Get specific team
   * @apiVersion 6.0.0
   * @apiName GetTeam
   * @apiGroup Teams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get a specific team
   *
   * @apiParam {String} id Name of the team to retrieve
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Found team
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "team": {
   *        "teamName": "bb1",
   *        "shortName": "rez",
   *        "admins": [
   *          "a1",
   *        ],
   *        "owner": "jazz",
   *        "isProtected": false
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
      commandName: dbConfig.apiCommands.GetTeam.name,
      token: req.headers.authorization,
      callback: ({ error }) => {
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

        dbTeam.getTeam({
          callback: ({ error: teamError, data: teamData }) => {
            if (teamError) {
              if (teamError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Team does not exist',
                    detail: 'Team does not exist',
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

            res.json({ data: teamData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /teams Create a team
   * @apiVersion 6.0.0
   * @apiName CreateTeam
   * @apiGroup Teams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Create a team
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.team Team
   * @apiParam {string} data.team.teamName Team name
   * @apiParam {string} data.team.shortName Short/acronym team name
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "team": {
   *        "teamName": "team bravo",
   *        "shortName": "tb"
   *      }
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Team created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "team": {
   *        "teamName": "team bravo",
   *        "shortName": "tb",
   *        "owner": "rez",
   *        "admins": [],
   *        "verified": false
   *      },
   *      "wallet": {
   *        "amount": 0,
   *        "owner": "team bravo-team",
   *        "accessLevel": 1,
   *        "isProtected": false,
   *        "team": "team bravo"
   *      }
   *    }
   *  }
   */
  router.post('/', (req, res) => {
    if (!objectValidator.isValidData(req.body, { data: { team: { teamName: true, shortName: true } } })) {
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
      commandName: dbConfig.apiCommands.CreateTeam.name,
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

        const { team } = req.body.data;
        const { user } = data;

        manager.createTeam({
          team,
          user,
          io,
          callback: ({ error: teamError, data: teamData }) => {
            if (teamError) {
              if (teamError.type === errorCreator.ErrorTypes.INVALIDDATA) {
                res.status(400).json({
                  error: {
                    status: 400,
                    title: 'Names too long',
                    detail: `Max team name length ${appConfig.teamNameMaxLength}. Max short name length ${appConfig.shortTeamMaxLength}`,
                  },
                });

                return;
              } else if (teamError.type === errorCreator.ErrorTypes.ALREADYEXISTS) {
                res.status(403).json({
                  error: {
                    status: 403,
                    title: 'User already in team or team already exists',
                    detail: 'User already in team or team already exists',
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

            res.json({ data: teamData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /teams/users/:id/invite Invite user to team
   * @apiVersion 6.0.0
   * @apiName InviteToTeam
   * @apiGroup Teams
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Invite user to team
   *
   * @apiParam {String} id Name of the user to invite
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.room Invitation created
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "invitation": {
   *        "invitationType": "team",
   *        "itemName": "bravo team",
   *        "sender": "raz",
   *        "time": "2016-10-14T09:54:18.694Z"
   *      },
   *      "to": "yathzee"
   *    }
   *  }
   */
  router.post('/users/:id/invite', (req, res) => {
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
      commandName: dbConfig.apiCommands.InviteToTeam.name,
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

        manager.inviteToTeam({
          io,
          user: data.user,
          to: req.params.id,
          callback: ({ error: inviteError, data: inviteData }) => {
            if (inviteError) {
              if (inviteError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'User or team does not exist',
                    detail: 'User or team does not exist',
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

            res.json({ data: inviteData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
