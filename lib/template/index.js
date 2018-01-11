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

  walk(tree, branch, branchName = 'default') {
    tree[branchName] = tree[branchName] || []

    for(let leaf of branch) {
      switch(leaf[0]) {
        case 'name':
          tree[branchName].push(leaf[1])
          break
        case '#':
          this.walk(tree, leaf[4], leaf[1])
          break
      }
    }

    return tree
  }
}

module.exports = Template
