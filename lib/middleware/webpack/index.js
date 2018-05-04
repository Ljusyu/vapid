const config = require('./config');
const middleware = require('koa-webpack');

/**
 * Defaults
 *
 * @option {Object} dev - Koa middelware options
 * @option {Object|boolean} [hot=false] - disabling HMR
 */
const defaults = {
  dev: {
    logLevel: 'error',
    publicPath: '/',
  },

  hot: false,
};

/**
 * Initialize Webpack middleware
 *
 * @params {string} env
 * @params {string} siteDir - path to website being served
 * @return {function}
 */
module.exports = function webpacker(env, siteDir) {
  const mode = env === 'development' ? 'development' : 'production';
  const options = Object.assign({}, defaults, {
    config: config(mode, siteDir),
  });

  return middleware(options);
};
