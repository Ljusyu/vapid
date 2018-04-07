const unfurl = require('unfurl.js')

module.exports = (vapid, Directive) => {
  class LinkDirective extends Directive {
    get template() {
      return `<input type="url" name="<%- name %>" <%- attrs %> value="<%- value %>">`
    }

    async render(value) {
      if (!value) return

      try {
        let result = await unfurl(value)
        return result.oembed.html
      } catch (err) {
        return `<a href="${value}">${value}</a>`
      }
    }
  }

  return vapid.registerDirective('link', LinkDirective)
}