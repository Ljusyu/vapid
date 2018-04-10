const bodyParser = require('koa-bodyparser')
const multipartParser = require('koa-busboy')
const flash = require('koa-better-flash')
const fs = require('fs')
const path = require('path')
const url = require('url')
const views = require('koa-views')
const Boom = require('boom')
const CSRF = require('koa-csrf')
const Utils = require('../utils')

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
 * MIDDLEWARES
 ******************/

router
  .use(bodyParser())
  .use(multipartParser())
  .use(flash())
  .use(passport.initialize())
  .use(passport.session())
  .use(new CSRF({
    invalidSessionSecretMessage: 'Invalid session secret',
    invalidSessionSecretStatusCode: 403,
    invalidTokenMessage: 'Invalid CSRF token',
    invalidTokenStatusCode: 403,
    excludedMethods: [ 'GET', 'HEAD', 'OPTIONS' ],
    disableQuery: false
  }))

// Hack to pass info back to main app
// TODO: Can we serve assets directly, from here?
router.context = {
  favicon: favicon,
  assets: assets,
}

// TODO: Get the view directory from app/site?
router.use(views(templates, {
  extension: 'ejs',
  map: {
    html: 'ejs'
  }
}))

// Override ctx.render to accept layouts, and add common locals
router.use(async (ctx, next) => {
  let render = ctx.render

  ctx.response.render = ctx.render = async (relPath, title, locals = {}) => {
    let layout = Utils.startsWith(relPath, 'auth/') ? 'auth' : 'default'

    locals = Object.assign(locals, { 
      yield: relPath,
      title: title,
      csrf: ctx.csrf,
      flash: ctx.flash()
    })

    await render(`layouts/${layout}`, locals)
  }

  await next()
})

/*******************
 * ROOT
 ******************/

router.get('root', '/', defaultGroup, async ctx => {
  ctx.redirect(router.url('groups#show', ctx.state.group.id))
})

/*******************
 * INSTALL
 ******************/

router.get('auth#install', '/install', async ctx => {
  if (await vapid.models.User.count() > 0 ) {
    ctx.redirect(router.url('auth#sign_in'))
    return
  }

  await ctx.render('auth/install', 'Install', {
    email: ""
  })
})

router.post('/install', async ctx => {
  if (await vapid.models.User.count() > 0 ) {
    ctx.redirect(router.url('auth#sign_in'))
    return
  }

  try {
    let user = await vapid.models.User.create({
      email: ctx.request.body.email,
      password: ctx.request.body.password
    })
    await ctx.login(user)
    await vapid.site.build()
    ctx.redirect(router.url('root'))
  } catch (err) {
    // TODO: Better error messages
    ctx.flash('error', 'Bad email or password')
    await ctx.render('auth/install', 'Install', {
      email: ctx.request.body.email
    })
  }
})

/*******************
 * SIGN IN/OUT
 ******************/

router.get('auth#sign_in', '/sign_in', async ctx => {
  if (await vapid.models.User.count() == 0) {
    ctx.redirect(router.url('auth#install'))
    return
  }

  await ctx.render('auth/sign_in', 'Sign In')
})

// TODO: Customize this, so failure repopulates the email address input
router.post('/sign_in', passport.authenticate('local', {
  successRedirect: router.url('root'),
  failureRedirect: router.url('auth#sign_in'),
  failureFlash: 'Invalid email or password'
}))

router.get('auth#sign_out', '/sign_out', async ctx => {
  ctx.logout()
  ctx.redirect(router.url('auth#sign_in'))
})

router.use(async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    // For the nav menu
    ctx.state.allGroups = await vapid.models.Group.findAll()
    await next()
  } else {
    ctx.redirect(router.url('auth#sign_in'))
  }
})

/*******************
 * BUILD
 ******************/

router.get('build', '/build', async ctx => {
  await vapid.site.build()

  // TODO: Not nuts about hard-coding paths here
  const redirectTo = await (async () => {
    try {
      const referer = ctx.get('Referrer')
      const matches = url.parse(referer).path.match(/\/dashboard\/(records|groups)\/(\d+)/)
      const model = Utils.startCase( Utils.singularize(matches[1]) )

      await vapid.models[model].findById(matches[2], { rejectOnEmpty: true })
      return 'back'
    } catch (err) {
      return router.url('root')
    }
  })()

  ctx.flash('success', 'Site build complete')
  ctx.redirect(redirectTo, router.url('root'))
})

/*******************
 * GROUPS
 ******************/

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

  ctx.redirect(redirectTo)
})

/*******************
 * RECORDS
 ******************/

router.get('records#index', '/groups/:id/records', findGroup, async ctx => {
  await ctx.render('records/index', ctx.state.group.label)
})

router.get('/records/:id', findRecord, async ctx => {
  ctx.redirect(router.url('records#edit', ctx.state.record.id))
})

router.get('records#new', '/groups/:id/records/new', findGroup, async ctx => {
  await _newAction(ctx)
})

router.post('records#create', '/groups/:id/records', findGroup, async ctx => {
  let group = ctx.state.group
  let record, redirectTo

  try {
    // TODO: Can't figure out how to get group to load for validation, so I'm using the record.group = group hack
    record = await vapid.models.Record.build({ content: _content(ctx.request), group_id: group.id })
    record.group = group
    await record.save()

    redirectTo = (() => {
      if (group.repeating) {
        return router.url('records#index', group.id)
      } else {
        return router.url('records#edit', record.id)
      }
    })()

    ctx.flash('success', `Created ${group.labelSingular}`)
    ctx.redirect(redirectTo)
  } catch (err) {
    if (err.name == 'SequelizeValidationError') {
      ctx.flash('error', 'Please fix the following errors, then resubmit.')
      await _newAction(ctx, err.errors)      
    } else {
      throw err
    }
  }
})

router.get('records#edit', '/records/:id/edit', findRecord, async ctx => {
  await _editAction(ctx)
})

router.post('records#update', '/records/:id', findRecord, async ctx => {
  try {
    let record = ctx.state.record 
    let content = _content(ctx.request, record.id)

    await record.update({ content: content })

    ctx.flash('success', `Updated ${record.group.labelSingular}`)
    ctx.redirect(router.url('records#edit', record.id), router.url('root'))
  } catch (err) {
    if (err.name == 'SequelizeValidationError') {
      ctx.flash('error', 'Please fix the following errors, then resubmit.')
      await _editAction(ctx, err.errors)
    } else {
      throw err
    }
  }
})

router.get('records#delete', '/records/:id/delete', findRecord, async ctx => {
  let title = ctx.state.group.labelSingular
  await ctx.render('records/delete', `Delete ${title}`)
})

router.post('/records/:id/delete', findRecord, async ctx => {  
  await ctx.state.record.destroy()
  ctx.flash('success', `Deleted ${ctx.state.group.labelSingular}`)
  ctx.redirect(router.url('records#index', ctx.state.group.id))
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
  
  if (group) {
    ctx.state.group = group
    await next()
  } else {
    throw Boom.notFound(`Group #${ctx.params.id} not found`)
  }
}

async function findRecord(ctx, next) {
  let record = await vapid.models.Record.findById(ctx.params.id, { include: 'group' })

  if (record) {
    ctx.state.record = record
    ctx.state.group = record.group
    await next()
  } else {
    throw Boom.notFound(`Record #${ctx.params.id} not found`)
  }
}

/*******************
 * PRIVATE METHODS
 ******************/

async function _newAction(ctx, errors = {}) {
  let title = ctx.state.group.repeating ? `New ${ctx.state.group.labelSingular}` : ctx.state.group.label
  let record = Utils.isEmpty(ctx.request.body) ? { content: {} } : ctx.request.body

  await ctx.render('records/new', title, {
    action: router.url('records#create', ctx.state.group.id),
    errors: _errors(errors),
    record: record
  })
}

async function _editAction(ctx, errors = {}) {
  let title = `Edit ${ctx.state.record.group.labelSingular}`

  await ctx.render('records/edit', title, {
    action: router.url('records#update', ctx.state.record.id),
    errors: _errors(errors)
  })
}

function _errors(errorItems) {
  let errors = Utils.reduce(errorItems, (memo, item) => {
    let value = ((str) => {
      try {
        return JSON.parse(str)
      } catch (err) {
        return str
      }
    })(item.message)

    memo[item.path] = value
    return memo
  }, {})

  // For now, we only care about content errors
  return errors.content || {}
}

function _content(req) {
  // TODO: Strong params
  let content = req.body.content

  // Save files
  Utils.each(req.files, (file) => {
    const fieldName = file.fieldname.match(/content\[(.*)\]/)[1]
    content[fieldName] = _saveFile(file)
  })

  // Process destroys
  Utils.each(req.body._destroy, (_, fieldName) => {
    delete content[fieldName]
  })

  return content
}

function _saveFile(file) {
  const fileName = _fileDigest(file)
  const savePath = path.join(vapid.site.paths.uploads, fileName)

  // Just in case
  Utils.mkdirp(vapid.site.paths.uploads)

  const reader = fs.createReadStream(file.path)
  const stream = fs.createWriteStream(savePath)
  reader.pipe(stream)

  return fileName
}

function _fileDigest(file) {
  const checksum = Utils.checksum(file.path)
  const { name, ext } = path.parse(file.filename)

  return `${Utils.snakeCase(name)}-${checksum}${ext}`
}

module.exports = router
