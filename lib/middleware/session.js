const sess = require('koa-session');

const sessKey = 'vapid:sess';

module.exports = function session(app) {
  return sess({ key: sessKey }, app);
};
