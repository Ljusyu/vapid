const repl = require('repl')

class Console {
  constructor(site) {
    this.site = site
  }

  initializeContext(context) {
    context.site = this.site
  }

  start() {
    const r = repl.start({ prompt: 'vapid>' })

    this.initializeContext(r.context)
    r.on('reset', () => { this.initializeContext(r.context) })
  }
}

module.exports = Console
