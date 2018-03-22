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

router.get('root', '/', defaultGroup, async ctx => {
  await ctx.redirect(router.url('groups#show', ctx.state.group.id))
})

router.get('build', '/build', async ctx => {
  vapid.site.build()
  ctx.flash('success', 'Site built')
  await ctx.redirect(router.url('root'))
})

router.get('groups#show', '/groups/:id', findGroup, async ctx => {
  // Redirect based on repeat, and if records exist
  let redirectTo = (() => {
    let group = ctx.state.group

    if (group.records.length == 0) {
      return router.url('records#new', ctx.params.id)
    } else if (group.repeating) {
      return router.url('records#index', group.id)
    } else {
      return router.url('records#edit', group.records[0].id)
    }
  })()

  await ctx.redirect(redirectTo)
})

router.get('records#index', '/groups/:id/records', findGroup, async ctx => {
  await ctx.render('layout', { yield: 'records/index' })
})

router.get('records#new', '/groups/:id/records/new', findGroup, async ctx => {
  await ctx.render('layout', { yield: 'records/new', action: router.url('records#create', ctx.state.group.id) })
})

router.post('records#create', '/groups/:id/records', findGroup, async ctx => {
  let group = ctx.state.group
  let record = await vapid.models.Record.create({ group_id: group.id, content: ctx.request.body.content })
  let redirectTo = (() => {
    if (group.repeating) {
      return router.url('records#index', group.id)
    } else {
      return router.url('records#edit', record.id)
    }
  })() 

  ctx.flash('success', `Created ${group.displayNameSingular}`)
  await ctx.redirect(redirectTo)
})

router.get('records#edit', '/records/:id/edit', findRecord, async ctx => {
  await ctx.render('layout', { yield: 'records/edit', action: router.url('records#update', ctx.state.record.id) })
})

router.get('records#delete', '/records/:id/delete', findRecord, async ctx => {
  await ctx.render('layout', { yield: 'records/delete' })
})

router.post('/records/:id/delete', findRecord, async ctx => {
  let group = ctx.state.record.group
  
  await ctx.state.record.destroy()
  ctx.flash('success', `Deleted ${group.displayNameSingular}`)
  await ctx.redirect(router.url('records#index', group.id))
})

router.post('records#update', '/records/:id', findRecord, async ctx => {  
  // TODO: Need strong params
  await ctx.state.record.update({ content: ctx.request.body.content })
  ctx.flash('success', `Updated ${ctx.state.record.group.displayNameSingular}`)
  await ctx.redirect(router.url('records#edit', ctx.params.id))
})

/*******************
 * BEFORE ACTIONS
 ******************/

async function defaultGroup(ctx, next) {
  ctx.state.group = await vapid.models.Group.findGeneral()
  await next()
}

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
