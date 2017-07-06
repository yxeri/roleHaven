const appConfig = require('../config/defaults/config').app;
const mailgun = require('mailgun-js')({ apiKey: appConfig.mailKey, domain: appConfig.mailDomain, publicApiKey: appConfig.publicMailKey });
const errorCreator = require('../objects/error/errorCreator');
const crypto = require('crypto');
const mailcomposer = require('mailcomposer');
const dbMailEvent = require('../db/connectors/mailEvent');
const { URL } = require('url');

/**
 * Checks if mail address is valid
 * @param {string} params.address Mail address
 * @param {boolean} params.autoVerifyMail Should the mail verification step be skipped?
 * @param {Function} params.callback Callback
 */
function isValidAddress({ address, autoVerifyMail, callback }) {
  if (autoVerifyMail) {
    callback({ data: { isValid: true } });

    return;
  }

  mailgun.validate(address, (error, body) => {
    if (error) {
      callback({ error: new errorCreator.Internal({ name: 'isValidAddress', errorObject: error }) });

      return;
    } else if (!body || !body.is_valid) {
      callback({ error: new errorCreator.InvalidData({ expected: 'valid mail address' }) });

      return;
    }

    callback({ data: { isValid: true } });
  });
}

/**
 * Send user verification mail
 * @param {string} params.address Mail address
 * @param {string} params.userName User name that will receive mail
 * @param {Function} params.callback Callback
 */
function sendVerification({ address, userName, callback }) {
  isValidAddress({
    address,
    callback: (validData) => {
      if (validData.error) {
        callback({ error: validData.error });

        return;
      }

      crypto.randomBytes(20, (err, key) => {
        const url = new URL(`https://${appConfig.host}/?key=${key.toString('hex')}&mailEvent=userVerify`);
        const mail = mailcomposer({
          from: appConfig.mailSender,
          to: address,
          subject: `${appConfig.title} User Verification`,
          text: `Your account ${userName} has been created, but to be able to login you will need to activate your account. Go to ${url.href} to activate your account`,
          html: `Your account ${userName} has been created, but to be able to login you will need to activate your account. Click <a href="${url.href}">here</a> to activate your account`,
        });

        dbMailEvent.createMailEvent({
          mailEvent: {
            owner: userName,
            key: key.toString('hex'),
            eventType: 'userVerify',

          },
          callback: (mailEventData) => {
            if (mailEventData.error) {
              callback({ error: mailEventData.error });

              return;
            } else if (appConfig.mode === 'test') {
              callback({ data: { success: true } });

              return;
            }

            mail.build((compileError, message) => {
              if (compileError) {
                callback({ error: new errorCreator.Internal({ name: 'sendVerification', errorObject: compileError }) });

                return;
              }

              const mailData = {
                to: address,
                message: message.toString('ascii'),
              };

              mailgun.messages().sendMime(mailData, (error, body) => {
                if (error) {
                  callback({ error: new errorCreator.Internal({ name: 'sendVerification', errorObject: error }) });

                  return;
                }

                callback({ data: { body } });
              });
            });
          },
        });
      });
    },
  });
}

/**
 * Send user password reset mail
 * @param {string} params.address Mail address
 * @param {string} params.userName User name that will receive mail
 * @param {Function} params.callback Callback
 */
function sendPasswordReset({ address, userName, callback }) {
  crypto.randomBytes(20, (err, key) => {
    const url = new URL(`https://${appConfig.host}/?key=${key.toString('hex')}&mailEvent=passwordReset`);
    const mail = mailcomposer({
      from: appConfig.mailSender,
      to: address,
      subject: `${appConfig.title} Password Recovery`,
      text: `A password reset request has been made for user ${userName}. Go to ${url} to reset your password. You can ignore this mail if you did not request a new password`,
      html: `A password reset request has been made for user ${userName}. Click <a href=${url}>here</a> to reset your password. You can ignore this mail if you did not request a new password`,
    });
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    dbMailEvent.createMailEvent({
      mailEvent: {
        expiresAt,
        owner: userName,
        key: key.toString('hex'),
        eventType: 'password',
      },
      callback: (mailEventData) => {
        if (mailEventData.error) {
          callback({ error: mailEventData.error });

          return;
        } else if (appConfig.mode === 'test') {
          callback({ data: { success: true } });

          return;
        }

        mail.build((compileError, message) => {
          if (compileError) {
            callback({ error: new errorCreator.Internal({ name: 'sendPasswordReset', errorObject: compileError }) });

            return;
          }

          const mailData = {
            to: address,
            message: message.toString('ascii'),
          };

          mailgun.messages().sendMime(mailData, (error, body) => {
            if (error) {
              callback({ error: new errorCreator.Internal({ name: 'sendPasswordReset', errorObject: error }) });

              return;
            }

            callback({ data: { body } });
          });
        });
      },
    });
  });
}

exports.sendVerification = sendVerification;
exports.sendPasswordReset = sendPasswordReset;
exports.isValidAddress = isValidAddress;
