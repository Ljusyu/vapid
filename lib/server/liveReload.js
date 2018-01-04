const lr = require('livereload')
const Logger = require('../logger')

const re = /(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i
const script = `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>`

class LiveReload {
  watch(dir) {
    let server = lr.createServer()
    server.watch(dir)
    Logger.info(`Watching for changes in ${dir}`)
    return server
  }

  injectScript(html) {
    return html.replace(re, `${script}\n$1`)
  }
}

module.exports = LiveReload
