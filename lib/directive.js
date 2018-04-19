const Utils = require('./utils')

const DEFAULTS = {
  options: {
    label: undefined,
    help: undefined
  },
  
  attrs: {
    placeholder: '',
    required: true
  }
}

const ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

class Directive {
  constructor(params) {
    let defaults = Utils.merge({}, DEFAULTS, this.constructor.DEFAULTS || {})
    let [options, attrs] = _parseParams(params, defaults)

    this.options  = Utils.merge(defaults.options, options)
    this.attrs    = Utils.merge(defaults.attrs, attrs)
  }

  get htmlAttrs() {
    let pairs = Utils.transform(this.attrs, (memo, value, key) => {
      if (value !== undefined && value !== false) {
        memo.push(`${key}="${value}"`)
      }
    }, [])

    return pairs.join(' ')
  }

  input(name, value = "") {
    return `<input type="text" name="${name}" value="${Utils.escape(value)}" ${this.htmlAttrs}>`
  }

  render(value) {
    return Utils.escape(value)
  }

  preview(value) {
    return this.render(value)
  }
}

/*********************
 * PRIVATE METHODS
 *********************/

function _parseParams(params, defaults) {
  let options = {}
  let attrs = {}

  for (let [k,v] of Object.entries(params)) {
    v = Utils.coerceType(v)

    if (defaults.options.hasOwnProperty(k)) {
      options[k] = v
    } else if (defaults.attrs.hasOwnProperty(k)) {
      attrs[k] = v
    }
  }

  return [options, attrs]
}

module.exports = Directive
