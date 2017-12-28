const Router = require('koa-router')
const dashboard = new Router({ prefix: '/dashboard' })

dashboard.get('/', ctx => {
  ctx.body = 'Dashboard'
})

module.exports = dashboard
