const lr = require('livereload')
const { extname } = require('path')
const Utils = require('../utils')
const reSass = /\.s[ac]ss$/

class Watcher {
  constructor(paths = []) {
    this.paths = Utils.castArray(paths)
  }

  listen(config, callback = Utils.noop) {
    this.callback = callback
    this.server = lr.createServer(config)
    this.server.watch(this.paths)
               .on('add',    _eventHandler.bind(this))
               .on('change', _eventHandler.bind(this))
               .on('unlink', _eventHandler.bind(this))

    vapid.log.info(`Watching for changes in ${this.paths}`)
  }

  close() {
    this.server && this.server.close()
  }

  refresh(filePath = '*') {
    if (!this.server) return

    let refreshPath = filePath.replace(reSass, '.css')
    this.server.refresh(refreshPath)
    vapid.log.info(`LiveReload: ${filePath}`)
  }
}

function _eventHandler(filePath) {
  // Ignore hidden files
  if (/^\..*/.test(filePath)) return

  if (extname(filePath).match(reSass)) {
    setTimeout(function () {
      this.callback()
      this.refresh(filePath)
    }.bind(this))
    return
  }

  this.callback()  
  vapid.log.info(`LiveReload: ${filePath}`)
}

module.exports = Watcher
