const Koa = require('koa')
const favicon = require('koa-favicon')
const fs = require('fs')
const logger = require('koa-log')
const mount = require('koa-mount')
const path = require('path')
const serve = require('koa-static')
const session = require('koa-generic-session')

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

    app.keys = ['secretkey']

    app
      // TODO: Allow local site to override favicon
      .use(session())
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
      const file = this._inferFile(vapid.site.paths.templates, ctx.path)
      const template = new Template(file)
      const tree = template.parse()
      const content = {}

      for (let [token, groupAttrs] of Object.entries(tree)) {
        let group = await vapid.models.Group.findOne({ where: { name: groupAttrs.name}, include: 'records' })
        let record = group ? group.records[0].get({plain: true}).content : {}

        content[token] = record
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

  /******************
   * PRIVATE METHODS
   ******************/

  // TODO: Assumes .html files, but should probably be more tolerant
  _inferFile(dir, rel) {
    const abs = path.join(dir, rel)
    const stats = fs.statSync(abs)
   
    if (stats.isDirectory()) {
      return path.join(abs, 'index.html')
    }

    return abs
  }
}

module.exports = Server
