const bodyParser = require('koa-bodyparser')
const flash = require('koa-better-flash')
const mount = require('koa-mount')
const path = require('path')
const serve = require('koa-static')
const views = require('koa-views')

const Router = require('koa-router')
const router = new Router({ prefix: '/dashboard' })

const assets = path.resolve(__dirname, '../../assets')
const templates = path.resolve(__dirname, '../../views')
const favicon = path.resolve(assets, 'favicon.ico')

router
  .use(bodyParser())
  .use(flash())

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
  ctx.state.groups = await vapid.models.Group.findAll()
  ctx.state.flash = ctx.flash()
  await next()
})

/*******************
 * ROUTES
 ******************/

router.get('root', '/', async ctx => {
  let defaultGroup = await vapid.models.Group.findOne({ name: 'default' })
  await ctx.redirect(router.url('showGroup', defaultGroup.id))
})

router.get('showGroup', '/groups/:id', findGroup, async ctx => {
  // Redirect based on repeat, and if records exist
  if (ctx.state.group.records) {
    await ctx.redirect(router.url('editRecord', ctx.state.group.records[0].id))
  } else {
    await ctx.redirect(router.url('newRecord', ctx.params.id))
  }
})

router.get('newRecord', '/groups/:id/records/new', findGroup, async ctx => {
  await ctx.render('layout', { yield: 'records/new' })
})

router.get('editRecord', '/records/:id/edit', findRecord, async ctx => {
  await ctx.render('layout', { yield: 'records/edit' })
})

router.post('showRecord', '/records/:id', findRecord, async ctx => {  
  // TODO: Need strong params
  await ctx.state.record.update(ctx.request.body)
  ctx.flash('info', 'Record updated.')
  
  await ctx.redirect(router.url('editRecord', ctx.params.id))
})

/*******************
 * BEFORE ACTIONS
 ******************/

// TODO: Don't include *everything*
async function findGroup(ctx, next) {
  let group = await vapid.models.Group.findById(ctx.params.id, { include: [{ all: true }] })
  ctx.state.group = group
  await next()
}

async function findRecord(ctx, next) {
  let record = await vapid.models.Record.findById(ctx.params.id, { include: [{ all: true }] })
  ctx.state.record = record
  await next()
}

module.exports = router
