const lr = require('livereload')
const path = require('path')

const re = /(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i
const script = `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>`
const exclusions = ['db/']

class LiveReload {
  watch() {
    let dir = vapid.site.paths.root
    let server = lr.createServer({ exclusions: _exclude(dir) })
    let watcher = server.watch(dir)
    
    vapid.log.info(`Watching for changes in ${dir}`)

    // TODO: Do we need to handle all three?
    watcher.on('change', _eventHandler)
    watcher.on('add',    _eventHandler)
    watcher.on('unlink', _eventHandler)

    vapid.models.Record.hook('afterSave',    _hookHandler.bind(server))
    vapid.models.Record.hook('afterDestroy', _hookHandler.bind(server))

    return server
  }

  injectScript(html) {
    return html.replace(re, `${script}\n$1`)
  }
}

function _exclude(dir) {
  return exclusions.map(e => { return path.resolve(dir, e) })
}

function _hookHandler() {
  this.refresh('')
  _eventHandler('*')
}

function _eventHandler(filepath) {
  if (/^\..*/.test(filepath)) return
  
  vapid.log.info(`LiveReload: ${filepath}`)
}

module.exports = LiveReload
