const fs = require('fs')
const getPaths = require('get-paths')
const Koa = require('koa')
const logger = require('koa-log')
const path = require('path')
const serve = require('koa-static')

const dashboard = require('./dashboard')
const graphql = require('./graphql')
const LiveReload = require('./liveReload')
const Template = require('../template')
const { waterline, dbConfig } = require('../models')

const app = new Koa()
const reloader = new LiveReload()

let httpServer = undefined
let fileWatcher = undefined

class Server {
  constructor (site, options = {}) {
    const settings = site.settings()
    const logLevel = app.env == 'development' ? 'tiny' : 'combined'

    waterline.initialize(dbConfig, (err, models) => {
      if(err) throw err
    })

    this.livereload = options.livereload
    this.port = process.env.PORT || settings.port || 4567

    this.siteRoot = site.localPath
    this.siteAssets = path.join(this.siteRoot, 'assets')
    this.siteViews = path.join(this.siteRoot, 'templates')

    this.dashboardAssets = path.resolve(__dirname, '../../assets')
    this.dashboardViews = path.resolve(__dirname, '../../views')
    
    app
      .use(serve(this.siteAssets))
      .use(serve(this.dashboardAssets))
      .use(logger(logLevel))
      .use(dashboard.routes())
      .use(graphql.routes())

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
        // TODO: Why is it always throwing a 404?
        const status = ctx.status || 500
        const siteFile = path.join(this.siteViews, `${status}.html`)
        const errFile = fs.existsSync(siteFile) ? siteFile : path.join(this.dashboardViews, `/dashboard/${status}.html`)
        const rendered = new Template(errFile).render()

        ctx.status = status
        ctx.body = rendered
      }
    })

    app.use(async ctx => {
      const paths = await getPaths(this.siteViews, ctx.path, 'html')
      const file = path.join(this.siteViews, paths.rel)
      const rendered = new Template(file).render()
  
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
