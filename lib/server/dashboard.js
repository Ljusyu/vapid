const bodyParser = require('koa-bodyparser')
const flash = require('koa-better-flash')
const mount = require('koa-mount')
const path = require('path')
const serve = require('koa-static')
const views = require('koa-views')

const Router = require('koa-router')
const router = new Router({ prefix: '/dashboard' })

const passport = require('koa-passport')
const LocalStrategy = require('passport-local')

const assets = path.resolve(__dirname, '../../assets')
const templates = path.resolve(__dirname, '../../views')
const favicon = path.resolve(assets, 'favicon.ico')

/*******************
 * AUTH
 ******************/

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(async function(id, done) {
  try {
    const user = await vapid.models.User.findById(id)
    done(null, user)
  } catch(err) {
    done(err)
  }
})

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  let user = await vapid.models.User.findOne({ where: { email: email } })
  return done(null, user && user.authenticate(password))
}))

/*******************
 * SETUP
 ******************/

router
  .use(bodyParser())
  .use(flash())
  .use(passport.initialize())
  .use(passport.session())

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

/*******************
 * ROUTES
 ******************/

router.get('root', '/', defaultGroup, ctx => {
  return ctx.redirect(router.url('groups#show', ctx.state.group.id))
})

router.get('auth#install', '/install', async ctx => {
  if (await vapid.models.User.count() > 0 ) {
    return ctx.redirect(router.url('auth#sign_in'))
  }

  return ctx.render('layouts/auth', {
    title: 'Install', 
    yield: 'auth/install',
    flash: ctx.flash(),
    email: ""
  })
})

router.post('/install', async ctx => {
  if (await vapid.models.User.count() > 0 ) {
    return ctx.redirect(router.url('auth#sign_in'))
  }

  try {
    let user = await vapid.models.User.create({
                  email: ctx.request.body.email,
                  password: ctx.request.body.password
               })
    await ctx.login(user)
    vapid.site.build()
    return ctx.redirect(router.url('root'))
  } catch (err) {
    // TODO: Better error messages
    ctx.flash('error', 'Bad email or password')
    return ctx.render('layouts/auth', {
      title: 'Install',
      yield: 'auth/install',
      flash: ctx.flash(),
      email: ctx.request.body.email
    })
  }
})

router.get('auth#sign_in', '/sign_in', async ctx => {
  if (await vapid.models.User.count() == 0) {
    return ctx.redirect(router.url('auth#install'))
  }

  return ctx.render('layouts/auth', {
    title: 'Sign In',
    yield: 'auth/sign_in',
    flash: ctx.flash()
  })
})

// TODO: Customize this, so failure repopulates the email address input
router.post('/sign_in', passport.authenticate('local', {
  successRedirect: router.url('root'),
  failureRedirect: router.url('auth#sign_in'),
  failureFlash: 'Invalid email or password'
}))

router.get('auth#sign_out', '/sign_out', ctx => {
  ctx.logout()
  return ctx.redirect(router.url('auth#sign_in'))
})

router.use(async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    ctx.state.groups = await vapid.models.Group.findAll()
    ctx.state.flash = ctx.flash()
    return next()
  } else {
    return ctx.redirect(router.url('auth#sign_in'))
  }
})

router.get('build', '/build', ctx => {
  vapid.site.build()
  ctx.flash('success', 'Site built')
  return ctx.redirect(router.url('root'))
})

router.get('groups#show', '/groups/:id', findGroup, ctx => {
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

  return ctx.redirect(redirectTo)
})

router.get('records#index', '/groups/:id/records', findGroup, ctx => {
  return ctx.render('layouts/default', {
    title: ctx.state.group.label,
    yield: 'records/index'
  })
})

router.get('records#new', '/groups/:id/records/new', findGroup, ctx => {
  return ctx.render('layouts/default', {
    title: ctx.state.group.repeating ? `New ${ctx.state.group.labelSingular}` : ctx.state.group.label,
    yield: 'records/new',
    action: router.url('records#create', ctx.state.group.id)
  })
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

  ctx.flash('success', `Created ${group.labelSingular}`)
  return ctx.redirect(redirectTo)
})

router.get('records#edit', '/records/:id/edit', findRecord, ctx => {
  return ctx.render('layouts/default', {
    title: ctx.state.record.group.labelSingular,
    yield: 'records/edit',
    action: router.url('records#update', ctx.state.record.id)
  })
})

router.get('records#delete', '/records/:id/delete', findRecord, ctx => {
  return ctx.render('layouts/default', { yield: 'records/delete' })
})

router.post('/records/:id/delete', findRecord, async ctx => {
  let group = ctx.state.record.group
  
  await ctx.state.record.destroy()
  ctx.flash('success', `Deleted ${group.labelSingular}`)
  return ctx.redirect(router.url('records#index', group.id))
})

router.post('records#update', '/records/:id', findRecord, async ctx => {  
  // TODO: Need strong params
  await ctx.state.record.update({ content: ctx.request.body.content })
  ctx.flash('success', `Updated ${ctx.state.record.group.labelSingular}`)
  return ctx.redirect(router.url('records#edit', ctx.params.id))
})

/*******************
 * BEFORE ACTIONS
 ******************/

async function defaultGroup(ctx, next) {
  ctx.state.group = await vapid.models.Group.findGeneral()
  return next()
}

async function findGroup(ctx, next) {
  let group = await vapid.models.Group.findById(ctx.params.id, { include: 'records' })
  ctx.state.group = group
  return next()
}

async function findRecord(ctx, next) {
  let record = await vapid.models.Record.findById(ctx.params.id, { include: 'group' })
  ctx.state.record = record
  return next()
}

module.exports = router
