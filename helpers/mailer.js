const appConfig = require('../config/defaults/config').app;
const mailgun = appConfig.mailKey
  && appConfig.mailDomain
  && appConfig.publicMailKey
  ? require('mailgun-js')({ apiKey: appConfig.mailKey, domain: appConfig.mailDomain, publicApiKey: appConfig.publicMailKey })
  : null;
const errorCreator = require('../objects/error/errorCreator');
const crypto = require('crypto');
const mailcomposer = require('mailcomposer');
const dbMailEvent = require('../db/connectors/mailEvent');
const { URL } = require('url');

/**
 * Send user verification mail
 * @param {string} params.address Mail address
 * @param {string} params.userName User name that will receive mail
 * @param {Function} params.callback Callback
 */
function sendVerification({ address, userName, callback }) {
  if (!mailgun && appConfig.mode !== appConfig.Modes.TEST && appConfig.mode !== appConfig.Modes.DEV) {
    callback({ error: new errorCreator.Internal({ name: 'Mailgun mailKey, mailDomain, publicMailKey not set' }) });

    return;
  }

  crypto.randomBytes(20, (err, key) => {
    const url = new URL(`https://${appConfig.host}/?key=${key.toString('hex')}&mailEvent=userVerify`);
    const text = [
      `Your account ${userName} on ${appConfig.host} has been created.`,
      'ou have to verify your account before you can login with it.',
      `Clicking <a href=${url.href}>here</a> will verify and activate active your account`,
      '<br />',
      '// The Third Gift Games',
    ];
    const mail = mailcomposer({
      from: appConfig.mailSender,
      to: address,
      subject: `User Verification on ${appConfig.host}`,
      html: text.join('<br />'),
    });
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    dbMailEvent.createMailEvent({
      mailEvent: {
        expiresAt,
        owner: userName,
        key: key.toString('hex'),
        eventType: 'userVerify',

      },
      callback: (mailEventData) => {
        if (mailEventData.error) {
          callback({ error: mailEventData.error });

          return;
        } else if (appConfig.mode === appConfig.Modes.TEST || appConfig.mode === appConfig.Modes.DEV) {
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
}

/**
 * Send user password reset mail
 * @param {string} params.address Mail address
 * @param {string} params.userName User name that will receive mail
 * @param {Function} params.callback Callback
 */
function sendPasswordReset({ address, userName, callback }) {
  if (!mailgun) {
    callback({ error: new errorCreator.Internal({ name: 'Mailgun mailKey, mailDomain, publicMailKey not set' }) });

    return;
  }

  crypto.randomBytes(20, (err, key) => {
    const url = new URL(`https://${appConfig.host}/?key=${key.toString('hex')}&mailEvent=passwordReset`);
    const text = [
      `A password reset request has been made for user ${userName}`,
      'You can ignore this mail if you did not request a new password',
      `Clicking <a href=${url}>here</a> to reset and choose a new password`,
      '<br />',
      '// The Third Gift Games',
    ];
    const mail = mailcomposer({
      from: appConfig.mailSender,
      to: address,
      subject: `${appConfig.title} Password Recovery`,
      html: text.join('<br />'),
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
        } else if (appConfig.mode === appConfig.Modes.TEST) {
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
