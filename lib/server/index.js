const Koa = require('koa')
const cache = require('memory-cache')
const favicon = require('koa-favicon')
const fs = require('fs')
const helmet = require('koa-helmet')
const logger = require('koa-log')
const mount = require('koa-mount')
const path = require('path')
const serve = require('koa-static')
const session = require('koa-session')
const Boom = require('boom')

const dashboard = require('./dashboard')
const LiveReload = require('./liveReload')
const Template = require('../template')
const Utils = require('../utils')

const app = new Koa()
const reloader = new LiveReload()

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
        [ctx.status, ctx.body] = _renderError(err)
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

    app.use(async ctx => {
      ctx.body = cache.get(ctx.path) || cache.put(ctx.path, await _renderContent(ctx.path))

      if (this.livereload) {
        ctx.body = reloader.injectScript(ctx.body)
      }
    })
  }

  start() {
    cache.clear()

    this.httpServer = app.listen(this.port)
    this.livereload && reloader.watch(() => { cache.clear() })

    vapid.models.Record.addHooks(['afterSave', 'afterDestroy'], () => {
      cache.clear()
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

_renderContent = async function(relPath) {
  const [file, pathGroup, pathRecordId] = _analyzePath(relPath)
  const template = new Template(file)
  const tree = template.parse()
  const content = {}
  
  for (let [token, args] of Object.entries(tree)) {
    let recordId = pathGroup == args.name ? pathRecordId : null
    content[token] = await vapid.models.Group.contentFor(args, recordId)
  }

  return template.render(content)
}

_renderError = function(err) {
  const status = err.output && err.output.statusCode || 500
  const siteFile = path.join(vapid.site.paths.templates, `_${status}.html`)
  const errFile = fs.existsSync(siteFile) ? siteFile : path.join(__dirname, `../../views/${status}.html`)
  const rendered = new Template(errFile).render({})

  return [status, rendered]
}

// TODO: Assumes .html files, but should probably be more tolerant
_analyzePath = function(relPath) {
  let sysPath = path.join(vapid.site.paths.templates, relPath)
  let file, recordId, groupName

  if (fs.existsSync(sysPath)) {
    let stats = fs.statSync(sysPath)
    file = stats.isDirectory() ? path.join(sysPath, 'index.html') : sysPath
  } else {
    [groupName, recordId] = relPath.slice(1).split('/')
    partial = path.join(vapid.site.paths.templates, `_${groupName}.html`)

    if (fs.existsSync(partial) && !isNaN(recordId)) {
      file = partial
    }
  }

  return [file, groupName, recordId]
}

module.exports = Server
