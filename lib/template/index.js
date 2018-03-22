const fs = require('fs')
const Goatee = require('./goatee')

const QUOTES = ["\"", "\'"]

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
        case 'text':
          break
        case '#':
          this.walk(tree, leaf[4], leaf[1])
          break
      }
    }

    return tree
  }

  initBranch(branchToken) {
    const { name, params } = _parseToken(branchToken)

    return {
      name: name,
      params: params,
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
  const [_, name, remainder] = token.match(/(\w+)(?:\s*)(.*)/)
  const params = _parseParams(remainder)

  return {
    name: name,
    params: params
  }
}

function _parseParams(str) {
  const params = {}
  const args = str.match(/(?:[\w.]+|"[^=]*)\s*=\s*(?:[\w,-]+|"[^"]*")/g) || []

  for(var a of args) {
    let [key, val] = a.split('=')
    params[key] = _stripQuotes(val)
  }

  return params
}

function _stripQuotes(str) {
  let lastIndex = str.length - 1
  let first = str.charAt(0)
  let last = str.charAt(lastIndex)

  if (first == last && QUOTES.indexOf(first) >= 0) {
    return str.substring(1, lastIndex)
  } else {
    return str
  }
}

function _wrapHTML(html) {
  return `{{#general}}${html}{{/general}}`
}

module.exports = Template
