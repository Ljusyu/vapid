const _ = require('lodash')
const Koa = require('koa')
const favicon = require('koa-favicon')
const fs = require('fs')
const logger = require('koa-log')
const mount = require('koa-mount')
const path = require('path')
const serve = require('koa-static')
const session = require('koa-session')

const dashboard = require('./dashboard')
const LiveReload = require('./liveReload')
const Template = require('../template')

const app = new Koa()
const reloader = new LiveReload()

class Server {
  constructor () {
    const site = vapid.site
    const settings = site.settings()
    const logLevel = app.env == 'development' ? 'tiny' : 'combined'

    this.httpServer = undefined
    this.fileWatcher = undefined

    this.livereload = app.env == 'development'
    this.port = process.env.PORT || settings.port || 4567

    // TODO: No, no, no
    app.keys = ['secretkey']

    app
      // TODO: Allow local site to override favicon
      .use(session({ key: 'vapid:sess' }, app))
      .use(favicon(dashboard.context.favicon))
      .use(mount('/assets', serve(site.paths.assets)))
      .use(mount('/uploads', serve(site.paths.uploads)))
      .use(mount('/dashboard/assets', serve(dashboard.context.assets)))
      .use(logger(logLevel))
      .use(dashboard.routes())

    app.use(async (ctx, next) => {
      await next()

      if (this.livereload) {
        ctx.body = reloader.injectScript(ctx.body)
      }
    })

    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        console.log(err)
        // TODO: Why is it always throwing a 404?
        const status = ctx.status || 500
        const siteFile = path.join(this.siteViews, `${status}.html`)
        const errFile = fs.existsSync(siteFile) ? siteFile : path.join(this.dashboardViews, `/dashboard/${status}.html`)
        const rendered = new Template(errFile).render()

        ctx.status = status
        ctx.body = rendered
      }
    })

    // TODO: Maybe this should be a middleware?
    app.use(async ctx => {
      const [file, recordId] = _analyzePath(ctx.path)
      const template = new Template(file)
      const tree = template.parse()
      const content = {}
      
      for (let [token, args] of Object.entries(tree)) {
        // TODO: Should we query Group for everything, or individual records?
        content[token] = await vapid.models.Group.contentFor(args, recordId)
      }

      ctx.body = template.render(content)
    })
  }

  start () {
    this.httpServer = app.listen(this.port)
    this.fileWatcher = this.livereload && reloader.watch()
  }

  stop () {
    this.httpServer && this.httpServer.close()
    this.fileWatcher && this.fileWatcher.close()
    this.httpServer = this.fileWatcher = undefined
  }

  refresh() {
    this.fileWatcher && this.fileWatcher.refresh('')
  }
}

/******************
 * PRIVATE METHODS
 ******************/

// TODO: Assumes .html files, but should probably be more tolerant
_analyzePath = function(ctxPath) {
  let sysPath = path.join(vapid.site.paths.templates, ctxPath)
  let file, recordId, groupName

  if (fs.existsSync(sysPath)) {
    let stats = fs.statSync(sysPath)
    file = stats.isDirectory() ? path.join(sysPath, 'index.html') : sysPath
  } else {
    [groupName, recordId] = ctxPath.slice(1).split('/')
    partial = path.join(vapid.site.paths.templates, `_${groupName}.html`)

    if (fs.existsSync(partial) && !isNaN(recordId)) {
      file = partial
    }
  }

  return [file, recordId]
}

module.exports = Server
