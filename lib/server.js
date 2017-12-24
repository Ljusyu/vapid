const Koa = require('koa')
const Template = require('./template')

const cons = require('consolidate')
const fs = require('fs')
const getPaths = require('get-paths')
const logger = require('koa-log')
const path = require('path')
const serve = require('koa-static')

const app = new Koa()
const development = app.env == 'development'
const lrRE = /(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i
const lrScript = `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>`

let httpServer = undefined
let watcher = undefined

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

    this.root = site.localPath
    this.assets = path.resolve(this.root, 'assets')
    this.templates = path.resolve(this.root, 'templates')
    this.port = process.env.PORT || settings.port || 4567
    this.engine = settings.engine || 'html'

    app.use(serve(this.assets))
    app.use(logger(development ? 'tiny' : 'combined'))

    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        // Do something
      }
    })

    app.use(async ctx => {
      let paths = await getPaths(this.templates, ctx.path, this.engine)
      let html = await renderToString(this.templates + paths.rel, paths.ext)
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
    watcher = watch(this.root)
  }

  stop () {
    httpServer && httpServer.close()
    watcher && watcher.close()
    httpServer = watcher = undefined
  }
}

module.exports = Server
