const lr = require('livereload')
const path = require('path')
const Logger = require('../logger')

const re = /(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i
const script = `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>`

class LiveReload {
  watch(dir) {
    let server = lr.createServer()
    let watcher = server.watch(dir)
    
    Logger.info(`Watching for changes in ${dir}`)

    watcher.on('change', (filepath) => {
      // TODO: Force reload HTML if DB changes?
      if (path.extname(filepath) == '.sqlite') return

      Logger.info(`LiveReload: ${filepath}`)
    })

    return server
  }

  injectScript(html) {
    return html.replace(re, `${script}\n$1`)
  }
}

module.exports = LiveReload
