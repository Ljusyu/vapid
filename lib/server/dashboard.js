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
  await ctx.redirect(router.url('groups#show', defaultGroup.id))
})

router.get('groups#show', '/groups/:id', findGroup, async ctx => {
  // Redirect based on repeat, and if records exist
  if (ctx.state.group.records.length) {
    await ctx.redirect(router.url('records#edit', ctx.state.group.records[0].id))
  } else {
    await ctx.redirect(router.url('records#new', ctx.params.id))
  }
})

router.get('records#new', '/groups/:id/records/new', findGroup, async ctx => {
  await ctx.render('layout', { yield: 'records/new', action: router.url('records#create', ctx.state.group.id) })
})

router.post('records#create', '/groups/:id/records', findGroup, async ctx => {
  let record = await vapid.models.Record.create({ group_id: ctx.state.group.id, content: ctx.request.body.content })
  ctx.flash('success', `Created ${ctx.state.group.displayName}`)
  await ctx.redirect(router.url('records#edit', record.id))
})

router.get('records#edit', '/records/:id/edit', findRecord, async ctx => {
  await ctx.render('layout', { yield: 'records/edit', action: router.url('records#update', ctx.state.record.id) })
})

router.post('records#update', '/records/:id', findRecord, async ctx => {  
  // TODO: Need strong params
  await ctx.state.record.update({ content: ctx.request.body.content })
  ctx.flash('success', `Updated ${ctx.state.record.group.displayName}`)
  await ctx.redirect(router.url('records#edit', ctx.params.id))
})

/*******************
 * BEFORE ACTIONS
 ******************/

async function findGroup(ctx, next) {
  let group = await vapid.models.Group.findById(ctx.params.id, { include: 'records' })
  ctx.state.group = group
  await next()
}

async function findRecord(ctx, next) {
  let record = await vapid.models.Record.findById(ctx.params.id, { include: 'group' })
  ctx.state.record = record
  await next()
}

module.exports = router
