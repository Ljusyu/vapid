const Koa = require('koa')
const Template = require('./template')

const app = new Koa()
const logger = require('koa-log')
const serve = require('koa-static')
const cons = require('consolidate')
const fs = require('fs')
const path = require('path')
const getPaths = require('get-paths')

let httpServer = undefined

module.exports = class Server {
  constructor (site) {
    let settings = site.settings()

    this.assets = path.resolve(site.localPath, 'assets')
    this.templates = path.resolve(site.localPath, 'templates')
    this.port = process.env.PORT || settings.port || 4567
    this.engine = settings.engine || 'html'

    app
      .use(logger('short'))
      .use(serve(this.assets))

    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        // TODO: Custom 404 or fallback
      }
    })

    app.use(async (ctx, next) => {
      let paths = await getPaths(this.templates, ctx.path, this.engine)
      let html = await renderToString(this.templates + paths.rel, paths.ext)
      let template = new Template(html)

      ctx.body = await template.render()
    })
  }

  start () {
    httpServer = app.listen(this.port)
  }

  stop () {
    httpServer && httpServer.close()
    httpServer = undefined
  }
}

async function renderToString(file, ext) {
  return ext == 'html' ? fs.readFileSync(file, 'utf8') : cons[ext](file, {})
}