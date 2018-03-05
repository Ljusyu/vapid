const Router = require('koa-router')
const path = require('path')
const router = new Router({ prefix: '/dashboard' })
const views = require('koa-views')

// TODO: Get the view directory from app/site?
router.use(views(path.resolve(__dirname, '../../views/dashboard'), {
  extension: 'ejs',
  map: {
    html: 'ejs'
  }
}))

router.use(async (ctx, next) => {
  ctx.state.groups = await ctx.models.Group.findAll()
  return next()
})

router.get('/', async ctx => {
  await ctx.render('layout', { yield: 'index' })
})

router.get('/groups/:id', async ctx => {
  // Redirect based on repeat, and if records exist
  await ctx.redirect(`${ctx.params.id}/records/new`)
})

router.get('/groups/:id/records/new', async ctx => {
  let group = await ctx.models.Group.findById(ctx.params.id)
  await ctx.render('layout', { yield: 'records/new', group: group })
})

router.get('/records/:id/edit', async ctx => {
  let group = await ctx.models.Group.findById(ctx.params.id)
  await ctx.render('layout', { yield: 'records/edit', group: group })
})

module.exports = router
