const Router = require('koa-router')
const dashboard = new Router({ prefix: '/dashboard' })

dashboard.use(async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    return next()
  } else {
    ctx.redirect('/dashboard/login')
  }
})

dashboard.get('/', ctx => {
  ctx.body = 'Dashboard'
})

dashboard.get('/group/:id', ctx => {
  ctx.body = 'View Group Records'
})

dashboard.get('/record/new', ctx => {
  ctx.body = 'New Record'
})

dashboard.post('/record', ctx => {

})

dashboard.get('/record/:id', ctx => {
  ctx.body = 'Edit a Record'
})

dashboard.post('/record/:id', ctx => {

})

module.exports = dashboard
