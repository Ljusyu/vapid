module.exports = class Template {
  constructor (html) {
    this.html = html
  }

  async render () {
    return this.html
  }
}