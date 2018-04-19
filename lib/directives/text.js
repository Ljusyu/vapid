const Utils = require('../utils')

const DEFAULTS = {
  attrs: {
    maxlength: undefined
  },

  options: {
    long: false
  }
}

module.exports = (vapid, Directive) => {
  class TextDirective extends Directive {
    static get DEFAULTS() {
      return DEFAULTS
    }

    input(name, value = "") {
      if (this.options.long) {
        return `<textarea name=${name} ${this.htmlAttrs}>${value}</textarea>`
      } else {
        let type = name.toLowerCase() == 'content[email]' ? 'email' : 'text'
        return `<input type="${type}" name="${name}" value="${Utils.escape(value)}" ${this.htmlAttrs}>`
      }
    }
  }

  return vapid.registerDirective('text', TextDirective)
}
