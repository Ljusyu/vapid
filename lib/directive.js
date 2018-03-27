const _ = require('lodash')
const ejs = require('ejs')

const DEFAULTS = {
  options: {
    label: undefined,
    help: undefined
  },
  
  attrs: {
    required: true,
    placeholder: undefined
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
    let defaults = _.merge({}, DEFAULTS, this.constructor.DEFAULTS || {})
    let [options, attrs] = _parseParams(params, defaults)

    this.options  = _.merge(defaults.options, options)
    this.attrs    = _.merge(defaults.attrs, attrs)
  }

  get template() {
    return `<input type="text" name="<%- name %>" <%- attrs %> value="<%- value %>">`
  }

  input(name, value = "") {
    let attrs = _formatAttrs(this.attrs)

    return ejs.render(this.template, {
      name: `content[${name}]`,
      value: this._escape(value),
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
    return this._escape(value)
  }

  _escape(val = "") {
    return String(val).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return ENTITY_MAP[s]
    });
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
    // TODO: Maybe need a better check than this. Just trying to cater to require=false
    if (v !== undefined && v !== false) {
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
