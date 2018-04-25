const middleware = require('koa-webpack');
const config = require('./config');

const middlewareOptions = {
  config,

  dev: {
    logLevel: 'warn',
    publicPath: '/',
  },

  hot: false,
};

module.exports = middleware(middlewareOptions);
