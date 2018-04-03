const _ = require('lodash')
const pluralize = require('pluralize')

let Utils = _

Object.assign(Utils, {
  isPlural: function (str) {
    return pluralize.isPlural(str)
  },

  noop: () => {},

  pluralize: pluralize,

  singularize: function(str) {
    return this.pluralize(str, 1)
  }
})

module.exports = Utils
