const _ = require('lodash')
const checksum = require('md5-file')
const mkdirp = require('mkdirp')
const pluralize = require('pluralize')

let Utils = _

Object.assign(Utils, {
  checksum: checksum.sync,

  isPlural: (str) => {
    return pluralize.isPlural(str)
  },

  mkdirp: mkdirp.sync,

  noop: () => {},

  pluralize: pluralize,

  singularize: function(str) {
    return this.pluralize(str, 1)
  }
})

module.exports = Utils
