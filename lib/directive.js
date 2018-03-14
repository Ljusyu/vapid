class Directive {
  constructor (attrs) {
    // TODO: NO
    Object.assign(this, attrs)
  }

  input(name, value = "") {
    return `<input name="content[${name}]" value="${value}">`
  }

  serialize (val) {
    return coerceType(val)
  }

  deserialize (val) {
    return val
  }
}

function coerceType(val) {
  try {
    return JSON.parse(val)
  } catch (err) {
    return val
  }
}

module.exports = Directive
