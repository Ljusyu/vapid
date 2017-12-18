const Koa = require('koa')
const Router = require('koa-router')

const app = new Koa()
const router = new Router()
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
      .use(views(this.templates, { extension: this.engine }))
      .use(router.routes())

    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        console.log(err.message)
        // Render error
      }
    })

    router.get('/assets/(.*)', async (ctx, next) => {
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
