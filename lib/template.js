class Template {
  constructor (html) {
    this.html = html
  }

  async render () {
    return this.html
  }

  async renderToString(file, ext) {
    return ext == 'html' ? fs.readFileSync(file, 'utf8') : cons[ext](file, {})
  }
}

module.exports = Template
