const directives = []

class Directive {
  constructor (expr) {
    this.expr = expr.trim()
    this.name = undefined
    this.options = {}

    this.parseExpr(expr)
  }

  input(name) {
    return `<input name="${name}">`
  }

  serialize (val) {
    return val
  }

  deserialize (val) {
    return val
  }

  parseExpr(expr) {
    let parts = this.expr.split(/\s+/)
    
    this.name = parts.shift()

    parts.forEach((part) => {
      // TODO: Handle quoted strings and escape characters
      let p = part.match(/(\w+)\s*=\s*(.+)/)
      this.options[p[1]] = this.coerceType(p[2])
    })
  }

  coerceType(val) {
    try {
      return JSON.parse(val)
    } catch (err) {
      return val
    }
  }
}

module.exports = directives
