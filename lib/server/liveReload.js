const lr = require('livereload')
const path = require('path')

const re = /(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i
const script = `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>`

class LiveReload {
  watch() {
    let dir = vapid.site.paths.root
    let server = lr.createServer()
    let watcher = server.watch(dir)
    
    vapid.log.info(`Watching for changes in ${dir}`)

    // TODO: Do we need to handle all three?
    watcher.on('change', _eventHandler)
    watcher.on('add',    _eventHandler)
    watcher.on('unlink', _eventHandler)

    vapid.models.Record.hook('afterSave', (record) => {
      server.refresh('')
      _eventHandler('*')
    })

    return server
  }

  injectScript(html) {
    return html.replace(re, `${script}\n$1`)
  }
}

function _eventHandler(filepath) {
  vapid.log.info(`LiveReload: ${filepath}`)
}

module.exports = LiveReload
