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
  if (!mailgun && !appConfig.bypassMailer) {
    callback({ error: new errorCreator.Internal({ name: 'Mailgun mailKey, mailDomain, publicMailKey not set' }) });

    return;
  }

  crypto.randomBytes(20, (err, key) => {
    const url = new URL(`https://${appConfig.host}/?key=${key.toString('hex')}&mailEvent=userVerify`);
    const text = [
      `Hi, ${userName}!`,
      `Your account ${userName} on ${appConfig.host} has been created.`,
      'You need to verify your account before you can login with it.',
      '<br />',
      `Clicking <a href=${url.href}>here</a> will redirect you to ${appConfig.host} and allow you to verify and activate your account`,
      '<br />',
      `We hope that you will have a great experience at ${appConfig.eventName}!`,
      '// Aleksandar Jankovic',
      '// The Third Gift Games',
    ];
    const mail = mailcomposer({
      from: appConfig.mailSender,
      to: address,
      subject: `User Verification for ${appConfig.eventName} on ${appConfig.host}`,
      html: text.join('<br />'),
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
        } else if (appConfig.bypassMailer) {
          callback({ data: { success: true } });

          return;
        }

        mail.build((compileError, message) => {
          if (compileError) {
            callback({ error: new errorCreator.External({ name: 'sendVerification', errorObject: compileError }) });

            return;
          }

          const mailData = {
            to: address,
            message: message.toString('ascii'),
          };

          mailgun.messages().sendMime(mailData, (error, body) => {
            if (error) {
              callback({ error: new errorCreator.External({ name: 'sendVerification', errorObject: error }) });

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
  if (!mailgun && !appConfig.bypassMailer) {
    callback({ error: new errorCreator.Internal({ name: 'Mailgun mailKey, mailDomain, publicMailKey not set' }) });

    return;
  }

  crypto.randomBytes(20, (err, key) => {
    const url = new URL(`https://${appConfig.host}/?key=${key.toString('hex')}&mailEvent=passwordReset`);
    const text = [
      `Hi, ${userName}!`,
      `A password reset request has been made for your user at ${appConfig.host}`,
      'You can ignore this mail if you did not request a new password',
      '<br />',
      `Clicking <a href=${url}>here</a> will redirect you to ${appConfig.host} where you can reset and choose a new password`,
      '<br />',
      `We hope that you will have a great experience at ${appConfig.eventName}!`,
      '// Aleksandar Jankovic',
      '// The Third Gift Games',
    ];
    const mail = mailcomposer({
      from: appConfig.mailSender,
      to: address,
      subject: `User password recovery for ${appConfig.eventName} on ${appConfig.host}`,
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
        } else if (appConfig.bypassMailer) {
          callback({ data: { success: true } });

          return;
        }

        mail.build((compileError, message) => {
          if (compileError) {
            callback({ error: new errorCreator.External({ name: 'sendPasswordReset', errorObject: compileError }) });

            return;
          }

          const mailData = {
            to: address,
            message: message.toString('ascii'),
          };

          mailgun.messages().sendMime(mailData, (error, body) => {
            if (error) {
              callback({ error: new errorCreator.External({ name: 'sendPasswordReset', errorObject: error }) });

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
