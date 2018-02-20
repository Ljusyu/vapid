const fs = require('fs')
const Goatee = require('./goatee')

class Template {
  constructor (file) {
    // TODO: Worried about this getting too big, so it's being cleared.
    Goatee.clearCache()
    this.html = fs.readFileSync(file, 'utf8')
  }

  render(content = {}) {
    return Goatee.render(this.html, content)
  }

  parse () {
    const tokens = Goatee.parse(this.html)
    return this.walk({}, tokens)
  }

  walk(tree, branch, branchToken = 'general') {
    tree[branchToken] = tree[branchToken] || this.initBranch(branchToken)

    for(let leaf of branch) {
      switch(leaf[0]) {
        case 'name':
          tree[branchToken].fields.push( this.parseToken(leaf[1]) )
          break
        case '#':
          this.walk(tree, leaf[4], leaf[1])
          break
      }
    }

    return tree
  }

  initBranch(branchToken) {
    const { name, attributes } = this.parseToken(branchToken)

    return {
      name: name,
      attributes: attributes,
      fields: []
    }
  }

  parseToken(token) {
    // TODO: Should be more fault tolerant of spaces, etc,
    //       and convert booleans, string, numbers
    const parts = token.split(/\s+/)
    const name = parts.shift()
    const attributes = this.parseAttributes(parts)

    return {
      name: name,
      attributes: attributes
    }
  }

  parseAttributes(parts) {
    const attributes = {}

    for(var p of parts) {
      let [key, val] = p.split('=')
      attributes[key] = val
    }

    return attributes
  }
}

module.exports = Template
