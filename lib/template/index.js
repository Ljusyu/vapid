const fs = require('fs')
const Goatee = require('./goatee')

class Template {
  constructor (file) {
    // TODO: Worried about this getting too big, so it's being cleared.
    Goatee.clearCache()
    this.html = fs.readFileSync(file, 'utf8')
  }

  render(content = {}) {
    let body = content.general.length ? _wrapHTML(this.html) : this.html
    return Goatee.render(body, content)
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
          let leafToken = leaf[1]
          tree[branchToken].fields[leafToken] = Object.assign(tree[branchToken].fields[leafToken] || {}, _parseToken(leaf[1]))
          break
        case '#':
          this.walk(tree, leaf[4], leaf[1])
          break
      }
    }

    return tree
  }

  initBranch(branchToken) {
    const { name, attributes } = _parseToken(branchToken)

    return {
      name: name,
      attributes: attributes,
      fields: {}
    }
  }
}

/*******************
 * PRIVATE METHODS
 *******************/

function _parseToken(token) {
  // TODO: Should be more fault tolerant of spaces, etc,
  //       and convert booleans, string, numbers
  const parts = token.split(/\s+/)
  const name = parts.shift()
  const attributes = _parseAttributes(parts)

  return {
    name: name,
    attributes: attributes
  }
}

function _parseAttributes(parts) {
  const attributes = {}

  for(var p of parts) {
    let [key, val] = p.split('=')
    attributes[key] = val
  }

  return attributes
}

function _wrapHTML(html) {
  return `{{#general}}${html}{{/general}}`
}

module.exports = Template
