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

      for (let [token, groupAttrs] of Object.entries(tree)) {
        let group = await this.site.db.Group.findOne({ where: { name: groupAttrs.name}, include: 'records' })
        let record = group ? group.records[0].get({plain: true}).content : {}

        content[token] = record
      }

      // console.dir(tree, { depth: null })
      // console.dir(content, { depth: null })

      ctx.body = template.render(content)
    })
  }

  start () {
    this.httpServer = app.listen(this.port)
    this.fileWatcher = this.livereload && reloader.watch(this.siteRoot)
  }

  stop () {
    this.httpServer && httpServer.close()
    this.fileWatcher && fileWatcher.close()
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
