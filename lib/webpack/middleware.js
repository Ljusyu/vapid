const middleware = require('koa-webpack')
const config = require('./config')
const middleware_options = {
  config: config,

  dev: {
    logLevel: 'warn',
    publicPath: '/',
  },
  
  hot: false
}

module.exports = middleware(middleware_options)
