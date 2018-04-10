const Koa = require('koa')
const favicon = require('koa-favicon')
const fs = require('fs')
const helmet = require('koa-helmet')
const logger = require('koa-log')
const mount = require('koa-mount')
const path = require('path')
const serve = require('koa-static')
const session = require('koa-session')
const Boom = require('boom')

const cache = require('../cache')
const dashboard = require('./dashboard')
const LiveReload = require('./liveReload')
const Template = require('../template')
const Utils = require('../utils')

const app = new Koa()
const reloader = new LiveReload()

const CACHE_PATH_PREFIX = 'site-'

class Server {
  constructor() {
    const site = vapid.site
    const settings = site.settings()
    const logLevel = app.env == 'development' ? 'tiny' : 'combined'

    this.httpServer = undefined
    this.fileWatcher = undefined

    this.livereload = app.env == 'development'
    this.port = process.env.PORT || settings.port || 4567

    // TODO: No, no, no
    app.keys = ['secretkey']

    /*******************
     * ERROR HANDLING
     ******************/

    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        [ctx.status, ctx.body] = _renderError(err, ctx.request)

        if (this.livereload) {
          ctx.body = reloader.injectScript(ctx.body)
        }
      }
    })

    /*******************
     * MIDDLEWARES
     ******************/

    // TODO: Allow local site to override favicon
    app.use(helmet())
       .use(session({ key: 'vapid:sess' }, app))
       .use(favicon(dashboard.context.favicon))
       .use(mount('/assets', serve(site.paths.assets)))
       .use(mount('/uploads', serve(site.paths.uploads)))
       .use(mount('/dashboard/assets', serve(dashboard.context.assets)))
       .use(logger(logLevel))
       .use(dashboard.routes())

    /*******************
     * SITE CONTENT
     ******************/

    app.use(async (ctx, next) => {
      if (_underscoreBasename(ctx.path)) {
        throw Boom.notFound()
      }

      let cacheKey = `${CACHE_PATH_PREFIX}${ctx.path}`
      ctx.body = cache.get(cacheKey) || cache.put(cacheKey, await _renderContent(ctx.path))

      if (this.livereload) {
        ctx.body = reloader.injectScript(ctx.body)
      }
    })
  }

  start() {
    cache.clear()

    this.httpServer = app.listen(this.port)
    this.livereload && reloader.watch(() => { cache.clearPrefix(CACHE_PATH_PREFIX) })

    vapid.models.Record.addHooks(['afterSave', 'afterDestroy'], () => {
      cache.clearPrefix(CACHE_PATH_PREFIX)
      reloader.reloadAll()
    })
  }

  stop() {
    vapid.models.Record.removeHooks(['afterSave', 'afterDestroy'])
    reloader.unwatch()
    this.httpServer && this.httpServer.close()
  }
}

/******************
 * PRIVATE METHODS
 ******************/

_renderContent = async function(uriPath) {
  const [file, pathSection, pathRecordId] = _analyzePath(uriPath)
  let content = {}
  let template, tree

  if (!file) {
    throw Boom.notFound('Template not found')
  }

  template = new Template(file)
  tree = template.parse()
  
  for (let [token, args] of Object.entries(tree)) {
    let recordId = pathSection == args.name ? pathRecordId : null
    content[token] = await vapid.models.Section.contentFor(args, recordId)
  }

  return template.render(content)
}

_renderError = function(error, request) {
  error = Boom.boomify(error)

  const status = error.output.statusCode
  const siteFile = path.join(vapid.site.paths.templates, `_error.html`)
  const errorFile = fs.existsSync(siteFile) ? siteFile : path.join(__dirname, `../../views/error.html`)
  const rendered = new Template(errorFile).render({
    error: {
      status: status,
      title: error.output.payload.error,
      message: error.message,
      stack: error.stack
    },
    request: request
  })

  vapid.log.extra(error.stack)

  return [status, rendered]
}

// TODO: Assumes .html files, but should probably be more tolerant
_analyzePath = function(uriPath) {
  let sysPath = path.join(vapid.site.paths.templates, uriPath)
  let file, recordId, sectionName

  if (fs.existsSync(sysPath)) {
    let stats = fs.statSync(sysPath)
    file = stats.isDirectory() ? path.join(sysPath, 'index.html') : sysPath
  } else {
    [sectionName, recordId] = uriPath.slice(1).split('/')
    partial = path.join(vapid.site.paths.templates, `_${sectionName}.html`)

    if (fs.existsSync(partial) && !isNaN(recordId)) {
      file = partial
    }
  }

  return [file, sectionName, recordId]
}

_underscoreBasename = function(uriPath) {
  let basename = path.basename(uriPath)
  return Utils.startsWith(basename, '_')
}

module.exports = Server
