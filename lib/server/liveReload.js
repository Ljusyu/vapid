const lr = require('livereload')
const path = require('path')
const Logger = require('../logger')

const re = /(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i
const script = `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>`

class LiveReload {
  watch() {
    let dir = vapid.site.paths.root
    let server = lr.createServer()
    let watcher = server.watch(dir)
    
    Logger.info(`Watching for changes in ${dir}`)

    watcher.on('change', (filepath) => {
      Logger.info(`LiveReload: ${filepath}`)
    })

    return server
  }

  injectScript(html) {
    return html.replace(re, `${script}\n$1`)
  }
}

module.exports = LiveReload
