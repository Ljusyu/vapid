const mount = require('koa-mount')
const path = require('path')
const serve = require('koa-static')
const views = require('koa-views')

const Router = require('koa-router')
const router = new Router({ prefix: '/dashboard' })

const assets = path.resolve(__dirname, '../../assets')
const templates = path.resolve(__dirname, '../../views')
const favicon = path.resolve(assets, 'favicon.ico')

// Hack to pass info back to main app
// TODO: Can we serve assets directly, from here?
router.context = {
  favicon: favicon,
  assets: assets
}

// TODO: Get the view directory from app/site?
router.use(views(templates, {
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
