const chokidar = require('chokidar')
const fs = require('fs')
const helmet = require('koa-helmet')
const http = require('http')
const logger = require('koa-log')
const mount = require('koa-mount')
const path = require('path')
const serve = require('koa-static')
const session = require('koa-session')
const webpack = require('koa-webpack')
const Boom = require('boom')
const Koa = require('koa')

const cache = require('../cache')
const dashboard = require('./dashboard')
const favicon = require('./favicon')
const LiveReload = require('./liveReload')
const Template = require('../template')
const Utils = require('../utils')

const app = new Koa()
const reloader = new LiveReload()

const CACHE_PATH_PREFIX = 'site-'
const WEBPACK_CONFIG = {
  dev: {
    logLevel: 'warn',
    publicPath: '/'
  },
  hot: {
    logLevel: 'error'
  }
}

class Server {
  constructor() {
    const compiler = webpack(WEBPACK_CONFIG)
    const site = vapid.site
    const watcher = chokidar.watch(['templates', 'public'])

    watcher.on('ready', function () {
      watcher.on('all', function (event, filepath) {
        compiler.client.wss.broadcast(JSON.stringify({ type: 'window-reload' }))
      })
    })

    this.httpServer = undefined
    this.fileWatcher = undefined

    app.keys = [process.env.SECRET_KEY]

    /*******************
     * ERROR HANDLING
     ******************/

    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        [ctx.status, ctx.body] = _renderError(err, ctx.request)

        if (vapid.config.liveReload) {
          ctx.body = reloader.injectScript(ctx.body)
        }
      }
    })

    /*******************
     * MIDDLEWARES
     ******************/

    app.use(compiler)
       .use(helmet())
       .use(session({ key: 'vapid:sess' }, app))
       .use(serve(site.paths.public))
       .use(mount('/uploads', serve(vapid.config.uploads)))
       .use(mount('/dashboard/assets', serve(dashboard.paths.assets)))
       .use(favicon([site.paths.public, dashboard.paths.assets]))
       .use(logger(vapid.config.logLevel))
       .use(dashboard.routes())

    /*******************
     * SITE CONTENT
     ******************/

    app.use(async (ctx, next) => {
      if (_underscoreBasename(ctx.path)) {
        throw Boom.notFound()
      }

      let cacheKey = `${CACHE_PATH_PREFIX}${ctx.path}`
      ctx.body = vapid.config.cache
                 ? cache.get(cacheKey) || cache.put(cacheKey, await _renderContent(ctx.path))
                 : await _renderContent(ctx.path)

      if (vapid.config.liveReload) {
        ctx.body = reloader.injectScript(ctx.body)
      }
    })
  }

  start() {
    cache.clear()
    this.httpServer = app.listen(vapid.config.port)

    vapid.config.liveReload && reloader.watch(() => {
      cache.clearPrefix(CACHE_PATH_PREFIX)
    })
    
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
  const errorFile = fs.existsSync(siteFile) ? siteFile : path.join(dashboard.paths.templates, 'error.html')
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
