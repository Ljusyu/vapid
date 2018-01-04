const bodyParser = require('koa-bodyparser')
const cons = require('consolidate')
const dashboard = require('./dashboard')
const fs = require('fs')
const getPaths = require('get-paths')
const Koa = require('koa')
const LiveReload = require('./liveReload')
const logger = require('koa-log')
const path = require('path')
const serve = require('koa-static')
const Template = require('../template')

const app = new Koa()
const reloader = new LiveReload()

let httpServer = undefined
let fileWatcher = undefined

// TODO: Move this into Template, and determine engine dynamically from extension?
async function renderToString(file, ext) {
  return ext == 'html' ? fs.readFileSync(file, 'utf8') : cons[ext](file, {})
}

class Server {
  constructor (site, options = {}) {
    let settings = site.settings()
    let logLevel = app.env == 'development' ? 'tiny' : 'combined'

    this.livereload = options.livereload
    this.engine = settings.engine || 'html'
    this.port = process.env.PORT || settings.port || 4567

    this.siteRoot = site.localPath
    this.siteAssets = path.resolve(this.siteRoot, 'assets')
    this.siteViews = path.resolve(this.siteRoot, 'templates')

    this.dashboardAssets = path.resolve(__dirname, '../../assets')
    this.dashboardViews = path.resolve(__dirname, '../../views')
    
    app
      .use(bodyParser())
      .use(serve(this.siteAssets))
      .use(serve(this.dashboardAssets))
      .use(dashboard.routes())
      .use(logger(logLevel))

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
        // Look for custom errors, and fallback to system
        const status = ctx.status || 500
        const siteTpl = `${this.siteViews}/${status}.html`
        const dashboardTpl = `${this.dashboardViews}/dashboard/${status}.html`
        let rendered = await renderToString(siteTpl, this.engine).catch(async function () { return await renderToString(dashboardTpl, 'html') })

        ctx.status = status
        ctx.body = rendered
      }
    })

    app.use(async ctx => {
      let paths = await getPaths(this.siteViews, ctx.path, this.engine)
      let html = await renderToString(this.siteViews + paths.rel, paths.ext)
      let rendered = await new Template(html).render()
  
      ctx.body = rendered
    })
  }

  start () {
    httpServer = app.listen(this.port)
    fileWatcher = this.livereload && reloader.watch(this.siteRoot)
  }

  stop () {
    httpServer && httpServer.close()
    fileWatcher && fileWatcher.close()
    httpServer = fileWatcher = undefined
  }
}

module.exports = Server
