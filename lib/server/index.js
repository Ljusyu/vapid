const bodyParser = require('koa-bodyparser')
const cons = require('consolidate')
const fs = require('fs')
const getPaths = require('get-paths')
const Koa = require('koa')
const logger = require('koa-log')
const path = require('path')
const passport = require('koa-passport')
const serve = require('koa-static')
const session = require('koa-session')

const Template = require('../template')
const dashboard = require('./dashboard')
const auth = require('./dashboardAuth')

const app = new Koa()
const development = app.env == 'development'
const lrRE = /(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i
const lrScript = `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>`

let httpServer = undefined
let fileWatcher = undefined

async function renderToString(file, ext) {
  return ext == 'html' ? fs.readFileSync(file, 'utf8') : cons[ext](file, {})
}

function watch(dir) {
  if (!development) return

  lrServer = require('livereload').createServer()
  lrServer.watch(dir)
  return lrServer
}

class Server {
  constructor (site, options) {
    const settings = site.settings()

    this.siteRoot = site.localPath
    this.siteAssets = path.resolve(this.siteRoot, 'assets')
    this.siteViews = path.resolve(this.siteRoot, 'templates')

    this.dashboardAssets = path.resolve(__dirname, '../../assets')
    this.dashboardViews = path.resolve(__dirname, '../../views')

    this.port = process.env.PORT || settings.port || 4567
    this.engine = settings.engine || 'html'

    app.keys = ['your-session-secret']
    
    app
      .use(bodyParser())
      .use(session({}, app))
      .use(passport.initialize())
      .use(passport.session())
      .use(serve(this.siteAssets))
      .use(serve(this.dashboardAssets))
      .use(auth.routes())
      .use(dashboard.routes())
      .use(logger(development ? 'tiny' : 'combined'))

    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        console.log(err)
        // Do something
      }
    })

    app.use(async ctx => {
      let paths = await getPaths(this.siteViews, ctx.path, this.engine)
      let html = await renderToString(this.siteViews + paths.rel, paths.ext)
      let rendered = await new Template(html).render()

      // TODO: Better script injection
      if (development) {
        rendered = rendered.replace(lrRE, `${lrScript}\n$1`)
      }

      ctx.body = rendered
    })
  }

  start () {
    httpServer = app.listen(this.port)
    fileWatcher = watch(this.siteRoot)
  }

  stop () {
    httpServer && httpServer.close()
    fileWatcher && fileWatcher.close()
    httpServer = fileWatcher = undefined
  }
}

module.exports = Server
