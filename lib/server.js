const Koa = require('koa')
const Router = require('koa-router')

const app = new Koa()
const router = new Router()
const logger = require('koa-log')
const path = require('path')
const views = require('koa-views')
const send = require('koa-send')

module.exports = class Server {
  constructor (site) {
    let settings = site.settings()

    this.root = site.localPath    
    this.templates = path.resolve(this.root, 'templates')
    this.port = process.env.PORT || settings.port || 4567
    this.engine = settings.engine

    app
      .use(logger('short'))
      .use(views(this.templates, { extension: this.engine }))
      .use(router.routes())

    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        // Do something with the error
      }
    })

    router.get(['/assets/(.*)', '/favicon.ico'], async (ctx, next) => {
      await send(ctx, ctx.path, { root: this.root })
    });

    app.use(async (ctx, next) => {
      await ctx.render(ctx.path)
    })
  }

  start () {
    app.listen(this.port)
  }
}
