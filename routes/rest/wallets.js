/*
 Copyright 2017 Aleksandar Jankovic

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
const errorCreator = require('../../objects/error/errorCreator');
const dbConfig = require('../../config/defaults/config').databasePopulation;
const authenticator = require('../../helpers/authenticator');
const dbWallet = require('../../db/connectors/wallet');
const objectValidator = require('../../utils/objectValidator');
const manager = require('../../helpers/manager');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  /**
   * @api {get} /wallets/ Get wallets
   * @apiVersion 6.0.0
   * @apiName GetWallets
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Get wallets with lower access level than user, user being the owner or having the same team
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Found wallets
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallets": [{
   *        "owner": "abc",
   *        "amount": 10,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }, {
   *        "owner": "qwer",
   *        "amount": 13,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }]
   *    }
   *  }
   */
  router.get('/', (req, res) => {
    authenticator.isUserAllowed({
      commandName: dbConfig.apiCommands.GetWallet.name,
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

        dbWallet.getWallets({
          user: data.user,
          callback: ({ error: walletError, data: walletsData }) => {
            if (walletError) {
              res.status(500).json({
                error: {
                  status: 500,
                  title: 'Internal Server Error',
                  detail: 'Internal Server Error',
                },
              });

              return;
            }

            res.json({ data: walletsData });
          },
        });
      },
    });
  });

  /**
   * @api {get} /wallets/:id Get wallet by owner
   * @apiVersion 6.0.0
   * @apiName GetWallet
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription RetriGeteve wallet by owner
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Found wallet
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallet": {
   *        "owner": "",
   *        "amount": 10,
   *        "isProtected": false,
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
      commandName: dbConfig.apiCommands.GetWallet.name,
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

        dbWallet.getWallet({
          owner: req.params.id,
          callback: ({ error: walletError, data: walletData }) => {
            if (walletError) {
              if (walletError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Wallet does not exist',
                    detail: 'Wallet does not exist',
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
            } else if (walletData.wallet.accessLevel >= data.user.accessLevel) {
              res.status(401).json({
                error: {
                  status: 401,
                  title: 'Unable to retrieve wallet',
                  detail: 'Does not have access to wallet',
                },
              });

              return;
            }

            res.json({ data: walletData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /wallets/:id/increase Increase wallet amount
   * @apiVersion 6.0.0
   * @apiName IncreaseWalletAmount
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Increase wallet amount
   *
   * @apiParam {String} id Name of the owner of the wallet
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.amount Amount to increase
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "amount": 8
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Updated wallet
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallet": {
   *        "owner": "abc",
   *        "amount": 18,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }
   *    }
   *  }
   */
  router.post('/:id/increase', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    } else if (!objectValidator.isValidData(req.body, { data: { amount: true } })) {
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
      commandName: dbConfig.apiCommands.IncreaseWalletAmount.name,
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

        manager.increaseWalletAmount({
          owner: req.params.id,
          amount: req.body.data.amount,
          callback: ({ error: walletError, data: walletData }) => {
            if (walletError) {
              if (walletError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Internal Server Error',
                    detail: 'Internal Server Error',
                  },
                });

                return;
              } else if (walletError.type === errorCreator.ErrorTypes.INVALIDDATA) {
                res.status(400).json({
                  error: {
                    status: 400,
                    title: 'Amount must be higher than 0',
                    detail: 'Amount must be higher than 0',
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

            res.json({ data: walletData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /wallets/:id/decrease Decrease wallet amount
   * @apiVersion 6.0.0
   * @apiName DecreaseWalletAmount
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Decrease wallet amount
   *
   * @apiParam {String} id Name of the owner of the wallet
   *
   * @apiParam {Object} data
   * @apiParam {Object} data.amount Amount to decrease
   * @apiParamExample {json} Request-Example:
   *   {
   *    "data": {
   *      "amount": 8
   *    }
   *  }
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Updated wallet
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallet": {
   *        "owner": "abc",
   *        "amount": 2,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }
   *    }
   *  }
   */
  router.post('/:id/decrease', (req, res) => {
    if (!objectValidator.isValidData(req.params, { id: true })) {
      res.status(400).json({
        error: {
          status: 400,
          title: 'Missing data',
          detail: 'Unable to parse data',
        },
      });

      return;
    } else if (!objectValidator.isValidData(req.body, { data: { amount: true } })) {
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
      commandName: dbConfig.apiCommands.DecreaseWalletAmount.name,
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

        manager.decreaseWalletAmount({
          owner: req.params.id,
          amount: req.body.data.amount,
          callback: ({ error: walletError, data: walletData }) => {
            if (walletError) {
              if (walletError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Internal Server Error',
                    detail: 'Internal Server Error',
                  },
                });

                return;
              } else if (walletError.type === errorCreator.ErrorTypes.INVALIDDATA) {
                res.status(400).json({
                  error: {
                    status: 400,
                    title: 'Amount must be higher than 0',
                    detail: 'Amount must be higher than 0',
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

            res.json({ data: walletData });
          },
        });
      },
    });
  });

  /**
   * @api {post} /wallets/:id/empty Reset wallet amount to 0
   * @apiVersion 6.0.0
   * @apiName EmptyWallet
   * @apiGroup Wallets
   *
   * @apiHeader {String} Authorization Your JSON Web Token
   *
   * @apiDescription Reset wallet amount to 0
   *
   * @apiParam {String} id Name of the owner of the wallet
   *
   * @apiSuccess {Object} data
   * @apiSuccess {Object} data.wallet Updated wallet
   * @apiSuccessExample {json} Success-Response:
   *   {
   *    "data": {
   *      "wallet": {
   *        "owner": "abc",
   *        "amount": 0,
   *        "isProtected": false,
   *        "accessLevel": 1
   *      }
   *    }
   *  }
   */
  router.post('/:id/empty', (req, res) => {
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
      commandName: dbConfig.apiCommands.DecreaseWalletAmount.name,
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

        dbWallet.resetWalletAmount({
          owner: req.params.id,
          callback: ({ error: walletError, data: walletData }) => {
            if (walletError) {
              if (walletError.type === errorCreator.ErrorTypes.DOESNOTEXIST) {
                res.status(404).json({
                  error: {
                    status: 404,
                    title: 'Internal Server Error',
                    detail: 'Internal Server Error',
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

            res.json({ data: walletData });
          },
        });
      },
    });
  });

  return router;
}

module.exports = handle;
