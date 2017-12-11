module.exports = class Template {
  constructor (html) {
    this.html = html
  }

  walk () { 
  }

  parse () {
    return {}
  }

  render () {
    return this.html
  }
}