'use strict';

var ErrorCodes = {
  db : {
    text : 'Database',
    num : 1
  },
  unauth : {
    text : 'Unauthorized',
    num : 2
  },
  notFound : {
    text : 'Not found',
    num : 3
  },
  general : {
    text : 'General',
    num : 4
  }
};

function sendErrorMsg(code, text, err) {
  console.log('[ERROR]', code.text, text, '- Error:', err);
}

function sendSocketErrorMsg(socket, code, text) {
  socket.emit('message', { text : ['[' + code.num + '] ' + text] });
  sendErrorMsg(code, text);
}

function sendInfoMsg(text) {
  console.log('[INFO]', text);
}

exports.ErrorCodes = ErrorCodes;
exports.sendErrorMsg = sendErrorMsg;
exports.sendSocketErrorMsg = sendSocketErrorMsg;
exports.sendInfoMsg = sendInfoMsg;