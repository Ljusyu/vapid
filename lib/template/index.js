const fs = require('fs')
const Boom = require('boom')
const Goatee = require('./goatee')
const Utils = require('../utils')

const QUOTES = ["\"", "\'"]
const TOKEN_REGEX = /^(?:section\s)?(\w+)(.*)/i

class Template {
  constructor (file) {
    // TODO: Worried about this getting too big, so it's being cleared.
    Goatee.clearCache()
    this.html = fs.readFileSync(file, 'utf8')
  }

  render(content = {}) {
    let body = content.general && content.general.length ? _wrapHTML(this.html) : this.html
    return Goatee.render(body, content)
  }

  parse () {
    let tokens

    try {
      tokens = Goatee.parse(this.html)
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Bad template syntax'
      })
    }
    
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
          let [_, keyword] = leaf[1].toLowerCase().match(TOKEN_REGEX)

          if (!Utils.includes(Goatee.CONDITIONALS, keyword)) {
            this.walk(tree, leaf[4], leaf[1])
          } else {
            this.walk(tree, leaf[4], branchToken)
          }
      }
    }

    return tree
  }

  initBranch(branchToken) {
    const { name, params } = _parseToken(branchToken)

    return {
      name: name.toLowerCase(),
      params: params,
      fields: {}
    }
  }
}

/*******************
 * PRIVATE METHODS
 *******************/

function _parseToken(token) {
  let [_, name, remainder] = token.match(TOKEN_REGEX)

  return {
    name: name.toLowerCase(),
    params: _parseParams(remainder)
  }
}

function _parseParams(str) {
  const params = {}
  // TODO: Need to improve/fix this to handle all kinds of quotes/escapes
  const args = str.match(/(?:[\w.]+|"[^=]*)\s*=\s*(?:[\w,-]+|"[^"]*")/g) || []

  for(var a of args) {
    let [key, val] = a.split('=')
    params[key.toLowerCase()] = _stripQuotes(val)
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
