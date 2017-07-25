const errorCreator = require('../objects/error/errorCreator');

/**
 * Checks the type of error and sends it in response
 * @param {Object} params.response Router response
 * @param {Object} params.error Error object
 * @param {string} [params.title] Error title
 * @param {string} [params.detail] Error detail
 */
function checkAndSendError({ response, error, title, detail }) {
  const sendError = {
    statusCode: 500,
    title: title || 'Internal server error',
    detail: detail || 'Internal server error',
  };

  switch (error.type) {
    case errorCreator.ErrorTypes.DOESNOTEXIST: {
      sendError.statusCode = 404;
      sendError.title = title || 'Does not exist';
      sendError.detail = detail || 'Does not exist';

      break;
    }
    case errorCreator.ErrorTypes.NOTALLOWED: {
      sendError.statusCode = 401;
      sendError.title = title || 'Unauthorized';
      sendError.detail = detail || 'Not allowed';

      break;
    }
    case errorCreator.ErrorTypes.INVALIDCHARACTERS: {
      sendError.statusCode = 400;
      sendError.title = title || 'Invalid characters or length';
      sendError.detail = detail || 'Invalid characters or length';

      break;
    }
    case errorCreator.ErrorTypes.ALREADYEXISTS: {
      sendError.statusCode = 403;
      sendError.title = title || 'Already exists';
      sendError.detail = detail || 'Already exists';

      break;
    }
    case errorCreator.ErrorTypes.INVALIDDATA: {
      sendError.statusCode = 400;
      sendError.title = title || 'Invalid data';
      sendError.detail = detail || 'Invalid data';

      break;
    }
    default: {
      break;
    }
  }

  response.status(sendError.statusCode).json({
    error: {
      status: sendError.statusCode,
      title: sendError.title,
      detail: sendError.detail,
    },
  });
}

exports.checkAndSendError = checkAndSendError;
