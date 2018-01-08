const Router = require('koa-router')
const router = new Router({ prefix: '/dashboard' })

// dashboard.use(async (ctx, next) => {
//   if (ctx.isAuthenticated()) {
//     return next()
//   } else {
//     ctx.redirect('/dashboard/login')
//   }
// })

router.get('/', ctx => {
  ctx.body = 'Dashboard'
})

router.get('/group/:id', ctx => {
  ctx.body = 'View Group Records'
})

router.get('/record/new', ctx => {
  ctx.body = 'New Record'
})

router.post('/record', ctx => {

})

router.get('/record/:id', ctx => {
  ctx.body = 'Edit a Record'
})

router.post('/record/:id', ctx => {

})

module.exports = router
