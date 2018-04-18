const Utils = require('../utils')

function RemoveFilesPlugin(options = {}) {
  this.files = options.files || []
}

RemoveFilesPlugin.prototype.apply = function(compiler) {
  compiler.hooks.emit.tap(this.constructor.name, (compilation) => {
    compilation.assets = Utils.omit(compilation.assets, this.files)    
  })
}

module.exports = {
  RemoveFilesPlugin: RemoveFilesPlugin
}
