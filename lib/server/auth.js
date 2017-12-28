const Router = require('koa-router')
const auth = new Router({ prefix: '/dashboard' })

auth.get('/login', ctx => {
  ctx.body = 'Login'
})

auth.get('/logout', ctx => {
  ctx.body = 'Logout'
})

module.exports = auth
