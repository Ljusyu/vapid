const express = require('express')
const logger = require('morgan')
const fs = require('fs')
const cons = require('consolidate')
const path = require('path')
const getPaths = require('get-paths')
const Template = require('./template')

const app = express()
const development = app.get('env') === 'development'
const re = /(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i
const lrScript = `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>`

let httpServer = undefined
let watcher = undefined

module.exports = class Server {
  constructor (site, options) {
    const settings = site.settings()

    this.root = site.localPath
    this.assets = path.resolve(this.root, 'assets')
    this.templates = path.resolve(this.root, 'templates')
    this.port = process.env.PORT || settings.port || 4567
    this.engine = settings.engine || 'html'

    app.use(express.static(this.assets)) // Listed before logger, so assets are silenced
    app.use(logger(development ? 'dev' : 'combined'))

    app.get('*', async (req, res, next) => {
      try {
        let paths = await getPaths(this.templates, req.path, this.engine)
        let html = await renderToString(this.templates + paths.rel, paths.ext)
        let rendered = await new Template(html).render()

        // TODO: Better script injection
        if (development) {
          rendered = rendered.replace(re, `${lrScript}\n$1`)
        }

        res.send(rendered)
      } catch (err) {
        // TODO: Render custom or Vapid 404?
        next(err)
      }
    })
  }

  start () {
    httpServer = app.listen(this.port)

    // TODO: Maybe 'livereload' should be passed in as an option?
    if (development) {
      watcher = require('livereload').createServer()
      watcher.watch(this.root)
    }
  }

  stop () {
    httpServer && httpServer.close()
    watcher && watcher.close()
    httpServer = watcher = undefined
  }
}

async function renderToString(file, ext) {
  return ext == 'html' ? fs.readFileSync(file, 'utf8') : cons[ext](file, {})
}