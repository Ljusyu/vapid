const fs = require('fs')
const Koa = require('koa')
const logger = require('koa-log')
const mount = require('koa-mount')
const path = require('path')
const serve = require('koa-static')

const dashboard = require('./dashboard')
const LiveReload = require('./liveReload')
const Template = require('../template')

const app = new Koa()
const reloader = new LiveReload()

class Server {
  constructor (site, options = {}) {
    const settings = site.settings()
    const logLevel = app.env == 'development' ? 'tiny' : 'combined'

    this.httpServer = undefined
    this.fileWatcher = undefined

    this.livereload = options.livereload
    this.port = process.env.PORT || settings.port || 4567

    this.site = site
    this.siteRoot = site.localPath
    this.siteAssets = path.join(this.siteRoot, 'assets')
    this.siteViews = path.join(this.siteRoot, 'templates')
    this.siteUploads = path.join(this.siteRoot, 'uploads')

    this.dashboardAssets = path.resolve(__dirname, '../../assets')
    this.dashboardViews = path.resolve(__dirname, '../../views')

    app
      .use(mount('/assets', serve(this.siteAssets)))
      .use(mount('/uploads', serve(this.siteUploads)))
      .use(mount('/dashboard/assets', serve(this.dashboardAssets)))
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
      const file = inferFile(this.siteViews, ctx.path)
      const template = new Template(file)
      const tree = template.parse()
      const content = {}

      for (let [token, group] of Object.entries(tree)) {
        // 1. Fetch records
        // 2. Apply directives
        // 3. Construct content
        const records = await ctx.models.group.findOne({ name: group.name })
        content[token] = records || []
      }

      ctx.body = template.render(content)
    })
  }

  start () {
    this.site.initialize((err, models) => {
      app.context.models = models
      this.httpServer = app.listen(this.port)
      this.fileWatcher = this.livereload && reloader.watch(this.siteRoot)
    })
  }

  stop () {
    this.httpServer && httpServer.close()
    this.fileWatcher && fileWatcher.close()
    this.site.teardown()
    this.httpServer = this.fileWatcher = undefined
  }
}

/**
 * PRIVATE METHODS
 */

// TODO: Assumes .html files, but should probably be more tolerant
function inferFile(dir, rel) {
  const abs = path.join(dir, rel)
  const stats = fs.statSync(abs)
 
  if (stats.isDirectory()) {
    return path.join(abs, 'index.html')
  }

  return abs
}

module.exports = Server
