const ejs = require('ejs')
const merge = require('deepmerge')

const DEFAULTS = {
  options: {},
  attrs: {
    required: true
  }
}

class Directive {
  constructor(params) {
    let defaults = merge(DEFAULTS, this.constructor.DEFAULTS || {})
    let [options, attrs] = _parseParams(params, defaults)

    this.options  = merge(defaults.options, options)
    this.attrs    = merge(defaults.attrs, attrs)
  }

  get template() {
    return `<input type="text" name="<%- name %>" <%- attrs %> value="<%- value %>">`
  }

  input(name, value = "") {
    let attrs = _formatAttrs(this.attrs)

    return ejs.render(this.template, {
      name: `content[${name}]`,
      value: value,
      attrs: attrs,
    })
  }

  serialize(value) {
    return value
  }

  deserialize(value) {
    return _coerceType(value)
  }

  render(value) {
    return value
  }
}

/*********************
 * PRIVATE METHODS
 *********************/

function _parseParams(params, defaults) {
  let options = {}
  let attrs = {}

  for (let [k,v] of Object.entries(params)) {
    v = _coerceType(v)

    if (defaults.options.hasOwnProperty(k)) {
      options[k] = v
    } else if (defaults.attrs.hasOwnProperty(k)) {
      attrs[k] = v
    }
  }

  return [options, attrs]
}

function _formatAttrs(attrs) {
  let pairs = []

  for (let [k,v] of Object.entries(attrs)) {
    if (v !== undefined) {
      pairs.push(`${k}="${v}"`)
    }
  }

  return pairs.join(' ')
}

function _coerceType(val) {
  try {
    return JSON.parse(val)
  } catch (err) {
    return val
  }
}

module.exports = Directive
