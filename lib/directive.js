const ejs = require('ejs')

const defaults = {
  template: '<input type="text" name="<%- name %>" <%- attributes %> value="<%- value %>">',
  attributes: {
    required:    true,
    placeholder: undefined,
    minlength:   undefined,
    maxlength:   undefined
  }
}

class Directive {
  constructor (params) {
    // TODO: Is there a better, or more succinct way of doing this?
    this.template = params.template || defaults.template
    this.attributes =   Object.assign({}, defaults.attributes, params.attributes || {})
    this.options = params.options || {}
    this.filters = params.filters || {}
    this.serialize = typeof params.serialize == 'function' ? params.serialize : this.serialize
    this.deserialize = typeof params.deserialize == 'function' ? params.deserialize : this.deserialize
  }

  input(name, value = "") {
    let template = typeof this.template == 'function' ? this.template(this.options) : this.template
    let attributes = formatAttributes(this.attributes)

    return ejs.render(template, {
      name: `content[${name}]`,
      value: value,
      attributes: attributes,
    })
  }

  serialize (val) {
    return coerceType(val)
  }

  deserialize (val) {
    return val
  }
}

// TODO:
function formatAttributes(attributes) {
  let pairs = []

  for (let [k,v] of Object.entries(attributes)) {
    if (v !== undefined) {
      pairs.push(`${k}="${v}"`)
    }
  }

  return pairs.join(' ')
}

function coerceType(val) {
  try {
    return JSON.parse(val)
  } catch (err) {
    return val
  }
}

module.exports = Directive
