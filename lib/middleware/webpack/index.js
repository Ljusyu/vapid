const config = require('./config');
const middleware = require('koa-webpack');

const defaults = {
  dev: {
    logLevel: 'error',
    publicPath: '/',
  },

  hot: false,
};

module.exports = function webpacker(env, siteDir) {
  const mode = env === 'development' ? 'development' : 'production';
  const options = Object.assign({}, defaults, {
    config: config(mode, siteDir),
  });

  return middleware(options);
};
