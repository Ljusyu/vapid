const pluralize = require('pluralize')

module.exports = {
  isPlural: function (str) {
    return pluralize.isPlural(str)
  },

  humanize: function (str) {
    return str
      .replace(/^[\s_]+|[\s_]+$/g, '')
      .replace(/[_\s]+/g, ' ')
      .replace(/^[a-z]/, m => { return m.toUpperCase() }); 
  },

  pluralize: pluralize,

  singularize: function(str) {
    return this.pluralize(str, 1)
  },

  titleize: function( str) {
    return this.humanize(str)
  }
}
