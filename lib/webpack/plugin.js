const Utils = require('../utils')

function RemoveFilesPlugin(options = {}) {
  this.files = options.files || []
}

RemoveFilesPlugin.prototype.apply = function(compiler) {

  compiler.hooks.emit.tap(this.constructor.name, (compilation) => {
    let assets = Utils.omit(compilation.assets, this.files)
    
    compilation.assets = assets
  })

}

module.exports = RemoveFilesPlugin
