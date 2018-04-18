const lr = require('livereload')
const path = require('path')
const Utils = require('../utils')

const re = /(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i
const script = `<script>document.write('<script src="//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>`
const exclusions = ['db/']

class LiveReload {
  watch(callback = Utils.noop) {
    let dir = vapid.site.paths.root
    let watcher

    this.callback = callback
    this.server = lr.createServer({ exclusions: _exclude(dir) })    
    
    watcher = this.server.watch(dir)
    watcher.on('add',    _eventHandler.bind(this))
    watcher.on('change', _eventHandler.bind(this))
    watcher.on('unlink', _eventHandler.bind(this))

    vapid.log.info(`Watching for changes in ${dir}`)
  }

  unwatch() {
    this.server && this.server.close()
  }

  reloadAll() {
    if (!this.server) return

    this.server.refresh('*')
    _eventHandler.call(this, '*')
  }

  injectScript(html) {
    return html.replace(re, `${script}\n$1`)
  }
}

function _exclude(dir) {
  return exclusions.map(e => { return path.resolve(dir, e) })
}

function _eventHandler(filepath) {
  if (/^\..*/.test(filepath)) return

  this.callback()
    
  if (path.extname(filepath) == '.scss') {
    let refreshpath = filepath.replace('.scss', '.css')
    console.log(refreshpath)
    this.server.refresh(refreshpath)
  }

  vapid.log.info(`LiveReload: ${filepath}`)
}

module.exports = LiveReload