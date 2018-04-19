const { basename, extname, join, resolve } = require('path')
const fs = require('fs')
const helmet = require('koa-helmet')
const http = require('http')
const logger = require('koa-log')
const mount = require('koa-mount')
const serve = require('koa-static')
const session = require('koa-session')
const Boom = require('boom')
const Koa = require('koa')

const cache = require('../cache')
const dashboard = require('./dashboard')
const favicon = require('./favicon')
const Template = require('../template')
const Utils = require('../utils')
const Watcher = require('./watcher')

const app = new Koa()
const cache_path_prefix = 'site-'

class Server {
  constructor(site) {
    const logLevel = vapid.env == 'development' ? 'tiny' : 'combined'

    this.server = undefined
    this.watcher = new Watcher(site.paths.www)

    app.keys = [process.env.SECRET_KEY]

    /*******************
     * ERROR HANDLING
     ******************/

    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        [ctx.status, ctx.body] = _renderError(err, ctx.request)

        if (vapid.config.watch) {
          _injectLiveReload(ctx)
        }
      }
    })

    /*******************
     * MIDDLEWARES
     ******************/

    // TODO: Should there be a "public" folder that acts as a webpack cache in production?
    app.use(helmet())
       .use(session({ key: 'vapid:sess' }, app))
       .use(require('../webpack/middleware'))
       .use(mount('/uploads', serve(site.paths.uploads)))
       .use(_hidePrivates)
       .use(_siteAssets)
       .use(mount('/dashboard', serve(dashboard.paths.assets)))
       .use(favicon([site.paths.www, dashboard.paths.assets]))
       .use(logger(logLevel))
       .use(dashboard.routes())

    /*******************
     * SITE CONTENT
     ******************/

    app.use(async (ctx, next) => {
      let cacheKey = `${cache_path_prefix}${ctx.path}`

      ctx.body = vapid.config.cache
                 ? cache.get(cacheKey) || cache.put(cacheKey, await _renderContent(ctx.path))
                 : await _renderContent(ctx.path)

      if (vapid.config.watch) {
        _injectLiveReload(ctx)
      }
    })
  }

  start() {
    cache.clear()

    this.server = http.createServer(app.callback())

    if (vapid.config.watch) {
      this.watcher.listen({ server: this.server, port: vapid.config.port }, () => {
        cache.clearPrefix(cache_path_prefix)
      })
    } else {
      this.server.listen(vapid.config.port)
    }

    vapid.models.Record.addHooks(['afterSave', 'afterDestroy'], () => {
      cache.clearPrefix(cache_path_prefix)
      vapid.config.watch && this.watcher.refresh()
    })
  }

  stop() {
    vapid.models.Record.removeHooks(['afterSave', 'afterDestroy'])
    watcher.close()
    this.server && this.server.close()
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
  const siteFile = resolve(vapid.site.paths.www, `_error.html`)
  const errorFile = fs.existsSync(siteFile) ? siteFile : resolve(dashboard.paths.views, 'error.html')
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
  let sysPath = join(vapid.site.paths.www, uriPath)
  let file, recordId, sectionName

  if (fs.existsSync(sysPath)) {
    let stats = fs.statSync(sysPath)

    if (stats.isDirectory()) {
      let dirFile = resolve(sysPath, 'index.html')
      file = fs.existsSync(dirFile) ? dirFile : null
    } else {
      file = sysPath
    }
  } else {
    [sectionName, recordId] = uriPath.slice(1).split('/')
    partial = resolve(vapid.site.paths.www, `_${sectionName}.html`)

    if (fs.existsSync(partial) && !isNaN(recordId)) {
      file = partial
    }
  }

  return [file, sectionName, recordId]
}

_hidePrivates = async function(ctx, next) {
  let filename = basename(ctx.path)
  let char = filename.slice(0, 1)
  
  if (Utils.includes(['_', '.'], char)) {
    throw Boom.notFound('Filenames starting with an underscore or period are private, and cannot be served.') 
  } else {
    await next()
  }
}

_siteAssets = async function(ctx, next) {
  let ext = extname(ctx.path)

  if (Utils.includes(['', '.html'], ext)) {
    await next()
  } else if (Utils.includes(['.scss', '.sass'], ext)) {
    let suggestion = ctx.path.replace(/\.(scss|sass)$/, ".css")
    throw Boom.notFound(`Sass files cannot be served. Use "${suggestion}" instead.`)
  } else {
    await serve(vapid.site.paths.www)(ctx, next)
  }
}

_injectLiveReload = function(ctx) {
  const hostname = ctx.request.hostname
  const port = vapid.config.port
  const script = `<script src="/dashboard/javascripts/livereload.js?snipver=1&port=${port}&host=${hostname}"></script>`

  ctx.body = ctx.body.replace(/(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i, `${script}\n$1`)
}

module.exports = Server
